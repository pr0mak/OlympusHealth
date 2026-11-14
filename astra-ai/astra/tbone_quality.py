"""Verified published *group medians*, not individual or synthetic astronaut readings.

Gabel et al. (2022), Scientific Reports 12:9446, Table 1, distal tibia.
Each row is a separately reported median pairwise % change from preflight.
Do NOT derive absolute follow-up values by adding group median changes to
preflight medians; medians do not generally add.
"""

from copy import deepcopy

SOURCE = {
    'title': 'Incomplete recovery of bone strength and trabecular microarchitecture at the distal tibia 1 year after return from long duration spaceflight',
    'authors': 'Gabel et al.',
    'year': 2022,
    'doi': '10.1038/s41598-022-13461-1',
    'url': 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9247070/',
    'table': 'Table 1',
    'population': '17 ISS astronauts, missions 4–7 months',
    'site': 'distal tibia',
    'method': 'HR-pQCT / finite element analysis',
    'data_level': 'published_group_median_percent_change',
    'comparison': 'Each postflight time point compared with preflight; not a continuous inflight series.',
    'timepoints': ['Preflight', 'Return', 'R+6 months', 'R+12 months'],
    'note': 'Group medians of *paired percent changes*, not individual trajectories. No patient-level data or clinical thresholds.',
}

# Published pairwise median percent change from preflight, Table 1 (n=17).
# Preflight 0 is a definition of percent change, not a measured data point.
_METRICS = [
    ('failure_load', 'Estimated failure load', 'N', [-4.5, -1.9, -1.3],
     'An HR-pQCT finite-element estimate of the force associated with bone failure; not an observed fracture.'),
    ('total_vbmd', 'Total volumetric BMD', 'mg/cm³', [-3.4, -2.1, -1.4],
     'Bone mineral density measured in three dimensions at the distal tibia.'),
    ('trabecular_vbmd', 'Trabecular volumetric BMD', 'mg/cm³', [-3.6, -0.9, -2.1],
     'Mineral density of the inner, spongy bone compartment.'),
    ('trabecular_volume_fraction', 'Trabecular bone volume fraction', '%', [-2.7, -0.6, -1.3],
     'Proportion of sampled volume occupied by trabecular bone.'),
    ('trabecular_thickness', 'Trabecular thickness', 'mm', [-1.4, -0.7, -0.9],
     'Thickness of internal trabeculae; distinct from cortical thickness.'),
    ('cortical_vbmd', 'Cortical volumetric BMD', 'mg/cm³', [-1.8, -0.8, -1.3],
     'Mineral density of the outer compact bone compartment.'),
    ('cortical_thickness', 'Cortical thickness', 'mm', [-0.8, -0.2, 0.5],
     'Thickness of the outer compact bone shell.'),
    ('cortical_porosity', 'Cortical porosity', '%', [7.5, 7.9, 9.2],
     'Fraction of pores in cortical bone; an increase does not mean improved bone quality.'),
]


def published_tbone_quality() -> dict:
    return {
        'source': deepcopy(SOURCE),
        'metrics': [
            {
                'id': key, 'label': label, 'original_unit': unit,
                'chart_unit': '% change from preflight',
                'percent_change': [0.0, *changes],
                'description': description,
            }
            for key, label, unit, changes, description in _METRICS
        ],
    }
