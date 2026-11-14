"""Evidence-bounded joint viewer. Do not synthesize exercise treatment effects.

The three data families refer to different body sites/studies and are NOT a
jointly observed astronaut record. A hypothetical personal measurement never
becomes 'verified NASA data' by entering it into the API.
"""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field, model_validator
from .schemas import OptimizeRequest, Profile
from .exercise import ExercisePreferences
from .mpc import optimize
from .bmd_reference import reference_trajectory, SOURCE_DOI
from .bone_metrics import bone_metrics
from .bone_quality_dynamics import quality_recovery_curve
from .tbone_quality import published_tbone_quality
from .tbone_metabolism import published_tbone_metabolism

class RealObservation(BaseModel):
    metric_id: str
    value: float
    unit: str
    phase: Literal['preflight', 'inflight', 'return', 'postflight']
    day: int = Field(ge=0, le=1200)
    provenance: Literal['user_supplied_unverified', 'verified_external'] = 'user_supplied_unverified'
    source_url: str | None = None

    @model_validator(mode='after')
    def validate_provenance(self):
        # Public API cannot certify data provenance from a user-supplied label.
        if self.provenance == 'verified_external':
            raise ValueError('Verified external observations must be imported by a curated server process')
        return self

class EvidencePlanRequest(BaseModel):
    astronaut_id: str = Field(default='DEMO-001', max_length=80)
    mission_days: int = Field(default=180, ge=1, le=1200)
    initial_femoral_neck_bmd_g_cm2: float | None = Field(default=None, gt=0, le=2.5)
    quality_metric: str = 'failure_load'
    recovery_day: int = Field(default=180, ge=0, le=365)
    weekly_exercise_budget: float = Field(default=210, ge=0, le=1260)
    exercise_target_per_day: float = Field(default=45, ge=0, le=180)
    resistance_fraction: float = Field(default=0.5, ge=0, le=1)
    resistance_intensity: Literal['low','moderate','high'] = 'moderate'
    aerobic_intensity: Literal['low','moderate','high'] = 'moderate'
    initial_fatigue: float = Field(default=20, ge=0, le=100)
    fatigue_ceiling: float = Field(default=70, ge=10, le=100)
    observations: list[RealObservation] = Field(default_factory=list, max_length=300)


def build_evidence_plan(req: EvidencePlanRequest) -> dict:
    quality = published_tbone_quality()
    if req.quality_metric not in {m['id'] for m in quality['metrics']}:
        raise ValueError('Unknown quality metric')
    if req.initial_fatigue > req.fatigue_ceiling:
        raise ValueError('Initial fatigue exceeds chosen ceiling')
    profile = Profile(astronaut_id=req.astronaut_id, initial_fatigue=req.initial_fatigue,
                      initial_bmd_g_cm2=req.initial_femoral_neck_bmd_g_cm2)
    prefs = ExercisePreferences(target_minutes_per_day=req.exercise_target_per_day,
                                resistance_fraction=req.resistance_fraction,
                                resistance_intensity=req.resistance_intensity,
                                aerobic_intensity=req.aerobic_intensity)
    optimizer_request = OptimizeRequest(profile=profile, planning_days=7,
                                        exercise_budget_minutes=req.weekly_exercise_budget,
                                        fatigue_limit=req.fatigue_ceiling, exercise=prefs)
    optimized = optimize(optimizer_request)
    density = reference_trajectory(req.mission_days)
    if req.initial_femoral_neck_bmd_g_cm2 is not None:
        for p in density:
            p.update(bone_metrics(p['bmd_pct'], req.initial_femoral_neck_bmd_g_cm2))
    q = quality_recovery_curve(req.quality_metric, step_days=7, method='pchip')
    user_obs = [x.model_dump() for x in req.observations]
    # Only exact site/method matched personal observations should be drawn in
    # the same panel. All others are separate, and remain unverified.
    known_metric_ids = {m['id'] for m in published_tbone_metabolism()['metrics']}
    source_areas = {
        'density': 'femoral neck / DXA / relative percent of preflight',
        'quality': 'distal tibia / HR-pQCT / postflight percent change',
        'metabolism': 'TBone recovered vs incomplete-recovery preflight groups',
    }
    total = round(sum(optimized.schedule_minutes), 3)
    return {
        'model_status': 'research_demonstrator_evidence_bounded',
        'astronaut_id': req.astronaut_id,
        'input_status': 'self_entered_unverified_not_NASA_measurement',
        'inputs': req.model_dump(),
        'density': {'trajectory': density, 'status':'literature_based_population_reference',
                    'source': f'https://doi.org/{SOURCE_DOI}',
                    'what_it_means': f'The published population reference estimates {density[-1]["bmd_loss_pct"]:.2f}% femoral-neck BMD loss by day {req.mission_days}. It is not your measured or intervention-specific response.'},
        'quality': q,
        'metabolism': published_tbone_metabolism(),
        'metabolism_available_metrics': sorted(known_metric_ids),
        'user_observations': user_obs,
        'exercise': {'schedule': optimized.exercise_sessions, 'total_minutes': total,
                     'zero_exercise_schedule': [{'day': d, 'total_minutes': 0, 'resistance': {'minutes':0},'aerobic':{'minutes':0}} for d in range(1,8)],
                     'objective':'track_user_chosen_activity_target_with_illustrative_fatigue_penalty',
                     'model_status':'hypothetical_fatigue_and_intensity_coefficients_not_clinically_validated'},
        'counterfactuals': {
            'optimized_exercise_bone_outcome': None,
            'zero_exercise_bone_outcome': None,
            'difference': None,
            'identifiable': False,
            'reason': 'The publications currently bundled do not identify a joint individual-level exercise dose -> DXA, HR-pQCT and biomarkers causal model. Axpe is not a no-exercise control group. No treatment effect can be computed responsibly.'
        },
        'research_sources': source_areas,
        'briefing': {
            'known': ['Population femoral-neck BMD reference (Axpe)', 'Published distal tibia postflight group changes (TBone)', 'Published TBone preflight group biomarker results'],
            'unknown': ['Personal future bone outcomes', 'Causal effect of an optimized versus zero-exercise schedule', 'Personal bone strength or turnover without verified clinical tests'],
            'next': 'Collect paired personal measurements and appropriate controlled exercise–outcome evidence before optimizing bone outcomes.'
        }
    }
