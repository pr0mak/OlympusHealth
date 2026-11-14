# ASTRA AI Engine — Hackathon MVP v0.2

Independent Python service for the ASTRA Future Self concept. **Research demonstration, NOT medical software or a clinical exercise prescription.**

## Scope and scientific provenance

- **Real reference:** `astra/bmd_reference.py` implements a published **population-level femoral-neck BMD** time course (Axpe et al., 2020, DOI `10.1371/journal.pone.0226434`). `GET /reference/bmd` returns the unmodified reference curve.
- **Simulator/MPC:** Uses the *daily loss implied by that reference* plus a **hypothetical** exercise benefit coefficient and a **synthetic** fatigue state. It is NOT calibrated to longitudinal exercise-response data. All predictions involving exercise are illustrative.
- **NASA OSD-575:** real blood biomarker CSVs, **not used** by bone density planning. The front/backend team may import them separately for the health dashboard.
- **Bandit/RL:** not implemented. Next phase will use synthetic daily feedback to personalize exercise tolerability, NOT infer bone preservation from fatigue.
- **MPC meaning:** `/optimize` computes a finite-horizon constrained plan. To run receding horizon MPC, call it again each day with updated state and `mission_day`.

### Model

`BMD(day+1) = BMD(day) - [L(mission_day+1) - L(mission_day)] + beta * exercise_hours`

`L(t) = 69*(1-exp(-0.0006371*t))` is percent loss from preflight. `beta` (`exercise_benefit_pp_per_hour`, default 0.015) is **hypothetical**. Fatigue is an arbitrary unit-free 0–100 simulation state. BMD percentages refer to a personal preflight reference, not g/cm² DXA.

## Run on Windows / macOS / Linux

From the folder containing `requirements.txt`:

```powershell
python -m venv .venv
# Windows PowerShell (if activation is permitted):
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pytest -q
python -m uvicorn astra.api:app --reload --port 8000
```

On macOS/Linux, activate with `source .venv/bin/activate` instead.

Then browse `http://127.0.0.1:8000/docs` and test the endpoints below.

## HTTP endpoints

- `GET /health` — status.
- `GET /body-map` — body-region IDs for clickable 3D meshes.
- `GET /reference/bmd?days=180` — literature reference with no exercise effect.
- `POST /simulate` — fixed exercise plan and predicted BMD + synthetic fatigue.
- `POST /optimize` — constrained experimental optimization and fixed-schedule comparison.

### POST /simulate

```json
{
  "profile": {"astronaut_id": "DEMO-001", "mission_day": 0, "initial_bmd_pct": 100, "initial_fatigue": 20},
  "horizon_days": 30,
  "exercise_minutes_per_day": 60
}
```

For a pure published reference trajectory, set `exercise_minutes_per_day` to `0` and `initial_bmd_pct` to `100` with `mission_day` 0.

### POST /optimize

```json
{
  "profile": {"astronaut_id": "DEMO-001", "mission_day": 0, "initial_bmd_pct": 100, "initial_fatigue": 20},
  "planning_days": 7,
  "exercise_budget_minutes": 420,
  "max_minutes_per_day": 120,
  "fatigue_limit": 70,
  "fatigue_weight": 0.05,
  "exercise_weight": 0.02
}
```

Responses include `model_status: synthetic_demonstration` and a disclaimer. `baseline_trajectory` in `/optimize` means a **fixed equal-time exercise schedule**, not the no-exercise scientific reference.

## Frontend 3D-body integration

Clicking hip/femoral neck sends region ID `hip_femoral_neck`: display BMD, offer `simulate` and `optimize`. `/body-map` declares other regions as informational only. This API can be proxied by Spring Boot later.

## Project layout

```text
astra-ai/
  astra/
    __init__.py
    api.py           # FastAPI routes
    bmd_reference.py # published baseline
    bone_model.py    # step function: reference + hypothetical exercise
    simulator.py     # forward simulation
    mpc.py           # finite horizon optimizer (SciPy SLSQP)
    schemas.py       # validated inputs & outputs
    body_map.py      # IDs for 3D frontend
  tests/test_engine.py
  data/              # empty: no NASA source CSV embedded
  requirements.txt
  README.md
```

## Next steps

1. Verify anatomy and applicability of the paper to chosen mission profiles.
2. Find exercise-intervention evidence to constrain / calibrate beta; never infer it from OSD-575 blood CSVs.
3. Generate synthetic exercise-feedback histories; evaluate LinUCB bandit versus fixed MPC on held-out synthetic crew.
4. Integrate Spring Boot, 3D frontend and NASA blood dashboard separately.
