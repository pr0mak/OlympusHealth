from fastapi.testclient import TestClient
from astra.api import app

client = TestClient(app)


def test_body_map_has_stable_region():
    res = client.get('/body-map')
    assert res.status_code == 200
    assert any(r['id'] == 'hip_femoral_neck' for r in res.json()['regions'])


def test_simulation_is_initial_plus_days():
    res = client.post('/simulate', json={'horizon_days': 10, 'exercise_minutes_per_day': 60})
    assert res.status_code == 200, res.text
    result = res.json()
    assert len(result['trajectory']) == 11
    assert result['model_status'] == 'synthetic_demonstration'


def test_optimizer_uses_budget():
    res = client.post('/optimize', json={'planning_days': 7, 'exercise_budget_minutes': 420})
    assert res.status_code == 200, res.text
    plan = res.json()['schedule_minutes']
    assert len(plan) == 7
    assert sum(plan) <= 420.01
    assert all(0 <= x <= 120 for x in plan)


def test_no_unrealistic_minutes():
    res = client.post('/simulate', json={'exercise_minutes_per_day': 1000})
    assert res.status_code == 422


def test_published_bmd_reference_endpoint():
    from astra.bmd_reference import remaining_bmd_pct, daily_loss_pp
    assert remaining_bmd_pct(0) == 100.0
    assert 92 < remaining_bmd_pct(180) < 94
    assert daily_loss_pp(0) > daily_loss_pp(180) > 0
    response = client.get('/reference/bmd?days=30')
    assert response.status_code == 200
    data = response.json()
    assert data['model_status'] == 'published_population_reference_no_exercise_effect'
    assert len(data['trajectory']) == 31
    assert data['trajectory'][0]['bmd_pct'] == 100.0


def test_zero_exercise_simulation_matches_published_reference():
    from astra.bmd_reference import remaining_bmd_pct
    response = client.post('/simulate', json={'horizon_days': 30, 'exercise_minutes_per_day': 0})
    assert response.status_code == 200, response.text
    assert abs(response.json()['trajectory'][-1]['bmd_pct'] - remaining_bmd_pct(30)) < 0.00001


def test_reference_with_nonzero_mission_day():
    from astra.bmd_reference import remaining_bmd_pct
    day = 90
    response = client.post('/simulate', json={
        'profile': {'mission_day': day, 'initial_bmd_pct': remaining_bmd_pct(day)},
        'horizon_days': 10, 'exercise_minutes_per_day': 0
    })
    assert response.status_code == 200, response.text
    assert abs(response.json()['trajectory'][-1]['bmd_pct'] - remaining_bmd_pct(100)) < 0.00001


def test_optimizer_zero_budget_follows_reference():
    response = client.post('/optimize', json={'planning_days': 7, 'exercise_budget_minutes': 0})
    assert response.status_code == 200, response.text
    assert max(response.json()['schedule_minutes']) < 1e-5
    from astra.bmd_reference import remaining_bmd_pct
    assert abs(response.json()['trajectory'][-1]['bmd_pct'] - remaining_bmd_pct(7)) < 1e-4
