"""Stable React/Node-facing API. Public fields intentionally use camelCase.

Preserves the literature provenance of each data family; these are *not*
individual astronaut longitudinal observations or exercise causal outcomes.
"""
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from .schemas import OptimizeRequest, Profile
from .exercise import ExercisePreferences
from .mpc import optimize
from .bmd_reference import reference_trajectory, SOURCE_DOI
from .bone_metrics import bone_metrics
from .tbone_quality import published_tbone_quality
from .tbone_metabolism import published_tbone_metabolism

router = APIRouter(prefix='/api/v1', tags=['Frontend integration'])


class MissionInput(BaseModel):
    environment: Literal['LEO', 'LUNAR_ORBIT', 'LUNAR_SURFACE', 'MARS_TRANSIT', 'MARS_SURFACE'] = 'LEO'
    durationDays: int = Field(default=180, ge=1, le=1200)
    currentDay: int = Field(default=0, ge=0, le=1200)


class HealthInput(BaseModel):
    # Explicitly optional: no fake DXA when absent.
    initialFemoralNeckBmdGcm2: float | None = Field(default=None, gt=0, le=2.5)


class ExerciseInput(BaseModel):
    weeklyBudgetMinutes: float = Field(default=210, ge=0, le=1260)
    targetMinutesPerDay: float = Field(default=45, ge=0, le=180)
    resistanceFraction: float = Field(default=.5, ge=0, le=1)
    resistanceIntensity: Literal['low','moderate','high'] = 'moderate'
    aerobicIntensity: Literal['low','moderate','high'] = 'moderate'
    initialFatigue: float = Field(default=20, ge=0, le=100)
    fatigueCeiling: float = Field(default=70, ge=10, le=100)


class ProjectionRequest(BaseModel):
    astronautId: str = Field(min_length=1, max_length=80)
    mission: MissionInput = Field(default_factory=MissionInput)
    health: HealthInput = Field(default_factory=HealthInput)
    exercise: ExerciseInput = Field(default_factory=ExerciseInput)
    qualityMetricId: str = 'failure_load'
    metabolismMetricId: str = 'ctx_urinary'


@router.get('/catalog')
def integration_catalog():
    return {
        'missionEnvironments': ['LEO','LUNAR_ORBIT','LUNAR_SURFACE','MARS_TRANSIT','MARS_SURFACE'],
        'qualityMetrics': [{'id': m['id'], 'label': m['label'], 'unit': m['chart_unit']} for m in published_tbone_quality()['metrics']],
        'metabolismMetrics': [{'id': m['id'], 'label': m['label'], 'unit': m['unit']} for m in published_tbone_metabolism()['metrics']],
        'note': 'Only the LEO-like population baseline is supported by the current BMD model. Other missions are context only.'
    }


@router.post('/projection')
def integration_projection(req: ProjectionRequest):
    if req.mission.currentDay > req.mission.durationDays:
        raise HTTPException(422, detail='currentDay cannot exceed durationDays')
    quality = published_tbone_quality()
    metabolism = published_tbone_metabolism()
    q = next((x for x in quality['metrics'] if x['id'] == req.qualityMetricId), None)
    m = next((x for x in metabolism['metrics'] if x['id'] == req.metabolismMetricId), None)
    if q is None or m is None:
        raise HTTPException(422, detail='Unknown metric ID; GET /api/v1/catalog')
    density = reference_trajectory(req.mission.durationDays)
    for point in density:
        point.update(bone_metrics(point['bmd_pct'], req.health.initialFemoralNeckBmdGcm2))
    prefs = ExercisePreferences(target_minutes_per_day=req.exercise.targetMinutesPerDay,
                                resistance_fraction=req.exercise.resistanceFraction,
                                resistance_intensity=req.exercise.resistanceIntensity,
                                aerobic_intensity=req.exercise.aerobicIntensity)
    plan_req = OptimizeRequest(
        profile=Profile(astronaut_id=req.astronautId,
                        initial_bmd_g_cm2=req.health.initialFemoralNeckBmdGcm2,
                        initial_fatigue=req.exercise.initialFatigue,
                        mission_day=req.mission.currentDay),
        planning_days=7, exercise_budget_minutes=req.exercise.weeklyBudgetMinutes,
        fatigue_limit=req.exercise.fatigueCeiling, exercise=prefs)
    try:
        plan = optimize(plan_req)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(422, detail=str(exc)) from exc
    total = round(sum(plan.schedule_minutes),3)
    return {
        'apiVersion':'1.0', 'astronautId':req.astronautId,
        'mission':req.mission.model_dump(),
        'boneDensity': {
            'status':'literature_population_forecast', 'site':'femoral_neck',
            'trajectory':density, 'source':{'doi':SOURCE_DOI, 'url':f'https://doi.org/{SOURCE_DOI}'},
            'summary': f'The published model estimates {density[-1]["bmd_loss_pct"]:.2f}% loss over {req.mission.durationDays} days; not an individual outcome.',
            'limitation': 'Derived primarily from spaceflight population evidence. The current model is NOT validated for partial gravity or Mars transit. Exercise does not alter this forecast.'
        },
        'boneQuality': {
            'status':'published_group_observations', 'site':'distal_tibia',
            'metricId':q['id'], 'label':q['label'], 'unit':'% change from preflight',
            'timepoints':quality['source']['timepoints'], 'values':q['percent_change'],
            'source':quality['source'],
            'summary':'TBone group median changes at return, 6 and 12 months postflight; NOT a personal or inflight trajectory.'
        },
        'boneMetabolism': {
            'status':'published_preflight_group_comparison',
            'metricId':m['id'], 'label':m['label'], 'unit':m['unit'],
            'groups':metabolism['groups'],
            'values':{'recovered':m['recovered'],'incomplete':m['incomplete']},
            'source':metabolism['source'],
            'summary':'Published group comparison at preflight. No longitudinal biomarker trajectory or individual risk classification is supported.'
        },
        'exercisePlan': {
            'status':'model_optimized_schedule_unvalidated_fatigue',
            'days':plan.exercise_sessions, 'totalMinutes':total,
            'weeklyBudgetMinutes':req.exercise.weeklyBudgetMinutes,
            'solverSuccess':plan.solver_success,
            'summary':f'The schedule allocates {total:.1f} minutes across 7 days within the user-specified budget.',
            'limitation':'This optimizes target activity and an illustrative fatigue score, NOT bone protection. Intensity multipliers and fatigue parameters are hypothetical.'
        },
        'scientificIntegrity': {
            'personalBoneQualityPredictionAvailable':False,
            'personalBoneMetabolismPredictionAvailable':False,
            'exerciseVersusNoExerciseBoneEffectAvailable':False,
            'interpretation':'Published group observations are reference evidence, not measurements of this astronaut.'
        }
    }
