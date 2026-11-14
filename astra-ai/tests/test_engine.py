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


def test_tscore_math_and_reference():
    from astra.bone_metrics import t_score, relative_to_absolute
    assert abs(t_score(0.858)) < 1e-12
    assert abs(t_score(0.618) + 2.0) < 1e-12
    assert abs(relative_to_absolute(92.5, 0.9) - 0.8325) < 1e-12
    res = client.get('/reference/bmd?days=180&initial_bmd_g_cm2=0.9')
    assert res.status_code == 200, res.text
    last = res.json()['trajectory'][-1]
    assert abs(last['bmd_g_cm2'] - 0.9 * last['bmd_pct'] / 100) < 0.000002
    assert abs(last['t_score'] - (last['bmd_g_cm2'] - 0.858)/0.120) < 0.001


def test_tscore_in_simulation_and_mpc():
    profile = {'initial_bmd_g_cm2': 0.9, 'initial_bmd_pct': 100}
    res = client.post('/simulate', json={'profile':profile,'horizon_days': 14,'exercise_minutes_per_day': 0})
    assert res.status_code == 200, res.text
    assert all(isinstance(d['t_score'], float) for d in res.json()['trajectory'])
    res = client.post('/optimize', json={'profile':profile,'planning_days': 7,'exercise_budget_minutes':70})
    assert res.status_code == 200, res.text
    j = res.json()
    assert len(j['trajectory']) == 8
    assert isinstance(j['trajectory'][-1]['t_score'], float)
    assert isinstance(j['baseline_trajectory'][-1]['t_score'], float)
    assert sum(j['schedule_minutes']) <= 70.01


def test_tscore_optional_no_invented_value():
    res = client.post('/simulate', json={'horizon_days':1})
    assert res.status_code == 200
    assert res.json()['trajectory'][0]['t_score'] is None
    assert res.json()['trajectory'][0]['bmd_g_cm2'] is None
    assert client.get('/reference/bmd?days=1&initial_bmd_g_cm2=-0.1').status_code == 422


def test_charts_page_renders_graphs_without_fake_measurements():
    res = client.get('/charts')
    assert res.status_code == 200, res.text
    assert 'Bone Density: literature baseline' in res.text
    assert 'T-score (optional)' in res.text
    assert 'MPC: 7-day exercise schedule' in res.text
    assert 'No verified measurements loaded' in res.text
    assert 'synthetic_bone_health_demo' not in res.text
    assert 'Restore demo dataset' not in res.text
    assert 'canvas' in res.text


def test_charts_controls_and_api_compatibility():
    res = client.get('/charts?days=14&budget=70&target=35&resistance_pct=60')
    assert res.status_code == 200, res.text
    assert 'name="days"' in res.text
    assert 'value="14"' in res.text
    assert client.post('/optimize', json={'planning_days': 7, 'exercise_budget_minutes': 70}).status_code == 200
    assert client.get('/charts?days=-4').status_code == 422


def test_bone_health_catalog_no_fabricated_demo():
    catalog = client.get('/bone-health/catalog')
    assert catalog.status_code == 200
    groups = catalog.json()['groups']
    assert len(groups) == 3
    assert 'trabecular_vbmd_mg_cm3' in groups['bone_quality']
    assert 'ctx_ng_l' in groups['bone_metabolism']
    assert client.get('/bone-health/demo').status_code == 404
    empty = client.get('/bone-health/observations').json()
    assert empty['observations'] == []
    assert empty['data_status'] == 'unavailable'


def test_bone_health_analyze_accepts_sparse_measured_data():
    result = client.post('/bone-health/analyze', json={'observations': [
        {'day': 60, 'source_type': 'measured', 'source_note': 'QCT instrument ABC',
         'trabecular_vbmd_mg_cm3': 145.2},
        {'day': 0, 'source_type': 'measured', 'source_note': 'blood assay XYZ',
         'ctx_ng_l': 200},
    ]})
    assert result.status_code == 200, result.text
    j = result.json()
    assert j['observations'][0]['day'] == 0
    assert j['coverage']['bone_quality']['trabecular_vbmd_mg_cm3'] == 1
    assert j['coverage']['bone_metabolism']['ctx_ng_l'] == 1
    assert j['observations'][0]['p1np_ug_l'] is None


def test_bone_health_rejects_unlabelled_and_invalid_measurements():
    bad = {'observations': [{'day': 0, 'ctx_ng_l': 200}]}
    assert client.post('/bone-health/analyze', json=bad).status_code == 422
    bad = {'observations': [{'day': 0, 'source_type': 'measured',
                             'source_note': 'test data', 'ctx_ng_l': -10}]}
    assert client.post('/bone-health/analyze', json=bad).status_code == 422
    bad = {'observations': [{'day': 0, 'source_type': 'synthetic',
                             'source_note': 'test data'}]}
    assert client.post('/bone-health/analyze', json=bad).status_code == 422


def test_charts_show_monitoring_empty_and_local_upload():
    r = client.get('/charts')
    assert r.status_code == 200, r.text
    for label in ('Bone Quality', 'Bone Metabolism', 'trabecular_vbmd_mg_cm3',
                  'ctx_ng_l', 'type="file"', 'NO FABRICATED MEASUREMENTS'):
        assert label in r.text
    assert client.get('/health').json()['status'] == 'ok'


def test_default_exercise_does_not_change_bmd_reference():
    from astra.bmd_reference import remaining_bmd_pct
    sim = client.post('/simulate', json={'horizon_days': 30, 'exercise_minutes_per_day': 90}).json()
    assert abs(sim['trajectory'][-1]['bmd_pct'] - remaining_bmd_pct(30)) < 1e-5


def test_mpc_returns_real_exercise_controls_no_medical_benefit_claim():
    res = client.post('/optimize', json={'planning_days': 7, 'exercise_budget_minutes': 180,
       'exercise': {'target_minutes_per_day': 45, 'resistance_fraction': 0.6,
                    'resistance_intensity': 'high', 'aerobic_intensity': 'low'}})
    assert res.status_code == 200, res.text
    r = res.json()
    assert len(r['exercise_sessions']) == 7
    assert sum(r['schedule_minutes']) <= 180.01
    for d in r['exercise_sessions']:
        assert abs(d['total_minutes'] - d['resistance']['minutes'] - d['aerobic']['minutes']) < 0.002
        assert d['resistance']['intensity'] == 'high'
        assert d['aerobic']['intensity'] == 'low'
    assert 'not_validated_BMD_effects' in r['exercise_model_status']


def test_health_briefing_default_has_no_fabricated_measurements():
    r = client.get('/health-briefing?days=180')
    assert r.status_code == 200, r.text
    data = r.json()
    assert data['status'] == 'evidence_labeled_rule_based_explanation'
    assert data['sections'][0]['status'] == 'literature_model'
    assert 7 < data['sections'][0]['loss_pct'] < 8
    assert data['sections'][0]['t_score'] is None
    assert data['sections'][1]['status'] == 'no_data'
    assert data['sections'][2]['status'] == 'no_data'
    assert 'not a personal measurement' in data['intro'].lower()
    assert 'not generative ai' in data['disclaimer'].lower()
    assert data['provenance']['initial_bmd'] == 'not_provided'


def test_health_briefing_user_bmd_not_verified_or_diagnostic():
    response = client.get('/health-briefing?days=180&initial_bmd_g_cm2=0.9')
    assert response.status_code == 200, response.text
    result = response.json()
    density = result['sections'][0]
    assert density['t_score'] is not None
    assert density['absolute_bmd_g_cm2'] is not None
    assert 'user-supplied' in density['details']
    assert result['provenance']['initial_bmd'] == 'user_supplied_unverified'
    assert 'not' in result['disclaimer'].lower()


def test_briefing_observations_provenance_and_no_made_up_range():
    payload = {'days': 30, 'observations': [
        {'day': 2, 'source_type': 'measured', 'source_note': 'Lab report no 123',
         'ctx_ng_l': 250},
        {'day': 8, 'source_type': 'measured', 'source_note': 'QCT report no 456',
         'trabecular_vbmd_mg_cm3': 142.5}
    ]}
    response = client.post('/health-briefing', json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['sections'][1]['status'] == 'user_supplied_unverified'
    assert result['sections'][2]['status'] == 'user_supplied_unverified'
    assert '142.5' in result['sections'][1]['summary']
    assert '250' in result['sections'][2]['summary']
    assert 'not independently' in result['sections'][1]['details']
    assert 'risk' not in result['sections'][2]['headline'].lower()
    assert result['provenance']['quality'] == 'user_supplied_unverified'
    assert 'not independently' in result['what_we_do_not_know']


def test_health_briefing_explainer_answers_and_no_llm_claims():
    for topic in ['summary', 'density', 'quality', 'metabolism', 'exercise', 'limitations']:
        r = client.post('/health-briefing/ask', json={'topic': topic, 'context': {'days': 180}})
        assert r.status_code == 200, r.text
        assert r.json()['response_method'] == 'deterministic_rules_not_llm'
        assert isinstance(r.json()['answer'], str)
    assert 'does not predict' in client.post('/health-briefing/ask',
        json={'topic':'exercise','context':{'days':180}}).json()['answer']
    assert client.post('/health-briefing/ask', json={'topic': 'diagnose'}).status_code == 422


def test_briefing_rejects_unsourced_measurements_and_bad_days():
    assert client.get('/health-briefing?days=1300').status_code == 422
    assert client.post('/health-briefing', json={
        'days': 30, 'observations': [{'day': 0, 'ctx_ng_l': 123}]}).status_code == 422
    assert client.post('/health-briefing', json={
        'days': 30, 'observations': [{'day': 0, 'source_type':'synthetic',
                                    'source_note':'fake','ctx_ng_l':100}]}).status_code == 422


def test_dashboard_has_always_visible_charts_and_plain_language_explanations():
    res = client.get('/charts')
    assert res.status_code == 200, res.text
    for title in ('Bone Health & Exercise Planner', 'What we know', 'What we don’t know',
                  'What to check next', 'Bone Density', 'Bone Quality', 'Bone Metabolism',
                  'MPC: 7-day exercise schedule', 'Planned exercise sessions',
                  'What this means', 'Ask about your results',
                  'RULE-BASED · NOT AN LLM', 'No verified measurements loaded'):
        assert title in res.text
    assert '<section class="science" id="scientific-details">' in res.text
    assert '<details class="science"' not in res.text
    for chart in ('bmd', 'tscore', 'exercise', 'quality-chart', 'metabolism-chart'):
        assert f'id="{chart}"' in res.text
    for explanation in ('bmd-meaning', 'tscore-meaning', 'exercise-meaning',
                        'quality-meaning', 'metabolism-meaning'):
        assert f'id="{explanation}"' in res.text
    assert client.get('/assets/dashboard.js').status_code == 200
    assert client.get('/assets/dashboard.css').status_code == 200
    assert 'fetch(' not in client.get('/assets/dashboard.js').text
    assert client.get('/charts?days=180&initial_bmd=0.90').status_code == 200


def test_tbone_published_source_is_group_level_and_complete():
    from astra.tbone_quality import published_tbone_quality
    d = published_tbone_quality()
    assert d['source']['site'] == 'distal tibia'
    assert d['source']['table'] == 'Table 1'
    assert 'group_median' in d['source']['data_level']
    assert len(d['source']['timepoints']) == 4
    metrics = {m['id']: m for m in d['metrics']}
    assert len(metrics) == 8
    assert metrics['failure_load']['percent_change'] == [0, -4.5, -1.9, -1.3]
    assert metrics['trabecular_vbmd']['percent_change'] == [0, -3.6, -0.9, -2.1]
    assert metrics['cortical_porosity']['percent_change'] == [0, 7.5, 7.9, 9.2]
    assert all(len(m['percent_change']) == 4 for m in d['metrics'])


def test_tbone_dashboard_and_api_keep_sources_separate():
    r = client.get('/bone-quality/published-tbone')
    assert r.status_code == 200
    assert r.json()['source']['doi'] == '10.1038/s41598-022-13461-1'
    page = client.get('/charts').text
    assert 'Bone Quality — Published ISS Study' in page
    assert 'id="quality-study-chart"' in page
    assert 'id="quality-chart"' in page
    assert 'id="exercise"' in page
    assert 'id="metabolism-chart"' in page
    assert 'No personal structural measurements loaded' in page
    assert 'published_quality' in page


def test_published_quality_is_not_offered_as_personal_records():
    assert client.get('/bone-health/observations').json()['observations'] == []
    d = client.get('/bone-quality/published-tbone').json()
    assert d['source']['data_level'] != 'personal_measured'


def test_tbone_metabolism_reported_groups_exact_values():
    from astra.tbone_metabolism import published_tbone_metabolism
    data = published_tbone_metabolism()
    assert data['source']['doi'] == '10.1038/s41598-022-13461-1'
    assert data['source']['timepoint'] == 'Preflight'
    assert [g['n'] for g in data['groups']] == [8, 9]
    metrics = {m['id']: m for m in data['metrics']}
    assert len(metrics) == 4
    assert metrics['ctx_urinary']['unit'] == 'µg/mmolCr'
    assert metrics['ctx_urinary']['recovered'] == {'mean': 74.0, 'reported_plus_minus': 13.0}
    assert metrics['ctx_urinary']['incomplete'] == {'mean': 125.0, 'reported_plus_minus': 13.0}
    assert metrics['ntx_urinary']['recovered']['mean'] == 21.0
    assert metrics['ntx_urinary']['incomplete']['mean'] == 28.0
    assert metrics['osteocalcin']['recovered']['mean'] == 20.0
    assert metrics['osteocalcin']['incomplete']['mean'] == 22.2
    assert metrics['sclerostin']['recovered']['mean'] == 32.6
    assert metrics['sclerostin']['incomplete']['mean'] == 22.7
    assert all('Preflight' == m['timepoint'] for m in data['metrics'])


def test_tbone_metabolism_qualitative_time_findings_are_not_numbers():
    from astra.tbone_metabolism import published_tbone_metabolism
    data = published_tbone_metabolism()
    assert {f['id'] for f in data['qualitative_time_findings']} == {'ctx', 'p1np', 'bsap', 'pth', 'calcium'}
    assert all('value' not in finding and 'estimated' not in finding for finding in data['qualitative_time_findings'])


def test_metabolism_api_dashboard_and_existing_mpc_unchanged():
    res = client.get('/bone-metabolism/published-tbone')
    assert res.status_code == 200, res.text
    assert res.json()['source']['data_level'].startswith('published_preflight_group')
    page = client.get('/charts')
    assert page.status_code == 200
    for marker in ('metabolism-study-chart', 'metabolism-study-meaning', 'published_metabolism',
                   'quality-study-chart', 'id="exercise"', 'id="sessions"'):
        assert marker in page.text
    assert client.get('/bone-health/observations').json()['observations'] == []
    assert client.post('/optimize', json={'planning_days': 7, 'exercise_budget_minutes':70}).status_code == 200


def test_quality_dynamics_uses_gabel_table_one_medians_and_is_bounded():
    from astra.bone_quality_dynamics import quality_recovery_curve
    curve = quality_recovery_curve('failure_load', step_days=14)
    obs = curve['observations']
    assert [o['observed_group_median_change_pct'] for o in obs] == [-4.5, -1.9, -1.3]
    assert curve['curve'][0]['estimated_group_change_pct'] == -4.5
    assert curve['curve'][-1]['estimated_group_change_pct'] == -1.3
    assert len(curve['curve']) > 20
    assert curve['source']['doi'] == '10.1038/s41598-022-13461-1'
    assert 'not an individual' in ' '.join(curve['limitations']).lower()
    assert curve['provenance'] == 'descriptive_fit_to_published_group_medians'


def test_quality_dynamics_nonmonotonic_is_not_forced_into_exponential():
    from astra.bone_quality_dynamics import quality_recovery_curve
    import pytest
    curve = quality_recovery_curve('trabecular_vbmd')
    assert curve['exponential_eligible'] is False
    with pytest.raises(ValueError, match='non-monotonic'):
        quality_recovery_curve('trabecular_vbmd', method='exponential')


def test_quality_dynamics_exponential_fit_returns_fitted_parameters():
    from astra.bone_quality_dynamics import quality_recovery_curve
    data = quality_recovery_curve('failure_load', method='exponential')
    assert data['parameters']['rate_per_month'] > 0
    assert -1.5 < data['parameters']['asymptote_pct'] < -0.9
    assert data['parameters']['residual_rmse_pp'] < 0.01


def test_quality_dynamics_personal_anchor_is_labeled_as_scenario_only():
    from astra.bone_quality_dynamics import quality_recovery_curve
    d = quality_recovery_curve('failure_load', personal_return_change_pct=-6.0)
    assert d['illustrative_personal_anchor']['curve'][0]['illustrative_change_pct'] == -6.0
    assert 'NOT validated' in d['illustrative_personal_anchor']['warning']
    assert 'illustrative_personal_anchor' not in quality_recovery_curve('failure_load')


def test_quality_dynamics_api_and_dashboard():
    valid = client.get('/bone-quality/dynamics', params={'metric_id':'failure_load', 'method':'exponential'})
    assert valid.status_code == 200, valid.text
    assert valid.json()['method'] == 'exponential'
    assert client.get('/bone-quality/dynamics', params={'metric_id':'trabecular_vbmd', 'method':'exponential'}).status_code == 422
    assert client.get('/bone-quality/dynamics', params={'metric_id':'unknown'}).status_code == 422
    assert client.get('/bone-quality/dynamics', params={'step_days':0}).status_code == 422
    page = client.get('/charts')
    assert page.status_code == 200, page.text
    assert 'quality-dynamics-chart' in page.text
    assert 'quality_dynamics' in page.text
    assert 'quality-dynamics-method' in page.text
