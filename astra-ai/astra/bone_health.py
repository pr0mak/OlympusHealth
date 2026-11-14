"""Optional bone health observations, separate from the BMD forecast/MPC.

NASA roadmap motivates the *categories*; values are supplied measurements or
explicitly labelled synthetic examples, not NASA astronaut measurements.
"""
from typing import Literal
from pydantic import BaseModel, Field, model_validator


class BoneObservation(BaseModel):
    day: int = Field(ge=0, le=1500)
    source_type: Literal['measured']
    source_note: str = Field(min_length=3, max_length=200)
    # Optional structural QCT and finite-element readouts; distinct instruments.
    trabecular_vbmd_mg_cm3: float | None = Field(default=None, ge=0, le=1000)
    cortical_thickness_mm: float | None = Field(default=None, ge=0, le=20)
    estimated_strength_n: float | None = Field(default=None, ge=0, le=50000)
    # Optional assays; values and reference ranges are assay-dependent.
    ctx_ng_l: float | None = Field(default=None, ge=0, le=10000)
    p1np_ug_l: float | None = Field(default=None, ge=0, le=3000)
    bone_alp_ug_l: float | None = Field(default=None, ge=0, le=1000)
    calcium_mg_dl: float | None = Field(default=None, ge=0, le=25)
    pth_pg_ml: float | None = Field(default=None, ge=0, le=2000)

    @model_validator(mode='after')
    def require_metric(self):
        fields = METRIC_GROUPS['bone_quality'] + METRIC_GROUPS['bone_metabolism']
        if not any(getattr(self, key) is not None for key in fields):
            raise ValueError('Supply at least one quality or metabolism metric')
        return self


METRIC_GROUPS = {
    'bone_density': ['bmd_pct', 'bmd_g_cm2', 't_score'],
    'bone_quality': ['trabecular_vbmd_mg_cm3', 'cortical_thickness_mm', 'estimated_strength_n'],
    'bone_metabolism': ['ctx_ng_l', 'p1np_ug_l', 'bone_alp_ug_l', 'calcium_mg_dl', 'pth_pg_ml'],
}
METRIC_INFO = {
    'trabecular_vbmd_mg_cm3': {'label': 'Trabecular vBMD (QCT)', 'unit': 'mg/cm³'},
    'cortical_thickness_mm': {'label': 'Cortical thickness (QCT)', 'unit': 'mm'},
    'estimated_strength_n': {'label': 'Estimated bone strength (FE)', 'unit': 'N'},
    'ctx_ng_l': {'label': 'CTX · bone resorption', 'unit': 'ng/L'},
    'p1np_ug_l': {'label': 'P1NP · bone formation', 'unit': 'µg/L'},
    'bone_alp_ug_l': {'label': 'Bone-specific ALP', 'unit': 'µg/L'},
    'calcium_mg_dl': {'label': 'Serum calcium', 'unit': 'mg/dL'},
    'pth_pg_ml': {'label': 'PTH', 'unit': 'pg/mL'},
}


def summarize_observations(observations: list[BoneObservation]) -> dict:
    if len(observations) > 2000:
        raise ValueError('Too many observations (maximum 2000)')
    ordered = sorted(observations, key=lambda o: o.day)
    coverage = {group: {key: sum(getattr(o, key) is not None for o in ordered)
                   for key in keys} for group, keys in METRIC_GROUPS.items() if group != 'bone_density'}
    return {
        'observations': [o.model_dump() for o in ordered],
        'coverage': coverage,
        'data_status': 'user_supplied_unverified' if ordered else 'unavailable',
        'note': 'Measurements are monitoring overlays, NOT states of MPC or trained forecasts. '
                'No diagnostic ranges or fracture probabilities inferred.',
    }
