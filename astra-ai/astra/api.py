from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .body_map import REGIONS
from .bmd_reference import reference_trajectory, SOURCE_DOI
from .mpc import optimize
from .schemas import OptimizeRequest, OptimizationResponse, SimulateRequest, TrajectoryResponse
from .simulator import simulate

app = FastAPI(title="ASTRA AI Engine", version="0.1.0", description="Experimental bone health simulator; not a medical device")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:5173"],
                   allow_methods=["GET", "POST"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "astra-ai", "model_status": "synthetic_demonstration"}


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


@app.get("/reference/bmd")
def bmd_reference(days: int = 180):
    if not 0 <= days <= 1200:
        raise HTTPException(status_code=422, detail="days must be 0..1200")
    return {
        "body_region_id": "hip_femoral_neck",
        "model_status": "published_population_reference_no_exercise_effect",
        "source_doi": SOURCE_DOI,
        "trajectory": reference_trajectory(days),
        "disclaimer": "Population-level literature model; not a personal or intervention forecast."
    }
