# ASTRA AI Engine v1.0 — Bone Metabolism, published TBone evidence

This update changes **only the published Bone Metabolism evidence display**. The Axpe BMD prediction, TBone Bone Quality chart, 7-day MPC exercise schedule, T-score, and user CSV handling remain available.

## Run

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pytest -q
python -m uvicorn astra.api:app --reload
```

Open http://127.0.0.1:8000/charts — use Ctrl+F5 after updating. Source API: http://127.0.0.1:8000/bone-metabolism/published-tbone

## What is genuinely new

The third scientific panel, **Bone Metabolism**, now displays four **published preflight group comparisons** from Gabel et al. (2022), *Results → Biomarkers of bone turnover*.

Astronauts were classified **retrospectively**, according to recovery of distal tibia BMD at **12 months after flight**:

- Recovered (n=8)
- Incomplete recovery (n=9)

The following values are **published group means ± the accompanying number shown in the paper**. We have not independently verified whether the paper's ± text denotes SD or SE, so the application does not reinterpret it or draw error bars.

| Preflight biomarker | Recovered group | Incomplete recovery group | Published units |
|---|---:|---:|---|
| Urinary CTx | 74 ± 13 | 125 ± 13 | µg/mmol creatinine |
| Urinary NTx | 21 ± 2 | 28 ± 3 | nmol/mmol creatinine |
| Serum osteocalcin | 20.0 ± 1.9 | 22.2 ± 1.1 | ng/mL |
| Serum sclerostin | 32.6 ± 2.5 | 22.7 ± 2.0 | pmol/L |

**Do not compare numbers across different biomarkers:** their units and biological interpretation differ. The drop-down displays one variable at a time. The two bars compare two different groups at **the same preflight timepoint**. They do not represent two days, an intervention response, or a time-course.

### Other published findings — no made-up numeric trajectories

Gabel et al. also report these *qualitative* trajectories:

- Urinary CTx and NTx were elevated during flight and returned to preflight levels by **R+1 month**.
- Serum P1NP and BSAP returned to preflight values by **R+6 months**; BSAP was significantly lower at R+12 months.
- Serum calcium was lower at R+1 month.
- PTH was higher at R+1 and R+6 months.

These statements appear in the expandable **Other published bone-metabolism findings** section **without invented numeric values**. The original supplementary Table S1 should be re-checked before building numeric plots for P1NP, BSAP, PTH, and calcium.

### What is NOT claimed

- The study does **not** provide publicly accessible raw individual biomarker sequences. The paper says individual data are restricted for astronaut privacy.
- The study's four numerical pairs are **group observations**, not measured biomarkers of the dashboard user.
- Association with later recovery is not proof that a marker causes bone loss, predicts an individual's outcome, or defines a clinical threshold.
- We have **not** fitted a temporal bone-metabolism model, trained an AI model, or connected metabolism to the MPC objective.
- The separate personal CSV chart still starts empty and marks user-provided observations **UNVERIFIED**.

## Simple architecture

```text
Axpe 2020 → bmd_reference.py → BMD forecast → optional T-score

Gabel 2022 Table 1 → tbone_quality.py → Bone Quality chart

Gabel 2022 biomarker Results → tbone_metabolism.py
                  ↓
      GET /bone-metabolism/published-tbone
                  ↓
      Bone Metabolism chart + plain-language explanation

User exercise settings → exercise.py → mpc.py → 7-day schedule chart

User-supplied lab/QCT CSV → browser-only parser → SEPARATE charts

health_briefing.py → rule-based explanatory briefing (NOT an LLM)
```

- **Python:** scientific calculation and evidence metadata.
- **FastAPI:** API for the future frontend / integration.
- **Pydantic:** checks requests.
- **SciPy SLSQP / MPC:** finite-horizon exercise schedule optimization, currently using *illustrative*, not NASA-calibrated fatigue dynamics.
- **JavaScript Canvas:** renders charts directly in the browser.
- **Pytest:** regression tests for published values, API behaviour and provenance.

## Full source register

The source register distinguishes **actually embedded numerical inputs** from **research and planned integration**. This is important: reading a paper is not the same as using its measurements in the algorithm.

| Source | Where / URL | Actual role in ASTRA v1.0 |
|---|---|---|
| **Axpe et al. (2020), femoral-neck BMD model** | https://pmc.ncbi.nlm.nih.gov/articles/PMC6975633/ · https://doi.org/10.1371/journal.pone.0226434 | **Used**: time-based population BMD loss baseline `L(t)=69(1-exp(-0.0006371*t))`. Not individual DXA and not validated exercise effect. |
| **Gabel et al. (2022), TBone** | https://pmc.ncbi.nlm.nih.gov/articles/PMC9247070/ · https://doi.org/10.1038/s41598-022-13461-1 | **Used**: Table 1 distal-tibia group median structural changes (8 Bone Quality metrics), Results biomarker text (4 numerical preflight group comparisons and 5 qualitative findings). |
| **NASA Human Research Roadmap, Bone Fracture Risk 77** | https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=77 | **Used for scope and evidence context**: mission-dependent risk categories and relevance of bone density, structure, and metabolism. No numerical mission-environment adjustment currently in models. |
| **English et al. (2020), NASA SPRINT exercise study** | https://pmc.ncbi.nlm.nih.gov/articles/PMC7434884/ · DOI: 10.1038/s41526-020-00111-x | **Reviewed, not numerically embedded**: comparative high-intensity/standard exercise protocols and DXA outcomes. Must verify group summary details before any fit. |
| **Scott et al. (2023), multisystem exercise countermeasures** | https://www.nature.com/articles/s41526-023-00256-5 · https://pubmed.ncbi.nlm.nih.gov/36737441/ | **Reviewed, not numerically embedded**: 46-astronaut exercise and physiological outcomes; observations/associations must not be treated as causal daily exercise response. |
| **Dillon et al. (2018), bed rest / exercise + testosterone** | https://pmc.ncbi.nlm.nih.gov/articles/PMC6095739/ | **Reviewed, not embedded**: terrestrial head-down bed rest analog; multi-arm intervention, not equivalent to no-exercise spaceflight baseline. |
| **NASA OSD-575, Inspiration4** | https://osdr.nasa.gov/bio/repo/data/studies/OSD-575 | **Candidate only**, not embedded: real human short-flight blood analytes. It is not TBone, not a complete verified CTX/P1NP panel, and not linked to the same subjects. |
| **NASA OSD-661 / OSD-654** | https://osdr.nasa.gov/bio/repo/data/studies/OSD-661 · https://osdr.nasa.gov/bio/repo/data/studies/OSD-654 | **Candidates only**, not embedded: non-human bone-related studies; should not be used as human measurements. |
| **TBone Supplementary Information (Table S1)** | From Gabel article, Supplementary Information link | **Described but not numerically transcribed** for P1NP, BSAP, PTH, calcium; requires manual cross-check before adding numerical timeline. |

**All human group values in code are reproduced from published prose/tables; none is newly measured by ASTRA.** In particular, the Axpe model and Gabel observations are from different source populations and skeletal regions, so never merge them into one patient's trajectory.

## Next steps

1. **Bone Metabolism time-series:** independently inspect TBone Supplementary Table S1 to add numeric group trajectories where actually published, with units, intervals, and sample sizes.
2. **Bone Density validation:** display published SPRINT DXA group values separately from Axpe forecast.
3. **Exercise-response research:** identify sufficiently linked exercise + skeletal outcomes and validate causal assumptions **before** changing the BMD dynamic equation or MPC objective.
4. **Mission selection:** LEO, lunar orbit/surface, Mars transit/surface with official NASA contextual risk ratings; no guessed BMD gravity coefficients.
5. **Personalization:** consider contextual bandits only when a measurable, defensible feedback signal exists.

---

## v1.1 — Bone Quality Dynamics (exploratory, postflight only)

**What changed:** `bone_quality_dynamics.py` converts the **three published group-median follow-up observations** for each distal-tibia indicator in Gabel et al. (2022), Table 1, into a continuous **descriptive mathematical curve** for **0–12 months AFTER landing**. It does not create or infer daily astronaut measurements.

Study: https://pmc.ncbi.nlm.nih.gov/articles/PMC9247070/ (DOI 10.1038/s41598-022-13461-1), n=17 ISS astronauts. Note that **0% at preflight is a reference definition**, not an extra postflight observation.

### Mathematical methods

1. **PCHIP (default; all 8 metrics).** Piecewise cubic Hermite interpolation passes through the three *observed group median percentage changes* at return, R+6 months and R+12 months. A segment has the form
   `q(s) = h00(s)*y_j + h10(s)*h*m_j + h01(s)*y_(j+1) + h11(s)*h*m_(j+1)`,
   where `s=(t-t_j)/h`, `h00=2s³-3s²+1`, `h10=s³-2s²+s`, `h01=-2s³+3s²`, `h11=s³-s²` and `m_j` are shape-preserving slopes chosen by SciPy PCHIP. This is **interpolation, not an independently validated physiological forecast**.
2. **Optional exponential fit** for indicators whose observed changes move monotonically toward their preflight reference:
   `Q(t) = a + (Q(0)-a)*exp(-k*t)` with `t` in **months after landing**, estimated by constrained nonlinear least squares on the three **published group median changes**, with `k>=0`. An exact match to three points does **not** demonstrate predictive validity or establish a physiological rate. Nonmonotonic indicators (e.g. trabecular vBMD) reject this model rather than forcing a misleading recovery curve.

All output is **% change from preflight**, not original HR-pQCT units (those original units are retained in metadata). The 6/12 month positions use the approximate conversion `365.25/12 days/month`; these are *not* precise scan dates. There is **no extrapolation before landing, after R+12 months, or to Moon/Mars**.

### How to use

- Run `python -m uvicorn astra.api:app --reload` then open `/charts`.
- In **Bone Quality — Published ISS Study**, pick one of the 8 indicators. The original published values remain in the first plot. The **NEW** second chart overlays the mathematical group-level curve with 3 blue observed points. Drag **Explore days after return** to inspect an interpolated value.
- Select **Exponential fit** only when enabled for that indicator. Otherwise use **PCHIP interpolation**.
- API: `GET /bone-quality/dynamics?metric_id=failure_load&method=pchip&step_days=7`. Another example: `...method=exponential` for `failure_load`. Unsupported model/indicator combinations return HTTP 422.
- Optional advanced API parameter `personal_return_change_pct` creates an **illustrative constant-offset scenario** aligned to a supplied *same-indicator, same-distal-tibia* return measurement. **This is not a trained or validated individual forecast** and is *not shown by default* in the dashboard.

### Crucial limitations / next research steps

- These are **group medians from 17 astronauts**, with only three postflight summary points, not individual longitudinal measurements. Confidence intervals for individual response cannot be calibrated from these medians. The graphical line must not be described as a personal health prediction or measurement.
- We **cannot predict in-flight bone-quality decline**, estimate a causal exercise effect, or personalize a recovery rate with these summaries.
- Obtain individual HR-pQCT preflight/return/follow-up records, scan variability, anatomical-site consistency, and relevant exercise exposure before testing individualized state estimation (e.g. Bayesian hierarchical models or Kalman filters).
- Bone Density, Bone Metabolism and MPC are **unchanged** in v1.1.

### New files / updates

- `astra/bone_quality_dynamics.py`: validated-domain interpolation and optional constrained exponential fit.
- `astra/api.py`: new `/bone-quality/dynamics` endpoint.
- `astra/charts.py`, `astra/static/dashboard.html`, `astra/static/dashboard.js`: always-visible recovery curve, blue measured markers, method selector and day slider.
- `tests/test_engine.py`: test published knots, rejection of inappropriate models, API parameters and provenance.

---

# v1.2 — Evidence & Exercise Lab

**New page:** `http://127.0.0.1:8000/evidence-lab`

**New endpoint:** `POST /evidence-plan` (see `/docs`). The previous `/charts`, `/optimize`, `/simulate`, TBone APIs and dashboard remain unchanged.

## What it takes as input

- Optional **initial absolute femoral-neck DXA BMD** in g/cm². Blank is allowed; the app does not fabricate patient BMD or T-score.
- **Mission forecast duration** in days, to run the *published* Axpe population reference.
- **Bone Quality metric** (8 published distal-tibia HR-pQCT metrics). The app shows group medians and a descriptive curve **only for the first year after return to Earth**.
- Optional **actual laboratory observations** (biomarker name, value, unit, phase and time). Values entered by users are labeled unverified and are not merged with the TBone cohort, inferred to be NASA measurements, or used for false forecasts.
- **Exercise preferences** (7-day time budget, desired time/day, resistance share and two intensity categories) and an explicitly hypothetical fatigue ceiling.

## Output and scientific meaning

| Panel | What you see | Is this a personal forecast? |
|---|---|---|
| Bone Density | Axpe femoral-neck **population** reference during spaceflight | No; a literature reference curve, with absolute units only when initial DXA is supplied |
| Bone Quality | TBone published group distal-tibia percent-change points + PCHIP postflight descriptive interpolation | No; this is postflight group recovery, **not** an inflight/personal forecast |
| Bone Metabolism | TBone preflight group mean values for CTx, NTx, osteocalcin or sclerostin; user-entered measurements recorded separately | No dynamic biomarker forecast without longitudinal numeric measurements and a validated model |
| Exercise | SciPy SLSQP 7-day schedule with resistance/aerobic minutes and chosen intensities | Mathematical scheduling recommendation, NOT validated clinical exercise advice |

### Critically important: cannot compute valid exercise vs no-exercise bone trajectories yet

The two exercise *schedules* are known: a chosen optimized schedule and 0 min/day. **The two physiological outcome trajectories are NOT identifiable** from the research numbers presently included in the project. The API explicitly responds:

```json
"counterfactuals": {
  "optimized_exercise_bone_outcome": null,
  "zero_exercise_bone_outcome": null,
  "difference": null,
  "identifiable": false
}
```

The published Axpe curve is not a no-exercise control; the TBone data do not estimate the causal effect of exercise on a new astronaut's bone strength/turnover; the historical cohorts, sites, units, phases, and participants are different. Filling in the missing bone trajectories with plausible-looking values would be made-up physiology. Do not present this as an 'optimal bone health' system yet.

### Minimal workflow

```text
Input initial DXA, optional biomarker observations, exercise constraints
                      |
         +------------+-------------+
         |            |             |
     Axpe BMD     TBone quality   TBone metabolism
   population     distal tibia    published group
   reference      postflight      biomarker values
         |            |             |
         +------------+-------------+
                      |
            Three evidence charts
                      |
             Plain-language notes

Exercise budget + preferences
                      |
            SLSQP planner (MPC)
                      |
          Seven daily exercise bars
                      |
       NO proven exercise->bone causal model yet
```

### Sources

- **Axpe et al. (2020)** femoral-neck population BMD reference: https://pmc.ncbi.nlm.nih.gov/articles/PMC6975633/ (DOI 10.1371/journal.pone.0226434).
- **Gabel et al. (2022)** TBone HR-pQCT Table 1 and published bone biomarker group results: https://pmc.ncbi.nlm.nih.gov/articles/PMC9247070/ (DOI 10.1038/s41598-022-13461-1).
- **SPRINT** exercise research candidate for future validation, *not fitted in v1.2*: https://pmc.ncbi.nlm.nih.gov/articles/PMC7434884/.
- **Scott et al. (2023)** exercise study candidate, *not fitted in v1.2*: https://www.nature.com/articles/s41526-023-00256-5.
- NASA Human Research Roadmap: https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=77.

## Implementation

- `astra/evidence_planner.py`: validates inputs, combines bounded evidence and existing exercise optimizer, explicitly refuses unidentifiable causal comparisons.
- `astra/evidence_routes.py`: endpoints for this page and combined API.
- `astra/static/evidence_lab.html`: four custom canvas plots, labeled observations, scientific explanations.
- `tests/test_evidence_lab.py`: evidence status, no invented outcome, budget response, provenance validation, API tests.

Existing source files and API endpoints retained unchanged, apart from registering the new router in `api.py`.

## Next scientific work

1. Find matched and appropriately accessible longitudinal **exercise dose + measured DXA/HR-pQCT + biomarkers** outcomes for the same participants, including comparator conditions and covariates.
2. Determine which exercise response parameters are statistically *identifiable*, distinguish causal trials from observational correlations, quantify uncertainty and site/mission limits.
3. Only then implement an explicitly scoped exercise-conditioned bone dynamics model and compare it to a **scientifically supported comparator**. Not every study has a true no-exercise spaceflight arm.
4. Add prospective, real-person repeated measures with correctly validated data provenance, then state estimation and receding-horizon replanning. An individual's outcomes must not be inferred from group means alone.
