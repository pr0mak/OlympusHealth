"""Published femoral-neck BMD loss reference (Axpe et al., PLOS ONE 2020).

The published curve predicts percent loss relative to a preflight value.
It was fit to aggregated data from 69 astronauts and does NOT model exercise,
individual patient response, or clinical risk. This is a reference only.
"""
from math import exp

DECAY_PER_DAY = 0.0006371
PLATEAU_LOSS_PCT = 69.0
SOURCE_DOI = "10.1371/journal.pone.0226434"


def loss_pct(days_since_launch: float) -> float:
    if days_since_launch < 0:
        raise ValueError("days_since_launch must be >= 0")
    return PLATEAU_LOSS_PCT * (1 - exp(-DECAY_PER_DAY * days_since_launch))


def remaining_bmd_pct(days_since_launch: float, initial_bmd_pct: float = 100.0) -> float:
    """Percent of pre-flight baseline when initial_bmd_pct=100.

    initial_bmd_pct provides a multiplicative preflight-relative scaling;
    not an absolute DXA g/cm2 value.
    """
    if initial_bmd_pct <= 0:
        raise ValueError("initial_bmd_pct must be positive")
    return initial_bmd_pct * (1 - loss_pct(days_since_launch) / 100)


def daily_loss_pp(day: int) -> float:
    """Loss in percentage points of *preflight baseline* over day -> day+1."""
    if day < 0:
        raise ValueError("day must be >= 0")
    return loss_pct(day + 1) - loss_pct(day)


def reference_trajectory(days: int) -> list[dict]:
    if not 0 <= days <= 1200:
        raise ValueError("days must be between 0 and 1200")
    return [{"day": t, "bmd_pct": round(remaining_bmd_pct(t), 5),
             "bmd_loss_pct": round(loss_pct(t), 5)} for t in range(days + 1)]
