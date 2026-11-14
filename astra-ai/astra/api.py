from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

from .health_forecast import ForecastRequest, forecast_health
from .health_mpc import (
    HealthMPCRequest,
    optimize_health_exercise,
    compare_exercise_fatigue
)
from .charts import router as charts_router
from .integration import router as integration_router
from .adaptive_ai import router as adaptive_ai_router
from .evidence_routes import router as evidence_router
from .health_briefing import BriefingQuestion, BriefingRequest, answer_question, generate_briefing
from .bone_health import BoneObservation, METRIC_GROUPS, METRIC_INFO, summarize_observations
from pydantic import BaseModel, Field
from .body_map import REGIONS
from .bmd_reference import reference_trajectory, SOURCE_DOI
from .bone_metrics import bone_metrics
from .mpc import optimize
from .tbone_quality import published_tbone_quality
from .bone_quality_dynamics import quality_recovery_curve
from .tbone_metabolism import published_tbone_metabolism
from .schemas import OptimizeRequest, OptimizationResponse, SimulateRequest, TrajectoryResponse
from .simulator import simulate

app = FastAPI(title="ASTRA AI Engine", version="1.4.0", description="Experimental bone health simulator; not a medical device")
app.mount('/assets', StaticFiles(directory=Path(__file__).parent / 'static'), name='assets')
app.include_router(charts_router)
app.include_router(evidence_router)
app.include_router(integration_router)
app.include_router(adaptive_ai_router)
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in os.getenv("ASTRA_CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if x.strip()],
                   allow_methods=["GET", "POST"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "astra-ai", "model_status": "literature_baseline_and_unvalidated_exercise_planner"}


@app.get("/body-map")
def body_map():
    return {"regions": REGIONS, "note": "Only hip_femoral_neck has a dynamic model in MVP"}


@app.post("/simulate", response_model=TrajectoryResponse)
def simulate_endpoint(req: SimulateRequest):
    return simulate(req.profile, [req.exercise_minutes_per_day] * req.horizon_days, req.model)


@app.post("/optimize", response_model=OptimizationResponse)
def optimize_endpoint(req: OptimizeRequest):
    try:
        return optimize(req)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/v1/health-mpc")
def health_mpc_endpoint(req: HealthMPCRequest):
    try:
        return optimize_health_exercise(req)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc)
        ) from exc

@app.post("/api/v1/exercise-impact")
def exercise_impact_endpoint(req: HealthMPCRequest):
    try:
        return compare_exercise_fatigue(req)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc)
        ) from exc
        
@app.post("/api/v1/health-forecast")
def health_forecast_endpoint(req: ForecastRequest):
    return forecast_health(req)

@app.get("/reference/bmd")
def bmd_reference(days: int = 180, initial_bmd_g_cm2: float | None = None):
    if not 0 <= days <= 1200:
        raise HTTPException(status_code=422, detail="days must be 0..1200")
    if initial_bmd_g_cm2 is not None and not 0 < initial_bmd_g_cm2 <= 2.5:
        raise HTTPException(status_code=422, detail="initial_bmd_g_cm2 must be >0 and <=2.5")
    points = reference_trajectory(days)
    for point in points:
        point.update(bone_metrics(point["bmd_pct"], initial_bmd_g_cm2))
    return {
        "body_region_id": "hip_femoral_neck",
        "model_status": "published_population_reference_no_exercise_effect",
        "source_doi": SOURCE_DOI,
        "trajectory": points,
        "t_score_reference": {"mean_g_cm2": 0.858, "sd_g_cm2": 0.120, "nasa_reference_threshold": -2.0},
        "disclaimer": "Population-level literature model; T-scores require supplied preflight DXA BMD. "
                      "The -2.0 NASA reference is informational only; not a diagnosis or hard MPC constraint."
    }


class BoneHealthRequest(BaseModel):
    observations: list[BoneObservation] = Field(max_length=2000)


@app.get("/bone-health/catalog")
def bone_health_catalog():
    return {"groups": METRIC_GROUPS, "metrics": METRIC_INFO,
            "warning": "The NASA roadmap motivates which metrics to monitor; it does not supply these demo values."}


@app.get("/bone-quality/published-tbone")
def bone_quality_published_tbone():
    """Table 1 group medians from Gabel et al. (2022); no invented patient values."""
    return published_tbone_quality()


@app.get("/bone-quality/dynamics")
def bone_quality_dynamics(metric_id: str = "failure_load",
                          step_days: int = Query(7, ge=1, le=90),
                          method: str = "pchip",
                          personal_return_change_pct: float | None = None):
    """Exploratory postflight group interpolation, NOT clinical prediction."""
    try:
        return quality_recovery_curve(metric_id, step_days, method, personal_return_change_pct)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/bone-metabolism/published-tbone")
def bone_metabolism_published_tbone():
    """Preflight published group biomarkers; NOT astronaut-specific daily data."""
    return published_tbone_metabolism()


@app.get("/bone-health/observations")
def bone_health_observations():
    # No real observations have been integrated. Do not make any up.
    return summarize_observations([])


@app.post("/bone-health/analyze")
def bone_health_analyze(req: BoneHealthRequest):
    return summarize_observations(req.observations)


@app.get("/health-briefing")
def health_briefing_get(days: int = Query(180, ge=0, le=1200),
                        initial_bmd_g_cm2: float | None = Query(None, gt=0, le=2.5)):
    return generate_briefing(BriefingRequest(days=days, initial_bmd_g_cm2=initial_bmd_g_cm2))


@app.post("/health-briefing")
def health_briefing_post(req: BriefingRequest):
    return generate_briefing(req)


@app.post("/health-briefing/ask")
def health_briefing_ask(req: BriefingQuestion):
    return answer_question(req)


@app.get("/adaptive-ai", include_in_schema=False)
def adaptive_ai_page():
    from fastapi.responses import FileResponse
    return FileResponse(Path(__file__).parent / "static" / "adaptive_ai.html")
