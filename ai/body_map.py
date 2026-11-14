"""Stable IDs for clickable 3D mesh groups: send these IDs to the frontend team."""
REGIONS = [
    {"id": "hip_femoral_neck", "label": "Hip / femoral neck", "status": "modeled", "metrics": ["relative_bmd_pct"], "actions": ["simulate", "optimize"]},
    {"id": "spine", "label": "Spine", "status": "informational", "metrics": [], "actions": []},
    {"id": "blood", "label": "Blood biomarkers", "status": "data_pending_import", "metrics": ["glucose", "creatinine", "crp"], "actions": []},
    {"id": "muscles", "label": "Muscular system", "status": "informational", "metrics": [], "actions": []},
    {"id": "heart", "label": "Cardiovascular system", "status": "informational", "metrics": [], "actions": []},
]
