from typing import Literal, Optional
from pydantic import BaseModel, Field
from .exercise import ExercisePreferences


class Profile(BaseModel):
    astronaut_id: str = "DEMO-001"
    initial_bmd_pct: float = Field(default=100.0, ge=70, le=120)
    # Preflight absolute femoral-neck DXA BMD. Optional: never invent a real measurement.
    initial_bmd_g_cm2: Optional[float] = Field(default=None, gt=0, le=2.5)
    initial_fatigue: float = Field(default=20.0, ge=0, le=100)
    mission_day: int = Field(default=0, ge=0, le=1200)


class ModelParams(BaseModel):
    # All defaults are ILLUSTRATIVE, NOT fitted to NASA trials.
    exercise_benefit_pp_per_hour: float = Field(default=0.0, ge=0, le=0.5)
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
    exercise: ExercisePreferences = Field(default_factory=ExercisePreferences)


class DailyState(BaseModel):
    day: int
    bmd_pct: float
    bmd_g_cm2: Optional[float] = None
    t_score: Optional[float] = None
    t_score_band: Optional[str] = None
    below_nasa_minus_2_reference: Optional[bool] = None
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
    exercise_sessions: list[dict]
    exercise_model_status: str
    solver_success: bool
    solver_message: str
    baseline_trajectory: list[DailyState]
