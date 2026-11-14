"""Exploratory postflight interpolation of published TBone distal-tibia group medians.

NO individual NASA records, spaceflight forecasts, clinical inference, confidence
intervals or exercise effects. Supported interval: landing through R+12 months.
The medians are separate paired percentage changes; the interpolation describes
published group-level summaries, not an identified person's trajectory.
"""
from __future__ import annotations

from math import isfinite

import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.optimize import least_squares

from .tbone_quality import published_tbone_quality

# Approximate calendar conversions. Reported measurements were at month-scale,
# not on the exact dates defined here.
MONTH_DAYS = 365.25 / 12.0
KNOT_DAYS = np.array([0.0, 6 * MONTH_DAYS, 12 * MONTH_DAYS])


def _exponential_fit(y: np.ndarray):
    """Bounded 2-parameter descriptive recovery fit, ONLY for monotone recovery.

    Q(t) = a + (Q(0) - a) exp(-k*t), t measured in months.
    Not a causal or physiologically identified model.
    """
    # Require observations to move monotonically toward the preflight zero.
    if not (np.all(np.sign(y) == np.sign(y[0])) and
            np.all(np.diff(np.abs(y)) <= 0) and np.any(np.diff(np.abs(y)) < 0)):
        return None
    t = np.array([0.0, 6.0, 12.0])
    first = float(y[0])
    # Allow a plateau between the first observation and preflight baseline.
    a_lo, a_hi = (first, 0.0) if first < 0 else (0.0, first)
    def prediction(z):
        a, k = z
        return a + (first - a) * np.exp(-k * t)
    result = least_squares(lambda z: prediction(z) - y,
                           x0=[float(y[-1]), 0.18],
                           bounds=([a_lo, 0.0], [a_hi, 3.0]),
                           max_nfev=1000)
    a, k = map(float, result.x)
    return {'asymptote_pct': a, 'rate_per_month': k,
            'residual_rmse_pp': float(np.sqrt(np.mean((prediction(result.x)-y)**2)))}


def quality_recovery_curve(metric_id: str = 'failure_load', step_days: int = 7,
                           method: str = 'pchip',
                           personal_return_change_pct: float | None = None) -> dict:
    """Postflight reference curve and optional *illustrative* baseline shift.

    For the personal scenario, a same-metric, same-anatomical-site paired
    preflight->return percent change is required. The constant shift only
    anchors a displayed scenario; it is NOT an individualized forecast.
    """
    if not 1 <= step_days <= 90:
        raise ValueError('step_days must be 1..90')
    if method not in ('pchip', 'exponential'):
        raise ValueError('method must be pchip or exponential')
    data = published_tbone_quality()
    metrics = {m['id']: m for m in data['metrics']}
    if metric_id not in metrics:
        raise ValueError('unknown TBone indicator')
    metric = metrics[metric_id]
    y = np.asarray(metric['percent_change'][1:], dtype=float)
    exp_fit = _exponential_fit(y)
    if method == 'exponential' and exp_fit is None:
        raise ValueError('exponential recovery model not appropriate: published points are non-monotonic')
    if personal_return_change_pct is not None:
        if not isfinite(personal_return_change_pct) or not -100 <= personal_return_change_pct <= 100:
            raise ValueError('personal_return_change_pct must be a finite % in [-100,100]')
    days = np.append(np.arange(0, KNOT_DAYS[-1], step_days, dtype=float), KNOT_DAYS[-1])
    if method == 'pchip':
        interpolator = PchipInterpolator(KNOT_DAYS, y, extrapolate=False)
        estimates = interpolator(days)
        params = {'knots_days': KNOT_DAYS.tolist(), 'knots_percent': y.tolist()}
        equation = 'Piecewise cubic Hermite interpolation (PCHIP) through R+0, R+6m and R+12m group medians.'
    else:
        a, k = exp_fit['asymptote_pct'], exp_fit['rate_per_month']
        estimates = a + (float(y[0])-a) * np.exp(-k * days / MONTH_DAYS)
        params = exp_fit
        equation = 'Q(t) = a + (Q(0)-a)*exp(-k*t), t in months after return; fitted to three group medians.'
    points = [{'days_after_return': round(float(d), 3),
               'estimated_group_change_pct': round(float(v), 5)}
              for d, v in zip(days, estimates)]
    observations = [{'label': label, 'days_after_return': round(float(t), 3),
                     'observed_group_median_change_pct': float(value)}
                    for label, t, value in zip(['Return','R+6 months','R+12 months'], KNOT_DAYS, y)]
    result = {
        'metric': {'id': metric['id'], 'label': metric['label'],
                   'anatomical_site': 'distal tibia', 'original_unit': metric['original_unit'],
                   'unit': '% change from preflight'},
        'method': method,
        'equation': equation,
        'parameters': params,
        'observations': observations,
        'curve': points,
        'supported_period': '0–12 months after return, not inflight',
        'source': data['source'],
        'provenance': 'descriptive_fit_to_published_group_medians',
        'uncertainty': 'Individual variability and model confidence intervals are NOT identifiable from three group medians.',
        'limitations': ['Not an individual astronaut forecast or measured time series.',
                        'Model is descriptive; no extrapolation beyond R+12 months.',
                        'Does not model exercise, gravity, mission duration, or preflight-to-return loss.',
                        '12-month group median values are not necessarily the same individuals as all earlier paired observations.'],
        'exponential_eligible': exp_fit is not None,
    }
    if personal_return_change_pct is not None:
        offset = float(personal_return_change_pct)-float(y[0])
        result['illustrative_personal_anchor'] = {
            'personal_return_change_pct': personal_return_change_pct,
            'same_metric_and_distal_tibia_required': True,
            'method': 'constant additive offset to group-level percentage-change curve',
            'curve': [{'days_after_return': p['days_after_return'],
                       'illustrative_change_pct': round(p['estimated_group_change_pct'] + offset, 5)}
                      for p in points],
            'warning': 'Illustrative aligned scenario only; NOT validated individual recovery prediction.'
        }
    return result
