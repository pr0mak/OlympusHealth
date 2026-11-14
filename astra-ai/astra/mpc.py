"""Small receding-horizon-style optimizer using scipy SLSQP.

This MVP solves one finite-horizon constrained plan. Re-solving with new
measurements each day is the intended MPC loop, not implemented as a daemon.
"""
import numpy as np
from scipy.optimize import minimize

from .schemas import OptimizeRequest, OptimizationResponse
from .simulator import simulate
from .bone_model import step
from .exercise import sessions_for_minutes, intensity_load


def optimize(req: OptimizeRequest) -> OptimizationResponse:
    n = req.planning_days
    p = req.model
    budget = min(req.exercise_budget_minutes, req.max_minutes_per_day * n)
    prefs = req.exercise

    def states(u):
        bmd = req.profile.initial_bmd_pct
        fatigue = req.profile.initial_fatigue
        bmds, fatigues = [], []
        for day, mins in enumerate(u):
            bmd, fatigue = step(bmd, fatigue, intensity_load(float(mins), prefs), p, req.profile.mission_day + day)
            bmds.append(bmd)
            fatigues.append(fatigue)
        return np.asarray(bmds), np.asarray(fatigues)

    def objective(u):
        # Explicitly plan toward the USER-PROVIDED activity target, not a
        # fabricated BMD treatment efficacy. Fatigue is a hypothetical proxy.
        _, f = states(u)
        target = min(prefs.target_minutes_per_day, req.max_minutes_per_day)
        return float(np.sum(((u - target) / 60) ** 2
                            + req.fatigue_weight * (f / 20) ** 2
                            + req.exercise_weight * (u / 60) ** 2))

    constraints = [
        {"type": "ineq", "fun": lambda u: budget - np.sum(u)},
        {"type": "ineq", "fun": lambda u: req.fatigue_limit - states(u)[1]},
    ]
    x0 = np.zeros(n, dtype=float)  # feasible unless initial fatigue exceeds limit
    if req.profile.initial_fatigue > req.fatigue_limit:
        raise ValueError("Starting fatigue exceeds limit; reduce initial value or review constraint")
    result = minimize(objective, x0, method="SLSQP",
                      bounds=[(0, req.max_minutes_per_day)] * n,
                      constraints=constraints,
                      options={"maxiter": 300, "ftol": 1e-9})
    u = np.clip(result.x, 0, req.max_minutes_per_day)
    if not result.success or np.sum(u) > budget + 1e-3 or np.max(states(u)[1]) > req.fatigue_limit + 1e-3:
        # Never advertise an infeasible optimization as a successful MPC solution.
        raise RuntimeError(f"No verified feasible solution: {result.message}")
    best = simulate(req.profile, u.tolist(), p, prefs)
    fixed = simulate(req.profile, [budget / n] * n, p, prefs)
    sessions = [dict(day=i+1, **sessions_for_minutes(float(m), prefs)) for i, m in enumerate(u)]
    return OptimizationResponse(**best.model_dump(), schedule_minutes=[round(float(x), 3) for x in u],
                                exercise_sessions=sessions,
                                exercise_model_status="exercise_types_and_intensities_are_planning_choices_not_validated_BMD_effects",
                                solver_success=True, solver_message=str(result.message),
                                baseline_trajectory=fixed.trajectory)
