"""Published TBone preflight bone-metabolism biomarkers, NOT personal records.

Gabel et al., Scientific Reports (2022), Results, 'Biomarkers of bone turnover'.
Numbers below are explicitly reported group means ± reported uncertainty
(the paper uses ± in its text; do not relabel as SD/SEM without verification).
N=8 recovered vs N=9 incomplete recovery, according to tibia total BMD at R+12.
Only preflight group-comparison numbers are bundled: no invented in-flight series.
"""
from copy import deepcopy

SOURCE = {
    'title': 'Incomplete recovery of bone strength and trabecular microarchitecture at the distal tibia 1 year after return from long duration spaceflight',
    'authors': 'Gabel et al.',
    'year': 2022,
    'doi': '10.1038/s41598-022-13461-1',
    'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9247070/',
    'section': 'Results → Biomarkers of bone turnover (text following Figure 4)',
    'population': '17 ISS astronauts; 8 recovered and 9 did not fully recover distal tibia total BMD by 12 months',
    'data_level': 'published_preflight_group_mean_with_reported_plus_minus',
    'comparison': 'Preflight between recovery outcome groups; this is NOT a future prediction or causal classifier.',
    'timepoint': 'Preflight',
    'uncertainty_note': 'The article reports mean ± value in the prose; the ± quantity is preserved without assigning SD or SEM.',
    'access': 'Published group numbers; individual astronaut records not publicly available.',
}

# source textual order: recovered vs. incomplete recovery; numbers exactly as printed.
_METRICS = [
    ('ctx_urinary', 'Urinary CTx (bone resorption)', 'µg/mmolCr', 74.0, 13.0, 125.0, 13.0,
     'Marker of bone resorption, creatinine-normalized urine result; not comparable numerically with serum CTX.'),
    ('ntx_urinary', 'Urinary NTx (bone resorption)', 'nmol/mmolCr', 21.0, 2.0, 28.0, 3.0,
     'Another creatinine-normalized urinary marker of collagen breakdown.'),
    ('osteocalcin', 'Serum osteocalcin (bone turnover)', 'ng/mL', 20.0, 1.9, 22.2, 1.1,
     'A bone-turnover marker; interpretation requires context and assay information.'),
    ('sclerostin', 'Serum sclerostin (bone regulation)', 'pmol/L', 32.6, 2.5, 22.7, 2.0,
     'Regulatory protein involved in bone remodeling; a higher value is not inherently better.'),
]

# Qualitative temporal patterns: direct prose findings; no fabricated measurements.
_TIME_FINDINGS = [
    {'id': 'ctx', 'label': 'Urinary CTx / NTx', 'finding': 'Elevated during flight; returned to preflight values by R+1 month.',
     'source_location': 'Results → Biomarkers of bone turnover; Fig. 4, Supplementary Table S1'},
    {'id': 'p1np', 'label': 'Serum P1NP', 'finding': 'Bone-formation marker returned to preflight values by R+6 months.',
     'source_location': 'Results → Biomarkers of bone turnover'},
    {'id': 'bsap', 'label': 'Serum bone-specific ALP (BSAP)', 'finding': 'Returned to preflight values by R+6 months; significantly lower at R+12 months.',
     'source_location': 'Results → Biomarkers of bone turnover'},
    {'id': 'pth', 'label': 'Serum PTH', 'finding': 'Elevated at R+1 and R+6 months compared with preflight.',
     'source_location': 'Results → Biomarkers of bone turnover'},
    {'id': 'calcium', 'label': 'Serum calcium', 'finding': 'Lower at R+1 month compared with preflight.',
     'source_location': 'Results → Biomarkers of bone turnover'},
]


def published_tbone_metabolism() -> dict:
    return {
        'source': deepcopy(SOURCE),
        'groups': [
            {'id': 'recovered', 'label': 'Recovered tibia BMD', 'n': 8},
            {'id': 'incomplete', 'label': 'Incomplete tibia recovery', 'n': 9},
        ],
        'metrics': [
            {'id': key, 'label': label, 'unit': unit,
             'recovered': {'mean': rec, 'reported_plus_minus': rec_pm},
             'incomplete': {'mean': inc, 'reported_plus_minus': inc_pm},
             'description': description, 'timepoint': 'Preflight'}
            for key, label, unit, rec, rec_pm, inc, inc_pm, description in _METRICS
        ],
        'qualitative_time_findings': deepcopy(_TIME_FINDINGS),
        'warning': 'Groups are defined by later recovery, so these preflight group differences are retrospective associations, NOT a diagnostic threshold or risk prediction. Do not combine distinct biomarker units on one numerical axis.',
    }
