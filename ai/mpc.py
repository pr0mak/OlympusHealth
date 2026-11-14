"""Small receding-horizon-style optimizer using scipy SLSQP.

This MVP solves one finite-horizon constrained plan. Re-solving with new
measurements each day is the intended MPC loop, not implemented as a daemon.
"""
import numpy as np
from scipy.optimize import minimize

from .schemas import OptimizeRequest, OptimizationResponse
from .simulator import simulate


def optimize(req: OptimizeRequest) -> OptimizationResponse:
    n = req.planning_days
    p = req.model
    budget = min(req.exercise_budget_minutes, req.max_minutes_per_day * n)

    def states(u):
        bmd = req.profile.initial_bmd_pct
        fatigue = req.profile.initial_fatigue
        bmds, fatigues = [], []
        for mins in u:
            hours = mins / 60.0
            bmd += -p.bmd_loss_pp_per_day + p.exercise_benefit_pp_per_hour * hours
            fatigue = max(0, fatigue + p.fatigue_per_hour * hours - p.fatigue_recovery_per_day)
            bmds.append(bmd)
            fatigues.append(fatigue)
        return np.asarray(bmds), np.asarray(fatigues)

    def objective(u):
        b, f = states(u)
        # BMD preservation, fatigue, and resource-use tradeoff.
        return float(np.sum((100 - b) ** 2 + req.fatigue_weight * (f / 20) ** 2
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
    best = simulate(req.profile, u.tolist(), p)
    fixed = simulate(req.profile, [budget / n] * n, p)
    return OptimizationResponse(**best.model_dump(), schedule_minutes=[round(float(x), 3) for x in u],
                                solver_success=True, solver_message=str(result.message),
                                baseline_trajectory=fixed.trajectory)
