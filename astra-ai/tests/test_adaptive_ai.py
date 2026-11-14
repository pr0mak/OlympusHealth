from fastapi.testclient import TestClient
from astra.api import app
from astra.adaptive_ai import _STORE

client = TestClient(app)


def req(id='TEST-AI-01', mode='demo'):
    return {'astronautId':id,'mode':mode,
            'context':{'sleepHours':6,'fatigueBefore':40,'availableMinutes':60},
            'weeklyBudgetMinutes':240, 'fatigueCeiling':85}


def test_recommend_feedback_learning_and_schedule():
    _STORE.clear()
    response=client.post('/api/v1/ai/recommend',json=req())
    assert response.status_code == 200, response.text
    d=response.json()
    assert len(d['exercisePlan']['days'])==7
    assert d['exercisePlan']['totalMinutes']<=240.01
    assert d['feedbackCount']==0
    f=client.post('/api/v1/ai/feedback',json={**{k:d[k] for k in ['astronautId','mode']},'recommendationId':d['recommendationId'], 'completionPercent':90,'fatigueAfter':25})
    assert f.status_code==200, f.text
    assert abs(f.json()['reward']-(.7*.9-.3*.25))<1e-4
    assert f.json()['status']['feedbackCount']==1
    assert sum(x['count'] for x in f.json()['status']['arms'])==1
    assert client.post('/api/v1/ai/feedback',json={**{k:d[k] for k in ['astronautId','mode']},'recommendationId':d['recommendationId'], 'completionPercent':90,'fatigueAfter':25}).status_code==404


def test_demo_synthetic_isolation_from_live():
    _STORE.clear()
    p=client.post('/api/v1/ai/demo/train',json={'astronautId':'T2','rounds':30})
    assert p.status_code==200, p.text
    assert p.json()['status']['feedbackCount']==30
    assert all(x['synthetic'] for x in p.json()['status']['history'])
    assert client.get('/api/v1/ai/status',params={'astronautId':'T2','mode':'live'}).json()['feedbackCount']==0
    assert client.post('/api/v1/ai/reset',params={'astronautId':'T2','mode':'demo'}).json()['status']['feedbackCount']==0


def test_input_validation_and_page():
    assert client.post('/api/v1/ai/recommend',json=req() | {'context':{'fatigueBefore':91,'sleepHours':6,'availableMinutes':50},'fatigueCeiling':80}).status_code==422
    r=client.get('/adaptive-ai')
    assert r.status_code==200
    assert 'Adaptive Exercise AI' in r.text
    assert 'SIMULATED' in r.text


def test_recommendation_has_real_context_scores():
    _STORE.clear()
    d=client.post('/api/v1/ai/recommend',json=req('T4')).json()
    assert len(d['alternatives']) == 3
    assert all('ucbScore' in x for x in d['alternatives'])
    assert d['selectedArm']['armId'] in ('balanced','resistance','lighter')
