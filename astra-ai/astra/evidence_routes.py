from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from .evidence_planner import EvidencePlanRequest, build_evidence_plan

router = APIRouter()

@router.post('/evidence-plan')
def evidence_plan(req: EvidencePlanRequest):
    try:
        return build_evidence_plan(req)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

@router.get('/evidence-lab', response_class=HTMLResponse)
def evidence_lab():
    return (Path(__file__).parent / 'static' / 'evidence_lab.html').read_text(encoding='utf-8')
