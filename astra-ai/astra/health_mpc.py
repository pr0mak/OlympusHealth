
"""
ASTRA - Exercise Planning Optimizer

Illustrative exercise scheduling using constrained optimization.

This is not a clinically validated exercise prescription.
"""

from datetime import datetime
from typing import Literal, Optional

import numpy as np
from scipy.optimize import minimize
from pydantic import BaseModel, Field, model_validator


Intensity = Literal["low", "moderate", "high"]


class HealthMeasurement(BaseModel):
    metric: str
    value: float
    recorded_at: Optional[datetime] = None


class HealthMPCRequest(BaseModel):
    astronaut_id: str = "user-1"

    planning_days: int = Field(default=7, ge=1, le=30)

    weekly_budget_minutes: float = Field(
        default=210,
        ge=0,
        le=1260
    )

    max_minutes_per_day: float = Field(
        default=60,
        gt=0,
        le=180
    )

    target_minutes_per_day: float = Field(
        default=30,
        ge=0,
        le=180
    )

    resistance_fraction: float = Field(
        default=0.5,
        ge=0,
        le=1
    )

    resistance_intensity: Intensity = "moderate"
    aerobic_intensity: Intensity = "moderate"

    initial_fatigue: float = Field(
        default=20,
        ge=0,
        le=100
    )

    fatigue_limit: float = Field(
        default=70,
        ge=0,
        le=100
    )

    measurements: list[HealthMeasurement] = Field(
        default_factory=list
    )

    @model_validator(mode="after")
    def validate_settings(self):
        if self.initial_fatigue > self.fatigue_limit:
            raise ValueError(
                "Initial fatigue cannot exceed fatigue limit."
            )

        return self


INTENSITY_FACTORS = {
    "low": 0.7,
    "moderate": 1.0,
    "high": 1.4
}

# Illustrative model coefficients
DAILY_RECOVERY = 8.0
RESISTANCE_FATIGUE_RATE = 0.42
AEROBIC_FATIGUE_RATE = 0.30


def calculate_fatigue(
    resistance_minutes,
    aerobic_minutes,
    initial_fatigue,
    resistance_factor,
    aerobic_factor
):
    """
    Calculate illustrative fatigue trajectory.

    This is a planning index, not a medical measurement.
    """

    fatigue = float(initial_fatigue)
    trajectory = []

    for resistance, aerobic in zip(
        resistance_minutes,
        aerobic_minutes
    ):
        resistance_load = (
            resistance
            * resistance_factor
            * RESISTANCE_FATIGUE_RATE
        )

        aerobic_load = (
            aerobic
            * aerobic_factor
            * AEROBIC_FATIGUE_RATE
        )

        fatigue = max(
            0.0,
            fatigue
            + resistance_load
            + aerobic_load
            - DAILY_RECOVERY
        )

        trajectory.append(fatigue)

    return np.array(trajectory, dtype=float)


def optimize_health_exercise(req: HealthMPCRequest):
    """
    Optimize daily resistance and aerobic exercise minutes.

    Constraints:
    - Daily exercise time limit
    - Total planning-period budget
    - Illustrative fatigue ceiling
    - Nonnegative exercise duration

    Health measurements are accepted but do not currently
    influence the optimization.
    """

    days = req.planning_days

    resistance_factor = INTENSITY_FACTORS[
        req.resistance_intensity
    ]

    aerobic_factor = INTENSITY_FACTORS[
        req.aerobic_intensity
    ]

    target = min(
        req.target_minutes_per_day,
        req.max_minutes_per_day
    )

    # Scale weekly budget to the planning horizon.
    total_budget = (
        req.weekly_budget_minutes * days / 7.0
    )

    total_budget = min(
        total_budget,
        days * req.max_minutes_per_day
    )

    resistance_share = req.resistance_fraction
    aerobic_share = 1.0 - resistance_share

    initial_daily = min(
        target,
        total_budget / days if days else 0
    )

    initial_resistance = (
        initial_daily * resistance_share
    )

    initial_aerobic = (
        initial_daily * aerobic_share
    )

    # First N variables = resistance minutes
    # Next N variables = aerobic minutes
    x0 = np.concatenate([
        np.full(days, initial_resistance),
        np.full(days, initial_aerobic)
    ])

    def unpack(x):
        return x[:days], x[days:]

    def objective(x):
        resistance, aerobic = unpack(x)

        total_daily = resistance + aerobic

        target_error = np.sum(
            (total_daily - target) ** 2
        )

        resistance_error = np.sum(
            (
                resistance
                - total_daily * resistance_share
            ) ** 2
        )

        smoothness = np.sum(
            np.diff(total_daily) ** 2
        )

        return float(
            target_error
            + 0.5 * resistance_error
            + 0.1 * smoothness
        )

    def daily_time_constraint(x):
        resistance, aerobic = unpack(x)

        return (
            req.max_minutes_per_day
            - resistance
            - aerobic
        )

    def budget_constraint(x):
        return total_budget - np.sum(x)

    def fatigue_constraint(x):
        resistance, aerobic = unpack(x)

        fatigue = calculate_fatigue(
            resistance,
            aerobic,
            req.initial_fatigue,
            resistance_factor,
            aerobic_factor
        )

        return req.fatigue_limit - fatigue

    constraints = [
        {
            "type": "ineq",
            "fun": daily_time_constraint
        },
        {
            "type": "ineq",
            "fun": budget_constraint
        },
        {
            "type": "ineq",
            "fun": fatigue_constraint
        }
    ]

    bounds = [
        (0, req.max_minutes_per_day)
        for _ in range(2 * days)
    ]

    result = minimize(
        objective,
        x0,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={
            "maxiter": 1000,
            "ftol": 1e-9
        }
    )

    if not result.success:
        raise ValueError(
            f"Exercise optimization failed: {result.message}"
        )

    resistance, aerobic = unpack(result.x)

    fatigue = calculate_fatigue(
        resistance,
        aerobic,
        req.initial_fatigue,
        resistance_factor,
        aerobic_factor
    )

    schedule = []

    for index in range(days):
        resistance_minutes = float(
            resistance[index]
        )

        aerobic_minutes = float(
            aerobic[index]
        )

        total_minutes = (
            resistance_minutes + aerobic_minutes
        )

        schedule.append({
            "day": index + 1,
            "resistance": {
                "minutes": round(
                    resistance_minutes, 2
                ),
                "intensity": req.resistance_intensity
            },
            "aerobic": {
                "minutes": round(
                    aerobic_minutes, 2
                ),
                "intensity": req.aerobic_intensity
            },
            "total_minutes": round(
                total_minutes, 2
            ),
            "predicted_fatigue": round(
                float(fatigue[index]), 2
            )
        })

    total_minutes = sum(
        float(resistance[i] + aerobic[i])
        for i in range(days)
    )

    return {
        "astronaut_id": req.astronaut_id,
        "planning_days": days,
        "schedule": schedule,
        "total_minutes": round(total_minutes, 2),
        "solver_success": True,
        "model_status": "illustrative_exercise_scheduler",
        "measurements_received": len(req.measurements),
        "health_measurements_used": False,
        "disclaimer": (
            "This exercise schedule is generated using "
            "illustrative fatigue dynamics and user-defined "
            "constraints. Health measurements are received "
            "but do not yet influence the optimization. "
            "This is not a clinically validated exercise "
            "prescription."
        )
    }


def compare_exercise_fatigue(req: HealthMPCRequest):
    """
    Compare illustrative fatigue trajectories with and
    without the optimized exercise schedule.

    Both trajectories use the same fatigue model.
    """

    result = optimize_health_exercise(req)

    schedule = result["schedule"]
    days = len(schedule)

    resistance = np.array([
        day["resistance"]["minutes"]
        for day in schedule
    ], dtype=float)

    aerobic = np.array([
        day["aerobic"]["minutes"]
        for day in schedule
    ], dtype=float)

    resistance_factor = INTENSITY_FACTORS[
        req.resistance_intensity
    ]

    aerobic_factor = INTENSITY_FACTORS[
        req.aerobic_intensity
    ]

    with_exercise = calculate_fatigue(
        resistance,
        aerobic,
        req.initial_fatigue,
        resistance_factor,
        aerobic_factor
    )

    without_exercise = calculate_fatigue(
        np.zeros(days),
        np.zeros(days),
        req.initial_fatigue,
        resistance_factor,
        aerobic_factor
    )

    comparison = []

    for index in range(days):
        comparison.append({
            "day": index + 1,
            "withoutExercise": round(
                float(without_exercise[index]), 2
            ),
            "withExercise": round(
                float(with_exercise[index]), 2
            )
        })

    return {
        "astronaut_id": req.astronaut_id,
        "planning_days": days,
        "exercisePlan": result,
        "fatigueComparison": comparison,
        "model_status": "illustrative_fatigue_comparison",
        "disclaimer": (
            "Both curves use hypothetical fatigue dynamics. "
            "They do not represent measured or clinically "
            "validated physiological fatigue."
        )
    }
