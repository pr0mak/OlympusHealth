from fastapi.testclient import TestClient
from astra.api import app
from astra.evidence_planner import EvidencePlanRequest, build_evidence_plan
from pydantic import ValidationError
import pytest
c=TestClient(app)

def test_site_and_no_fabricated_counterfactuals():
    data=build_evidence_plan(EvidencePlanRequest())
    assert data['density']['trajectory'][-1]['day']==180
    assert data['quality']['metric']['anatomical_site']=='distal tibia'
    assert data['counterfactuals']['identifiable'] is False
    assert data['counterfactuals']['optimized_exercise_bone_outcome'] is None
    assert data['counterfactuals']['zero_exercise_bone_outcome'] is None

def test_femoral_absolute_only_when_supplied():
    a=build_evidence_plan(EvidencePlanRequest())
    b=build_evidence_plan(EvidencePlanRequest(initial_femoral_neck_bmd_g_cm2=.9))
    assert 't_score' not in a['density']['trajectory'][-1]
    assert b['density']['trajectory'][-1]['bmd_g_cm2']>0

def test_exercise_changes_with_budget_without_bone_treatment_claim():
    a=build_evidence_plan(EvidencePlanRequest(weekly_exercise_budget=70))
    b=build_evidence_plan(EvidencePlanRequest(weekly_exercise_budget=420))
    assert a['exercise']['total_minutes'] <= 70+.01
    assert b['exercise']['total_minutes']>a['exercise']['total_minutes']
    assert a['density']['trajectory']==b['density']['trajectory']

def test_reject_unsupported_external_verification():
    with pytest.raises(ValidationError):
        EvidencePlanRequest(observations=[{'metric_id':'ctx_urinary','value':3.2,'unit':'µg/mmolCr','phase':'preflight','day':0,'provenance':'verified_external'}])

def test_lab_endpoints_and_exercise():
    assert c.get('/evidence-lab').status_code==200
    r=c.post('/evidence-plan',json={'weekly_exercise_budget':70,'quality_metric':'failure_load'})
    assert r.status_code==200,r.text
    j=r.json()
    assert len(j['exercise']['schedule'])==7
    assert len(j['metabolism']['metrics'])==4

def test_bad_quality_metric():
    assert c.post('/evidence-plan',json={'quality_metric':'nonexistent'}).status_code==422
