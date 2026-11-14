"""DXA femoral-neck BMD conversions for the ASTRA demo.

Reference mean and SD are from the NHANES young-adult female reference
used in Axpe et al. (2020), NOT astronaut-specific DXA reference ranges.
The NASA -2.0 threshold is for monitoring/visualization ONLY.
"""
from typing import Optional

REFERENCE_MEAN_G_CM2 = 0.858
REFERENCE_SD_G_CM2 = 0.120
NASA_DEMO_THRESHOLD_T = -2.0


def relative_to_absolute(bmd_pct: float, preflight_bmd_g_cm2: float) -> float:
    """bmd_pct is relative to preflight (100 = unchanged)."""
    if preflight_bmd_g_cm2 <= 0:
        raise ValueError("preflight BMD must be positive")
    return float(preflight_bmd_g_cm2 * bmd_pct / 100.0)


def t_score(bmd_g_cm2: float, mean: float = REFERENCE_MEAN_G_CM2,
            std: float = REFERENCE_SD_G_CM2) -> float:
    if bmd_g_cm2 < 0 or std <= 0:
        raise ValueError("invalid BMD or reference SD")
    return float((bmd_g_cm2 - mean) / std)


def t_score_band(score: float) -> str:
    """Descriptive category only; NOT a diagnosis for an astronaut."""
    if score <= -2.5:
        return "at_or_below_minus_2_5"
    if score < -2.0:
        return "below_nasa_minus_2_reference"
    if score < -1.0:
        return "between_minus_2_and_minus_1"
    return "at_or_above_minus_1"


def bone_metrics(bmd_pct: float, preflight_bmd_g_cm2: Optional[float]) -> dict:
    if preflight_bmd_g_cm2 is None:
        return {"bmd_g_cm2": None, "t_score": None, "t_score_band": None,
                "below_nasa_minus_2_reference": None}
    absolute = relative_to_absolute(bmd_pct, preflight_bmd_g_cm2)
    score = t_score(absolute)
    return {"bmd_g_cm2": round(absolute, 6), "t_score": round(score, 4),
            "t_score_band": t_score_band(score),
            "below_nasa_minus_2_reference": bool(score < NASA_DEMO_THRESHOLD_T)}
