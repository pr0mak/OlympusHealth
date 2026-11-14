"""Exploratory contextual bandit for scheduling *adherence*, not bone outcomes.

All learning is in process memory (lost on restart). Feedback is self-reported or
explicitly synthetic; this is NOT a medically validated exercise prescription.
"""
from dataclasses import dataclass, field
from typing import Literal
import random
import threading
import uuid
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .exercise import ExercisePreferences
from .schemas import OptimizeRequest, Profile
from .mpc import optimize

router = APIRouter(prefix='/api/v1/ai', tags=['Adaptive exercise prototype'])

ARMS = (
    {'id': 'balanced', 'label': 'Balanced', 'fraction': .5, 'durationFactor': 1.0},
    {'id': 'resistance', 'label': 'Resistance focus', 'fraction': .7, 'durationFactor': .9},
    {'id': 'lighter', 'label': 'Lighter session', 'fraction': .35, 'durationFactor': .65},
)
DIM = 4
ALPHA = .60

class Context(BaseModel):
    sleepHours: float = Field(default=7, ge=0, le=16)
    fatigueBefore: float = Field(default=30, ge=0, le=100)
    availableMinutes: float = Field(default=60, ge=0, le=180)

class RecommendationRequest(BaseModel):
    astronautId: str = Field(default='DEMO-001', min_length=1, max_length=80)
    mode: Literal['demo', 'live'] = 'demo'
    context: Context = Field(default_factory=Context)
    weeklyBudgetMinutes: float = Field(default=280, ge=0, le=1260)
    fatigueCeiling: float = Field(default=80, ge=10, le=100)

class FeedbackRequest(BaseModel):
    astronautId: str = Field(default='DEMO-001', min_length=1, max_length=80)
    mode: Literal['demo', 'live'] = 'demo'
    recommendationId: str = Field(min_length=1)
    completionPercent: float = Field(ge=0, le=100)
    fatigueAfter: float = Field(ge=0, le=100)

class DemoTrainRequest(BaseModel):
    astronautId: str = Field(default='DEMO-001', min_length=1, max_length=80)
    rounds: int = Field(default=30, ge=1, le=100)

@dataclass
class Learner:
    A: dict = field(default_factory=lambda: {a['id']: np.eye(DIM) for a in ARMS})
    b: dict = field(default_factory=lambda: {a['id']: np.zeros(DIM) for a in ARMS})
    counts: dict = field(default_factory=lambda: {a['id']: 0 for a in ARMS})
    pending: dict = field(default_factory=dict)
    history: list = field(default_factory=list)
    n: int = 0

_STORE: dict[tuple[str, str], Learner] = {}
_LOCK = threading.RLock()


def features(c: Context) -> np.ndarray:
    return np.array([1., (c.sleepHours-7)/7, (c.fatigueBefore-50)/50, (c.availableMinutes-60)/60])


def scores(learner: Learner, c: Context):
    x = features(c)
    result = []
    for a in ARMS:
        arm = a['id']
        theta = np.linalg.solve(learner.A[arm], learner.b[arm])
        width = np.sqrt(max(0., float(x @ np.linalg.solve(learner.A[arm], x))))
        result.append({'armId': arm, 'label': a['label'], 'estimatedReward': round(float(theta @ x), 4),
                       'explorationBonus': round(float(ALPHA * width), 4),
                       'ucbScore': round(float(theta @ x + ALPHA * width), 4), 'observations': learner.counts[arm]})
    return result


def update(learner: Learner, arm: str, c: Context, completion: float, fatigue: float, *, synthetic: bool):
    x = features(c)
    # Reward proxy: adherence minus post-session fatigue. NOT bone health.
    reward = .7 * completion / 100 - .3 * fatigue / 100
    learner.A[arm] += np.outer(x, x)
    learner.b[arm] += reward * x
    learner.counts[arm] += 1
    learner.n += 1
    learner.history.append({'round': learner.n, 'armId': arm,
                            'reward': round(float(reward), 4),
                            'completionPercent': round(completion, 2),
                            'fatigueAfter': round(fatigue, 2), 'synthetic': synthetic})
    learner.history = learner.history[-200:]
    return reward


def _get(id: str, mode: str) -> Learner:
    return _STORE.setdefault((mode, id), Learner())


def _status(id: str, mode: str, context: Context | None = None):
    l = _get(id, mode)
    return {'astronautId': id, 'mode': mode, 'feedbackCount': l.n,
            'arms': [{'id': a['id'], 'label': a['label'], 'count': l.counts[a['id']]} for a in ARMS],
            'history': l.history, 'scores': scores(l, context or Context()),
            'learningState': 'untrained' if not l.n else 'learning_from_feedback',
            'dataRetention': 'in_memory_until_python_restart',
            'medicalValidation': False,
            'disclaimer': 'The bandit learns adherence/fatigue proxy, NOT BMD, bone strength, injury risk, or medically safe dosage.'}


@router.get('/status')
def status(astronautId: str='DEMO-001', mode: Literal['demo', 'live']='demo'):
    with _LOCK:
        return _status(astronautId, mode)


@router.post('/recommend')
def recommend(req: RecommendationRequest):
    if req.context.fatigueBefore > req.fatigueCeiling:
        raise HTTPException(422, 'Initial fatigue exceeds the configured model ceiling')
    with _LOCK:
        learner = _get(req.astronautId, req.mode)
        ranking = scores(learner, req.context)
        winner = max(ranking, key=lambda r: r['ucbScore'])
        arm = next(a for a in ARMS if a['id'] == winner['armId'])
        # The policy can select only preapproved scheduling profiles. All
        # proposed minutes still pass through the existing MPC optimizer.
        prefs = ExercisePreferences(target_minutes_per_day=req.context.availableMinutes * arm['durationFactor'],
                                    resistance_fraction=arm['fraction'],
                                    resistance_intensity='moderate', aerobic_intensity='moderate')
        plan_req = OptimizeRequest(profile=Profile(astronaut_id=req.astronautId,
                                                    initial_fatigue=req.context.fatigueBefore),
                                   exercise_budget_minutes=req.weeklyBudgetMinutes,
                                   fatigue_limit=req.fatigueCeiling, exercise=prefs)
        try:
            plan = optimize(plan_req)
        except (ValueError, RuntimeError) as exc:
            raise HTTPException(422, str(exc)) from exc
        # Only allow one unconsumed recommendation at a time for an id/mode.
        # Otherwise stale feedback can alter the wrong contextual decision.
        learner.pending.clear()
        rec_id = uuid.uuid4().hex
        learner.pending[rec_id] = (arm['id'], req.context)
        return {'recommendationId': rec_id, 'astronautId': req.astronautId,
                'mode': req.mode, 'selectedArm': winner,
                'alternatives': ranking, 'exercisePlan': {'days': plan.exercise_sessions,
                'totalMinutes': round(sum(plan.schedule_minutes),2)},
                'feedbackCount': learner.n,
                'reason': f"LinUCB selected {arm['label']} using context and previous feedback. MPC checked the model budget and fatigue ceiling.",
                'disclaimer': 'Optimization uses hypothetical fatigue dynamics. Not a clinical exercise prescription or a predicted bone improvement.'}


@router.post('/feedback')
def feedback(req: FeedbackRequest):
    with _LOCK:
        l = _get(req.astronautId, req.mode)
        item = l.pending.pop(req.recommendationId, None)
        if item is None:
            raise HTTPException(404, 'Unknown/already consumed recommendation. Request a new plan first.')
        arm, context = item
        reward = update(l, arm, context, req.completionPercent, req.fatigueAfter, synthetic=req.mode=='demo')
        return {'accepted': True, 'reward': round(float(reward),4), 'armId': arm,
                'rewardDefinition': '0.7 * (completionPercent / 100) - 0.3 * (fatigueAfter / 100)',
                'status': _status(req.astronautId, req.mode, context)}


@router.post('/demo/train')
def demo_train(req: DemoTrainRequest):
    # DEMONSTRATION ONLY: synthetic feedback from a fixed pedagogical rule.
    # Not an empirical exercise or health outcome model.
    with _LOCK:
        l = _get(req.astronautId, 'demo')
        rng = random.Random(1009 + l.n)
        for i in range(req.rounds):
            c = Context(sleepHours=rng.uniform(5, 9), fatigueBefore=rng.uniform(15, 85),
                        availableMinutes=rng.uniform(25, 80))
            arm = ARMS[l.n % len(ARMS)]['id']
            # Synthetic feedback gives light workouts an advantage when tired.
            tired = c.fatigueBefore > 55
            fit = (arm == 'lighter' and tired) or (arm == 'balanced' and not tired)
            completion = min(100., max(35., 89 if fit else 62) + rng.uniform(-6,6))
            fatigue = min(100., max(5., (30 if fit else 65) + rng.uniform(-7,7)))
            update(l, arm, c, completion, fatigue, synthetic=True)
        return {'syntheticRoundsAdded': req.rounds, 'label': 'SIMULATED feedback; NOT NASA measurements',
                'status': _status(req.astronautId, 'demo')}


@router.post('/reset')
def reset(astronautId: str='DEMO-001', mode: Literal['demo','live']='demo'):
    with _LOCK:
        _STORE.pop((mode, astronautId), None)
        return {'reset': True, 'status': _status(astronautId,mode)}
