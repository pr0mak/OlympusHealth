"""BMD baseline from published reference + explicitly hypothetical exercise effect.

The reference applies to femoral-neck BMD. Exercise coefficient and synthetic
fatigue model are NOT calibrated from NASA intervention data.
"""
from .bmd_reference import daily_loss_pp
from .schemas import ModelParams


def step(bmd: float, fatigue: float, exercise_minutes: float, p: ModelParams,
         mission_day: int = 0) -> tuple[float, float]:
    if mission_day < 0:
        raise ValueError("mission_day must be nonnegative")
    if not 0 <= exercise_minutes <= 252:
        raise ValueError("exercise load proxy must be between 0 and 252")
    hours = exercise_minutes / 60.0
    # Exercise effect stays zero by default: no validated efficacy data.
    next_bmd = bmd - daily_loss_pp(mission_day) + p.exercise_benefit_pp_per_hour * hours
    next_fatigue = max(0.0, fatigue + p.fatigue_per_hour * hours - p.fatigue_recovery_per_day)
    return float(next_bmd), float(next_fatigue)
