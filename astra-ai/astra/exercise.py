"""Exercise planning vocabulary; NOT NASA exercise recommendations.

These control types represent scheduling choices. No validated BMD treatment
response is inferred from the schedule.
"""
from typing import Literal
from pydantic import BaseModel, Field

Intensity = Literal['low', 'moderate', 'high']

INTENSITY_MULTIPLIER = {'low': 0.65, 'moderate': 1.0, 'high': 1.4}

class ExercisePreferences(BaseModel):
    target_minutes_per_day: float = Field(default=45.0, ge=0, le=180)
    resistance_fraction: float = Field(default=0.5, ge=0, le=1)
    resistance_intensity: Intensity = 'moderate'
    aerobic_intensity: Intensity = 'moderate'
    # An optional user/planner target, not prescribed by NASA.


def sessions_for_minutes(minutes: float, prefs: ExercisePreferences) -> dict:
    resistance = round(minutes * prefs.resistance_fraction, 3)
    aerobic = round(minutes - resistance, 3)
    return {
        'resistance': {'minutes': resistance, 'intensity': prefs.resistance_intensity},
        'aerobic': {'minutes': aerobic, 'intensity': prefs.aerobic_intensity},
        'total_minutes': round(float(minutes), 3),
    }


def intensity_load(minutes: float, prefs: ExercisePreferences) -> float:
    """Unitless illustrative scheduling-load proxy (minutes-equivalent)."""
    return float(minutes * (
        prefs.resistance_fraction * INTENSITY_MULTIPLIER[prefs.resistance_intensity]
        + (1-prefs.resistance_fraction) * INTENSITY_MULTIPLIER[prefs.aerobic_intensity]
    ))
