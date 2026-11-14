
"""Exploratory forecasting from historical health measurements.

Statistical extrapolation, not a clinical prediction.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from math import isfinite
from statistics import median
from typing import Literal

from pydantic import BaseModel, Field


class ForecastReading(BaseModel):
    value: float
    recordedAt: datetime


class ForecastRequest(BaseModel):
    metric: str = Field(min_length=1, max_length=100)
    history: list[ForecastReading] = Field(max_length=2000)
    days: Literal[7, 14, 30] = 7


BOUNDS = {
    "oxygen_saturation": (0, 100),
    "oxygen_status": (0, 100),
    "sleep_duration": (0, 24),
    "muscle_atrophy": (0, 100),
    "muscle_fiber_type_i": (0, 100),
    "muscle_fiber_type_ii": (0, 100),
    "kidney_stones_risk": (0, 100),
    "bone_density": (0, None),
    "bone_quality": (0, None),
    "bone_metabolism_p1np": (0, None),
    "bone_metabolism_ctx": (0, None),
    "daily_radiation_dose": (0, None),
    "radiation_dose_rate": (0, None),
    "avg_heart_rate": (0, None),
    "neuromuscular_coordination": (0, None),
    "body_temperature": (None, None),
}

UNSUPPORTED = {
    "arrhythmia",
    "radiation_event",
    "cumulative_mission_dose",
}


def forecast_health(req: ForecastRequest):
    name = req.metric.split(".")[-1]

    if name in UNSUPPORTED:
        return {
            "status": "unsupported",
            "reason": "This metric requires a dedicated forecasting model.",
            "points": [],
        }

    if name not in BOUNDS:
        return {
            "status": "unsupported",
            "reason": "Unknown metric.",
            "points": [],
        }

    grouped = defaultdict(list)

    for row in req.history:
        if isfinite(row.value):
            grouped[row.recordedAt.date()].append(row.value)

    daily = sorted(
        (date, median(values))
        for date, values in grouped.items()
    )

    if len(daily) < 5:
        return {
            "status": "insufficient_data",
            "reason": "At least five distinct measurement dates are required.",
            "points": [],
        }

    daily = daily[-30:]

    origin = daily[0][0]
    xs = [(date - origin).days for date, _ in daily]
    ys = [value for _, value in daily]

    mean_x = sum(xs) / len(xs)
    mean_y = sum(ys) / len(ys)

    denominator = sum(
        (x - mean_x) ** 2 for x in xs
    )

    if denominator <= 0:
        return {
            "status": "insufficient_data",
            "reason": "No time variation in measurement dates.",
            "points": [],
        }

    slope = sum(
        (x - mean_x) * (y - mean_y)
        for x, y in zip(xs, ys)
    ) / denominator

    last_date, last_value = daily[-1]

    observed_range = max(ys) - min(ys)

    daily_cap = max(
        observed_range,
        abs(last_value) * 0.05,
        0.001,
    ) / 30

    slope = max(-daily_cap, min(daily_cap, slope))

    low, high = BOUNDS[name]

    points = []

    for day in range(1, req.days + 1):
        estimate = last_value + day * slope

        if low is not None:
            estimate = max(low, estimate)

        if high is not None:
            estimate = min(high, estimate)

        points.append({
            "day": day,
            "date": (
                last_date + timedelta(days=day)
            ).isoformat(),
            "value": round(estimate, 5),
        })

    return {
        "status": "projected",
        "method": "capped_recent_linear_trend",
        "lastObserved": {
            "date": last_date.isoformat(),
            "value": last_value,
        },
        "observedDays": len(daily),
        "points": points,
        "disclaimer": (
            "Exploratory statistical extrapolation only; "
            "not a clinically validated health prediction."
        ),
    }
