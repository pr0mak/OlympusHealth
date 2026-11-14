from typing import Literal
from pydantic import BaseModel, Field


class Profile(BaseModel):
    astronaut_id: str = "DEMO-001"
    initial_bmd_pct: float = Field(default=100.0, ge=70, le=120)
    initial_fatigue: float = Field(default=20.0, ge=0, le=100)
    mission_day: int = Field(default=0, ge=0, le=1200)


class ModelParams(BaseModel):
    # All defaults are ILLUSTRATIVE, NOT fitted to NASA trials.
    exercise_benefit_pp_per_hour: float = Field(default=0.015, ge=0, le=0.5)
    fatigue_per_hour: float = Field(default=12.0, ge=0, le=100)
    fatigue_recovery_per_day: float = Field(default=8.0, ge=0, le=100)


class SimulateRequest(BaseModel):
    profile: Profile = Field(default_factory=Profile)
    horizon_days: int = Field(default=30, ge=1, le=180)
    exercise_minutes_per_day: float = Field(default=60, ge=0, le=180)
    model: ModelParams = Field(default_factory=ModelParams)


class OptimizeRequest(BaseModel):
    profile: Profile = Field(default_factory=Profile)
    planning_days: int = Field(default=7, ge=2, le=30)
    exercise_budget_minutes: float = Field(default=420, ge=0, le=5400)
    max_minutes_per_day: float = Field(default=120, gt=0, le=180)
    fatigue_limit: float = Field(default=70, ge=10, le=100)
    fatigue_weight: float = Field(default=0.05, ge=0, le=20)
    exercise_weight: float = Field(default=0.02, ge=0, le=20)
    model: ModelParams = Field(default_factory=ModelParams)


class DailyState(BaseModel):
    day: int
    bmd_pct: float
    fatigue: float
    exercise_minutes: float


class TrajectoryResponse(BaseModel):
    astronaut_id: str
    body_region_id: Literal["hip_femoral_neck"] = "hip_femoral_neck"
    model_status: Literal["synthetic_demonstration"] = "synthetic_demonstration"
    units: dict[str, str]
    trajectory: list[DailyState]
    disclaimer: str


class OptimizationResponse(TrajectoryResponse):
    schedule_minutes: list[float]
    solver_success: bool
    solver_message: str
    baseline_trajectory: list[DailyState]
