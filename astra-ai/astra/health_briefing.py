"""Plain-language, provenance-aware astronaut bone-health briefings.

These are deterministic, auditable descriptions of data, NOT an LLM or a
medical interpretation. Missing observations stay missing; a source note in a
CSV does not mean NASA/clinicians verified a measurement.
"""
from typing import Literal

from pydantic import BaseModel, Field

from .bmd_reference import SOURCE_DOI, remaining_bmd_pct
from .bone_health import BoneObservation, METRIC_GROUPS, METRIC_INFO
from .bone_metrics import bone_metrics


class BriefingRequest(BaseModel):
    days: int = Field(default=180, ge=0, le=1200)
    initial_bmd_g_cm2: float | None = Field(default=None, gt=0, le=2.5)
    observations: list[BoneObservation] = Field(default_factory=list, max_length=2000)


class BriefingQuestion(BaseModel):
    context: BriefingRequest = Field(default_factory=BriefingRequest)
    topic: Literal['summary', 'density', 'quality', 'metabolism', 'exercise', 'limitations']


def _observed_section(group: str, observations: list[BoneObservation]) -> dict:
    fields = METRIC_GROUPS[group]
    records = []
    for ob in observations:
        for field in fields:
            val = getattr(ob, field)
            if val is not None:
                records.append({'day': ob.day, 'metric': field, 'value': val,
                                'unit': METRIC_INFO[field]['unit'],
                                'label': METRIC_INFO[field]['label'],
                                'source_note': ob.source_note})
    records.sort(key=lambda r: (r['day'], r['metric']))
    if not records:
        label = 'Bone Quality' if group == 'bone_quality' else 'Bone Metabolism'
        return {
            'key': group,
            'label': label,
            'status': 'no_data',
            'badge': 'NO DATA',
            'headline': 'No measurements loaded',
            'summary': ('No bone-structure scan measurements are available.' if group == 'bone_quality'
                        else 'No bone-related laboratory measurements are available.'),
            'details': 'This is missing data, not a normal or abnormal result.',
            'latest': None,
            'count': 0,
            'evidence': 'No verified observations',
        }
    last = records[-1]
    label = 'Bone Quality' if group == 'bone_quality' else 'Bone Metabolism'
    return {
        'key': group,
        'label': label,
        'status': 'user_supplied_unverified',
        'badge': 'USER-SUPPLIED · UNVERIFIED',
        'headline': f'{len(records)} source-labelled value(s) provided',
        'summary': (f'Latest supplied result: {last["label"]} = {last["value"]:g} '
                    f'{last["unit"]} on mission day {last["day"]}.'),
        'details': 'These values are not independently verified for source, assay, site, or comparability. No health classification is inferred.',
        'latest': last,
        'count': len(records),
        'evidence': 'User-supplied data; not automatically NASA-verified',
    }


def generate_briefing(request: BriefingRequest) -> dict:
    """Generate structured briefings with no thresholds, diagnoses, or fake data."""
    days = request.days
    remaining = remaining_bmd_pct(days)
    loss = 100.0 - remaining
    metric = bone_metrics(remaining, request.initial_bmd_g_cm2)
    density_summary = (
        f'For a {days}-day mission, a published population model estimates about '
        f'{loss:.2f}% femoral-neck bone-density loss relative to preflight. '
        'This is not a personal measurement or an exercise-adjusted forecast.'
    )
    if request.initial_bmd_g_cm2 is None:
        density_details = ('No preflight absolute DXA BMD was supplied. '
                           'Absolute BMD and T-score are therefore unavailable.')
    else:
        density_details = (
            f'Using the user-supplied starting value of {request.initial_bmd_g_cm2:g} g/cm², '
            f'the model-derived value is {metric["bmd_g_cm2"]:.3f} g/cm² '
            f'and the calculated T-score is {metric["t_score"]:.2f}. '
            'The starting value has not been independently verified, and the T-score depends on the reference population.'
        )
    density = {
        'key': 'bone_density',
        'label': 'Bone Density',
        'status': 'literature_model',
        'badge': 'LITERATURE-BASED FORECAST',
        'headline': f'Estimated −{loss:.2f}% over {days} days',
        'summary': density_summary,
        'details': density_details,
        'count': 0,
        'remaining_bmd_pct': round(remaining, 4),
        'loss_pct': round(loss, 4),
        'absolute_bmd_g_cm2': metric['bmd_g_cm2'],
        't_score': metric['t_score'],
        'evidence': f'Axpe et al. (2020), DOI {SOURCE_DOI}; population reference curve',
    }
    quality = _observed_section('bone_quality', request.observations)
    metabolism = _observed_section('bone_metabolism', request.observations)
    missing = [s['label'] for s in (quality, metabolism) if s['status'] == 'no_data']
    knowledge = 'Published population-level femoral-neck BMD forecast is available.'
    unknown = ('No personal DXA BMD measurement was provided. ' if request.initial_bmd_g_cm2 is None
               else 'Preflight DXA value is user-supplied and unverified. ')
    if missing:
        unknown += 'Missing measurements: ' + ', '.join(missing) + '. '
    if quality['status'] != 'no_data' or metabolism['status'] != 'no_data':
        unknown += 'Uploaded measurements are user-supplied and not independently verified. '
    unknown += 'Individual fracture risk and bone-strength changes cannot be calculated.'
    return {
        'version': '0.7',
        'status': 'evidence_labeled_rule_based_explanation',
        'title': 'Your bone health — in plain language',
        'headline': 'The research model projects bone-density loss during the mission.',
        'intro': density_summary,
        'what_we_know': knowledge,
        'what_we_do_not_know': unknown.strip(),
        'next_step': ('Compare the model forecast with a verified preflight DXA report and any '
                      'available bone scans or laboratory measurements. Discuss individual '
                      'interpretation and exercise decisions with the mission medical team.'),
        'sections': [density, quality, metabolism],
        'exercise_note': ('The current MPC makes an experimental 7-day exercise schedule. '
                          'It does not predict how resistance or aerobic exercise changes BMD.'),
        'provenance': {'density': 'published_population_model',
                       'initial_bmd': 'not_provided' if request.initial_bmd_g_cm2 is None else 'user_supplied_unverified',
                       'quality': quality['status'], 'metabolism': metabolism['status']},
        'disclaimer': ('Rule-based research communication prototype, not generative AI, '
                       'medical diagnosis, exercise prescription, or individual fracture-risk estimate.'),
    }


def answer_question(req: BriefingQuestion) -> dict:
    """Answer a small, transparent set of health-briefing questions."""
    briefing = generate_briefing(req.context)
    sections = {item['key']: item for item in briefing['sections']}
    answers = {
        'summary': briefing['intro'] + ' ' + briefing['what_we_do_not_know'],
        'density': sections['bone_density']['summary'] + ' ' + sections['bone_density']['details'],
        'quality': sections['bone_quality']['summary'] + ' ' + sections['bone_quality']['details'],
        'metabolism': sections['bone_metabolism']['summary'] + ' ' + sections['bone_metabolism']['details'],
        'exercise': briefing['exercise_note'],
        'limitations': briefing['what_we_do_not_know'] + ' ' + briefing['disclaimer'],
    }
    return {'topic': req.topic, 'answer': answers[req.topic],
            'response_method': 'deterministic_rules_not_llm',
            'disclaimer': briefing['disclaimer']}
