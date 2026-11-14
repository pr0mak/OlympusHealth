from fastapi.testclient import TestClient
from astra.api import app

client = TestClient(app)

def request(**overrides):
    return {"astronautId":"INTEGRATION-01", "mission":{"environment":"LEO","durationDays":180,"currentDay":0},
            "health":{"initialFemoralNeckBmdGcm2":None},
            "exercise":{"weeklyBudgetMinutes":70,"targetMinutesPerDay":60,"resistanceFraction":.8,"resistanceIntensity":"high","aerobicIntensity":"low","initialFatigue":20,"fatigueCeiling":70},
            "qualityMetricId":"failure_load", "metabolismMetricId":"ctx_urinary", **overrides}

def test_integration_projection():
    r=client.post('/api/v1/projection',json=request())
    assert r.status_code==200, r.text
    d=r.json()
    assert d['boneDensity']['trajectory'][-1]['t_score'] is None
    assert d['boneQuality']['values']==[0,-4.5,-1.9,-1.3]
    assert d['boneMetabolism']['values']['recovered']['mean']==74
    assert len(d['exercisePlan']['days'])==7
    assert d['exercisePlan']['totalMinutes']<=70.001
    assert d['scientificIntegrity']['exerciseVersusNoExerciseBoneEffectAvailable'] is False
    assert d['exercisePlan']['days'][0]['resistance']['minutes'] >= 0

def test_initial_dxa_and_mission_warning():
    r=client.post('/api/v1/projection',json=request(health={'initialFemoralNeckBmdGcm2':.9}, mission={'environment':'MARS_SURFACE','durationDays':180,'currentDay':0}))
    assert r.status_code==200
    assert r.json()['boneDensity']['trajectory'][0]['t_score'] is not None
    assert 'NOT validated' in r.json()['boneDensity']['limitation']

def test_invalid_metrics_and_days():
    assert client.post('/api/v1/projection',json=request(qualityMetricId='nonsense')).status_code==422
    assert client.post('/api/v1/projection',json=request(mission={'environment':'LEO','durationDays':10,'currentDay':12})).status_code==422
    assert client.get('/api/v1/catalog').status_code==200
