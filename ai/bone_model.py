"""Transparent *illustrative* discrete-time bone-health dynamics.

No clinical validity is claimed. Do not use to prescribe exercise.
State: relative BMD percent, synthetic fatigue 0..100.
Control: minutes of exercise/day, bounded by callers.
"""

from .schemas import ModelParams


def step(bmd: float, fatigue: float, exercise_minutes: float, p: ModelParams) -> tuple[float, float]:
    hours = exercise_minutes / 60.0
    next_bmd = bmd - p.bmd_loss_pp_per_day + p.exercise_benefit_pp_per_hour * hours
    next_fatigue = max(0.0, fatigue + p.fatigue_per_hour * hours - p.fatigue_recovery_per_day)
    return float(next_bmd), float(next_fatigue)
