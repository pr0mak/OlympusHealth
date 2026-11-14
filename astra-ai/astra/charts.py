"""ASTRA evidence-first browser dashboard and plain-language health briefing."""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse

from .bmd_reference import reference_trajectory
from .bone_health import METRIC_INFO
from .bone_metrics import bone_metrics
from .exercise import ExercisePreferences
from .health_briefing import BriefingRequest, generate_briefing
from .mpc import optimize
from .tbone_quality import published_tbone_quality
from .bone_quality_dynamics import quality_recovery_curve
from .tbone_metabolism import published_tbone_metabolism
from .schemas import OptimizeRequest, Profile

router = APIRouter()
TEMPLATE = Path(__file__).parent / 'static' / 'dashboard.html'


@router.get('/', response_class=HTMLResponse, include_in_schema=False)
def home():
    return HTMLResponse('<meta http-equiv="refresh" content="0; url=/charts">')


@router.get('/charts', response_class=HTMLResponse)
def charts(days: int = Query(180, ge=2, le=1200),
           initial_bmd: float | None = Query(default=None, gt=0, le=2.5),
           budget: float = Query(315, ge=0, le=5400),
           target: float = Query(45, ge=0, le=180),
           resistance_pct: float = Query(50, ge=0, le=100),
           resistance_intensity: str = Query('moderate', pattern='^(low|moderate|high)$'),
           aerobic_intensity: str = Query('moderate', pattern='^(low|moderate|high)$'),
           fatigue_limit: float = Query(70, ge=10, le=100)):
    profile = Profile(initial_bmd_g_cm2=initial_bmd, initial_fatigue=0)
    prefs = ExercisePreferences(target_minutes_per_day=target,
                                resistance_fraction=resistance_pct / 100,
                                resistance_intensity=resistance_intensity,
                                aerobic_intensity=aerobic_intensity)
    req = OptimizeRequest(profile=profile, planning_days=7,
                          exercise_budget_minutes=budget,
                          fatigue_limit=fatigue_limit, exercise=prefs)
    try:
        opt = optimize(req)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    reference = reference_trajectory(days)
    if initial_bmd is not None:
        for p in reference:
            p.update(bone_metrics(p['bmd_pct'], initial_bmd))
    briefing = generate_briefing(BriefingRequest(days=days, initial_bmd_g_cm2=initial_bmd))
    data = {'reference': reference, 'exercise_sessions': opt.exercise_sessions,
            'schedule': opt.schedule_minutes, 'metrics': METRIC_INFO,
            'briefing': briefing, 'published_quality': published_tbone_quality(), 'quality_dynamics': {m['id']: {'pchip': quality_recovery_curve(m['id']), 'exponential': (quality_recovery_curve(m['id'], method='exponential') if quality_recovery_curve(m['id'])['exponential_eligible'] else None)} for m in published_tbone_quality()['metrics']}, 'published_metabolism': published_tbone_metabolism(), 'source': 'Axpe et al. (2020), DOI: 10.1371/journal.pone.0226434'}
    fields = {'days': days, 'initial_bmd': '' if initial_bmd is None else initial_bmd,
              'budget': budget, 'target': target, 'resistance_pct': resistance_pct,
              'resistance_intensity': resistance_intensity,
              'aerobic_intensity': aerobic_intensity, 'fatigue_limit': fatigue_limit}
    form = ''.join(
        f'<label>{label}<input name="{key}" type="number" min="{lo}" max="{hi}" '
        f'step="{step}" value="{fields[key]}" {required}></label>'
        for key, label, lo, hi, step, required in [
            ('days', 'Mission forecast (days)', 2, 1200, 1, 'required'),
            ('initial_bmd', 'Preflight femoral-neck DXA BMD (g/cm², optional; user-provided)', 0.01, 2.5, 0.01, ''),
            ('budget', '7-day available exercise time (min)', 0, 5400, 5, 'required'),
            ('target', 'Desired exercise time/day (min)', 0, 180, 5, 'required'),
            ('resistance_pct', 'Resistance share (%)', 0, 100, 5, 'required'),
            ('fatigue_limit', 'Illustrative fatigue ceiling', 10, 100, 5, 'required'),
        ]
    )
    for key, label in [('resistance_intensity', 'Resistance intensity'),
                       ('aerobic_intensity', 'Aerobic intensity')]:
        options = ''.join(
            f'<option value="{v}" {"selected" if fields[key] == v else ""}>{v.title()}</option>'
            for v in ('low', 'moderate', 'high')
        )
        form += f'<label>{label}<select name="{key}">{options}</select></label>'
    payload = (json.dumps(data, ensure_ascii=False, allow_nan=False)
               .replace('&', '\\u0026').replace('<', '\\u003c')
               .replace('>', '\\u003e').replace('\u2028', '\\u2028')
               .replace('\u2029', '\\u2029'))
    html = TEMPLATE.read_text(encoding='utf-8')
    return HTMLResponse(html.replace('__FORM__', form).replace('__DATA__', payload))
