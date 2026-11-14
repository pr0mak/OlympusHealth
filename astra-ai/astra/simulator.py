from .bone_model import step
from .exercise import ExercisePreferences, intensity_load
from .bone_metrics import bone_metrics
from .schemas import DailyState, ModelParams, Profile, TrajectoryResponse

DISCLAIMER = (
    "Published femoral-neck BMD baseline plus hypothetical exercise/fatigue coefficients. "
    "T-scores require an input preflight DXA BMD; NASA -2 reference is informational, not an enforced constraint. "
    "Trajectories are synthetic and are NOT clinical predictions or exercise advice."
)
UNITS = {"bmd_pct": "% of preflight BMD", "bmd_g_cm2": "g/cm2 (only if preflight DXA provided)", "t_score": "standard deviations (reference: mean 0.858, SD 0.120)", "fatigue": "synthetic index 0-100", "exercise_minutes": "min/day"}


def simulate(profile: Profile, plan_minutes: list[float], p: ModelParams,
             preferences: ExercisePreferences | None = None) -> TrajectoryResponse:
    bmd, fatigue = profile.initial_bmd_pct, profile.initial_fatigue
    points = [DailyState(day=0, bmd_pct=round(bmd, 5), **bone_metrics(bmd, profile.initial_bmd_g_cm2), fatigue=round(fatigue, 5), exercise_minutes=0)]
    for day, minutes in enumerate(plan_minutes, start=1):
        if not 0 <= minutes <= 180:
            raise ValueError("Exercise minutes must fall between 0 and 180")
        bmd, fatigue = step(bmd, fatigue, intensity_load(minutes, preferences) if preferences else minutes, p,
                            mission_day=profile.mission_day + day - 1)
        points.append(DailyState(day=day, bmd_pct=round(bmd, 5), **bone_metrics(bmd, profile.initial_bmd_g_cm2), fatigue=round(fatigue, 5), exercise_minutes=round(minutes, 3)))
    return TrajectoryResponse(astronaut_id=profile.astronaut_id, units=UNITS, trajectory=points, disclaimer=DISCLAIMER)
