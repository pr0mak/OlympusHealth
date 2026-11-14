/* ASTRA 0.9 — evidence-labelled, browser-only monitoring presentation.
   No clinical classification, fabricated observations, or LLM inference. */
(() => {
  'use strict';
  const OBS_METRICS = DATA.metrics;
  const brief = DATA.briefing;
  let observations = [];
  let activeQuestion = null;
  const $ = (id) => document.getElementById(id);
  const txt = (id, value) => { const el = $(id); if (el) el.textContent = String(value); };
  const sections = Object.fromEntries(brief.sections.map((s) => [s.key, s]));

  function observedSection(group) {
    const metricKeys = group === 'bone_quality'
      ? ['trabecular_vbmd_mg_cm3', 'cortical_thickness_mm', 'estimated_strength_n']
      : ['ctx_ng_l', 'p1np_ug_l', 'bone_alp_ug_l', 'calcium_mg_dl', 'pth_pg_ml'];
    const records = [];
    for (const obs of observations) {
      for (const metric of metricKeys) {
        if (Number.isFinite(obs[metric])) records.push({day: obs.day, metric, value: obs[metric]});
      }
    }
    records.sort((a, b) => a.day - b.day || a.metric.localeCompare(b.metric));
    if (!records.length) return sections[group];
    const latest = records[records.length - 1];
    const info = OBS_METRICS[latest.metric];
    return {
      status: 'user_supplied_unverified', badge: 'USER-SUPPLIED · UNVERIFIED',
      headline: `${records.length} source-labelled value(s) provided`,
      summary: `Latest supplied result: ${info.label} = ${latest.value} ${info.unit} on mission day ${latest.day}.`,
      details: 'Values are not independently verified for source, test method or comparability. No diagnosis or fracture-risk classification is calculated.',
      evidence: 'User-supplied, not NASA-verified'
    };
  }

  function renderBriefing() {
    txt('brief-headline', brief.headline);
    txt('brief-intro', brief.intro);
    txt('brief-evidence', sections.bone_density.evidence + ' · Not an individual measurement');
    txt('headline-loss', `−${sections.bone_density.loss_pct.toFixed(2)}%`);
    txt('headline-days', DATA.reference.at(-1).day);
    txt('headline-scans', '0');
    // CSV input cannot verify a DXA patient, source, or individual identity.
    for (const [group, prefix] of [['bone_density', 'density'], ['bone_quality', 'quality'], ['bone_metabolism', 'metabolism']]) {
      const s = group === 'bone_density' ? sections.bone_density : observedSection(group);
      txt(`${prefix}-headline`, s.headline);
      txt(`${prefix}-summary`, s.summary);
      txt(`${prefix}-detail`, s.details);
      if (group !== 'bone_density') {
        const badge = $(`${prefix}-badge`);
        if (badge) {
          badge.textContent = s.badge;
          badge.className = 'status-pill ' + (s.status === 'no_data' ? 'missing' : 'uploaded');
        }
      }
    }
    txt('what-know', brief.what_we_know);
    let unknown = brief.what_we_do_not_know;
    if (observations.length) {
      unknown = unknown.replace('Missing measurements: Bone Quality, Bone Metabolism. ', '')
                       .replace('Missing measurements: Bone Quality. ', '')
                       .replace('Missing measurements: Bone Metabolism. ', '');
      const missing = ['bone_quality', 'bone_metabolism'].filter((g) => observedSection(g).status === 'no_data');
      if (missing.length) unknown += ' Still missing: ' + missing.map(g => sections[g].label).join(', ') + '.';
      unknown += ' Uploaded observations have not been independently verified.';
    }
    txt('what-unknown', unknown);
    txt('what-next', brief.next_step);
    if (activeQuestion) explain(activeQuestion);
  }

  function explain(topic) {
    activeQuestion = topic;
    const density = sections.bone_density;
    const quality = observedSection('bone_quality');
    const metabolism = observedSection('bone_metabolism');
    const explanations = {
      density: density.summary + ' ' + density.details,
      quality: quality.summary + ' ' + quality.details,
      metabolism: metabolism.summary + ' ' + metabolism.details,
      exercise: brief.exercise_note,
      limitations: brief.what_we_do_not_know + ' ' + brief.disclaimer + (observations.length ? ' Any CSV values displayed here are user-supplied and unverified.' : '')
    };
    txt('answer-text', explanations[topic] || brief.disclaimer);
    document.querySelectorAll('[data-topic]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.topic === topic)));
  }

  function plot(id, values, labels, isBar = false, second = null) {
    const canvas = $(id);
    if (!canvas) return;
    const w = canvas.clientWidth || 350;
    const h = canvas.clientHeight || 210;
    if (w < 30 || h < 30) return; // details panel may be collapsed
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const series = [values, ...(second ? [second] : [])];
    const valid = series.flat().filter((v) => Number.isFinite(v));
    if (!valid.length) {
      ctx.fillStyle = '#aac0d0'; ctx.font = '13px Segoe UI';
      ctx.fillText('No observations / input', 15, h / 2);
      return;
    }
    const L = 48, R = 14, T = 16, B = 30, W = w - L - R, H = h - T - B;
    let lo = isBar ? 0 : Math.min(...valid), hi = Math.max(...valid);
    if (hi === lo) hi += 1;
    const padding = (hi - lo) * 0.13;
    hi += padding;
    if (!isBar) lo -= padding;
    const x = (i) => L + ((i + .5) / Math.max(1, labels.length)) * W;
    const y = (v) => T + (hi - v) / (hi - lo) * H;
    ctx.font = '10px Segoe UI'; ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      const tick = lo + (hi - lo) * k / 4;
      const Y = y(tick);
      ctx.strokeStyle = '#294458'; ctx.beginPath(); ctx.moveTo(L, Y); ctx.lineTo(w-R, Y); ctx.stroke();
      ctx.fillStyle = '#9db3c5'; ctx.textAlign = 'right';
      ctx.fillText(tick.toFixed(hi-lo < 2 ? 2 : 0), L-6, Y+4);
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#a2b8c7';
    const every = Math.max(1, Math.ceil(labels.length / 5));
    labels.forEach((label,i) => { if (i % every === 0 || i === labels.length-1) ctx.fillText(String(label), x(i), h-8); });
    series.forEach((arr,j) => {
      ctx.strokeStyle = j ? '#85aefa' : '#64decd'; ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2.2;
      if (isBar) {
        arr.forEach((v,i) => {
          if (!Number.isFinite(v)) return;
          const bw = Math.max(2, W / Math.max(1, labels.length) / (second ? 2.6 : 1.4));
          const X = x(i) + (j ? .2 : -1.2) * bw;
          ctx.fillRect(X,y(v),bw,Math.max(0,y(0)-y(v)));
        });
      } else {
        ctx.beginPath(); let hasStarted = false;
        arr.forEach((v,i) => {
          if (!Number.isFinite(v)) { hasStarted = false; return; }
          if (!hasStarted) ctx.moveTo(x(i), y(v)); else ctx.lineTo(x(i), y(v));
          hasStarted = true;
        });
        ctx.stroke();
      }
    });
  }

  function renderPublishedQuality() {
    const study = DATA.published_quality;
    const select = $('quality-study');
    if (!study || !select) return;
    if (!select.options.length) {
      study.metrics.forEach((m) => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.label;
        select.append(option);
      });
    }
    const metric = study.metrics.find(m => m.id === select.value) || study.metrics[0];
    const values = metric.percent_change;
    plot('quality-study-chart', values, study.source.timepoints);
    const last = values.at(-1);
    const signed = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
    txt('quality-study-meaning',
      `${metric.description} In the published TBone study of 17 ISS astronauts, the group median change was ${signed(values[1])} at landing, ${signed(values[2])} at 6 months, and ${signed(last)} at 12 months after landing. These are changes in the distal tibia relative to preflight; they are NOT the measurements or predicted future outcomes of an individual astronaut. The points are separate follow-up assessments, not a daily timeline.`);
  }

  // Interpolated TBone population medians, never personal daily observations.
  function renderQualityDynamics() {
    const select = $('quality-study');
    const available = DATA.quality_dynamics?.[select?.value];
    if (!available) return;
    const methodControl = $('quality-dynamics-method');
    const expOption = methodControl.querySelector('option[value="exponential"]');
    expOption.disabled = !available.exponential;
    if (methodControl.value === 'exponential' && !available.exponential) methodControl.value = 'pchip';
    const model = available[methodControl.value];
    const canvas = $('quality-dynamics-chart');
    const w = canvas.clientWidth || 350, h = canvas.clientHeight || 210;
    if (w < 30 || h < 30) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const curve = model.curve, obs = model.observations;
    const ys = [...curve.map(p=>p.estimated_group_change_pct), ...obs.map(p=>p.observed_group_median_change_pct)];
    const left = 54, top = 15, right = 13, bottom = 31;
    const W = w-left-right, H = h-top-bottom;
    let lo = Math.min(...ys), hi = Math.max(...ys);
    const pad = Math.max((hi-lo)*0.15, 0.2); lo -= pad; hi += pad;
    const x = d=>left+Math.min(1,Math.max(0,d/365.25))*W;
    const y = v=>top+(hi-v)/(hi-lo)*H;
    ctx.font='10px Segoe UI';ctx.textAlign='right';
    for (let k=0;k<=4;k++) {
      const v=lo+(hi-lo)*k/4, Y=y(v);
      ctx.strokeStyle='#294458'; ctx.beginPath();ctx.moveTo(left,Y);ctx.lineTo(w-right,Y);ctx.stroke();
      ctx.fillStyle='#9db3c5';ctx.fillText(v.toFixed(1)+'%',left-6,Y+3);
    }
    ctx.textAlign='center';ctx.fillStyle='#9db3c5';
    [[0,'Return'],[182.625,'6 mo'],[365.25,'12 mo']].forEach(([d,label])=>ctx.fillText(label,x(d),h-8));
    ctx.strokeStyle='#64decd';ctx.lineWidth=2.5;ctx.beginPath();
    curve.forEach((p,i)=>{const X=x(p.days_after_return),Y=y(p.estimated_group_change_pct);if(!i)ctx.moveTo(X,Y);else ctx.lineTo(X,Y)});
    ctx.stroke();
    for(const p of obs){const X=x(p.days_after_return),Y=y(p.observed_group_median_change_pct);
      ctx.fillStyle='#85aefa';ctx.beginPath();ctx.arc(X,Y,4,0,Math.PI*2);ctx.fill();}
    const day = Number($('quality-dynamics-day')?.value || 90);
    const index = Math.min(curve.length-1,Math.max(0,curve.findIndex(p=>p.days_after_return>=day)));
    const point = curve[index < 0 ? curve.length-1 : index];
    txt('quality-dynamics-value', `Day ${day} after landing: approximately ${point.estimated_group_change_pct.toFixed(2)}% from preflight (INTERPOLATED group median).`);
    txt('quality-dynamics-meaning', `${model.metric.label}: this smooth line is a ${model.method.toUpperCase()} mathematical interpolation through three published distal-tibia group medians. Blue dots are study observations; the line between dots is NOT measured, does not predict the individual astronaut, and should not be used for diagnosis or exercise planning. No data support extrapolation beyond 12 months.`);
  }

  function renderPublishedMetabolism() {
    const study = DATA.published_metabolism;
    const select = $('metabolism-study');
    if (!study || !select) return;
    if (!select.options.length) {
      study.metrics.forEach((m) => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.label;
        select.append(option);
      });
      const findings = $('metabolism-time-findings');
      for (const result of study.qualitative_time_findings) {
        const p = document.createElement('p');
        p.className = 'status';
        p.textContent = `${result.label}: ${result.finding}`;
        findings.append(p);
      }
    }
    const metric = study.metrics.find(m => m.id === select.value) || study.metrics[0];
    // These are independent preflight cohort group means, NOT a time-series.
    plot('metabolism-study-chart', [metric.recovered.mean], ['Preflight'], true, [metric.incomplete.mean]);
    txt('metabolism-study-meaning',
      `${metric.description} Before flight, the recovered group (n=8) had a reported mean of ${metric.recovered.mean} ± ${metric.recovered.reported_plus_minus} ${metric.unit}, compared with ${metric.incomplete.mean} ± ${metric.incomplete.reported_plus_minus} ${metric.unit} in the incomplete-recovery group (n=9). This is a retrospective group comparison, not your test result or a predictor of individual recovery. The chart shows means; ± values are reported here in the text, not as error bars.`);
  }

  function renderMonitoring() {
    for (const group of ['quality','metabolism']) {
      const metric = $(group).value;
      const points = observations.filter((ob) => Number.isFinite(ob[metric])).sort((a,b) => a.day-b.day);
      plot(group+'-chart', points.map(o=>o[metric]), points.map(o=>o.day));
      txt(group+'-empty', points.length ? `${points.length} user-supplied, NOT source-verified reading(s) · ${OBS_METRICS[metric].unit}` : 'No verified measurements loaded');
      const label = group === 'quality' ? 'Bone Quality' : 'Bone Metabolism';
      if (points.length === 0) {
        txt(group+'-meaning', `${label}: no measurements for the selected indicator. No health conclusion can be made. Load a source-labelled CSV to display observations.`);
      } else if (points.length === 1) {
        txt(group+'-meaning', `One user-supplied ${OBS_METRICS[metric].label} observation: ${points[0][metric]} ${OBS_METRICS[metric].unit} on day ${points[0].day}. A single value does not establish a trend; source and interpretation have not been independently verified.`);
      } else {
        const first = points[0], last = points[points.length-1];
        const direction = last[metric] > first[metric] ? 'increased' : (last[metric] < first[metric] ? 'decreased' : 'did not change');
        txt(group+'-meaning', `User-supplied ${OBS_METRICS[metric].label} ${direction} from ${first[metric]} to ${last[metric]} ${OBS_METRICS[metric].unit} (days ${first.day}–${last.day}). This describes the supplied values only; it does not establish health status or clinical significance.`);
      }
    }
    renderBriefing();
  }

  function renderPlots() {
    const points = DATA.reference;
    plot('bmd',points.map(p=>p.bmd_pct),points.map(p=>p.day));
    plot('tscore',points.map(p=>p.t_score ?? null),points.map(p=>p.day));
    const last = points.at(-1);
    txt('bmd-meaning', `The published population model estimates ${ (100-last.bmd_pct).toFixed(2) }% femoral-neck BMD loss after ${last.day} days. This is not a measured personal result and does not account for exercise.`);
    const initialScore = points[0].t_score;
    txt('tscore-meaning', Number.isFinite(initialScore)
      ? `Using the user-supplied preflight DXA BMD, the calculated T-score changes from ${initialScore.toFixed(2)} to ${last.t_score.toFixed(2)}. It is model-derived, not a new measurement or diagnosis.`
      : 'No preflight DXA BMD was provided, so a T-score cannot be calculated. We do not fill in a guessed value.');
    const sessions = DATA.exercise_sessions;
    plot('exercise',sessions.map(s=>s.resistance.minutes),sessions.map(s=>s.day),true,sessions.map(s=>s.aerobic.minutes));
    const totalMinutes = sessions.reduce((acc, s) => acc + s.total_minutes, 0);
    const resistanceMinutes = sessions.reduce((acc, s) => acc + s.resistance.minutes, 0);
    const aerobicMinutes = sessions.reduce((acc, s) => acc + s.aerobic.minutes, 0);
    txt('exercise-meaning', `The MPC plans ${totalMinutes.toFixed(1)} minutes across 7 days: ${resistanceMinutes.toFixed(1)} resistance and ${aerobicMinutes.toFixed(1)} aerobic. This is a mathematical exercise schedule, not a clinically validated bone-health recommendation.`);
    const sessionPanel = $('sessions');
    sessionPanel.replaceChildren();
    for (const s of sessions) {
      const p = document.createElement('div'); p.className='session-line';
      p.textContent = `Day ${s.day}: Resistance ${s.resistance.minutes.toFixed(1)} min (${s.resistance.intensity}) · Aerobic ${s.aerobic.minutes.toFixed(1)} min (${s.aerobic.intensity})`;
      sessionPanel.append(p);
    }
    renderPublishedQuality();
    renderPublishedMetabolism();
    renderQualityDynamics();
    renderMonitoring();
  }

  // Basic RFC 4180-style comma parser; no third-party dependencies or uploads.
  function csvRows(text) {
    const rows = []; let row = [], field = '', quoted = false;
    for (let i=0; i<text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (quoted && text[i+1] === '"') { field += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === ',' && !quoted) { row.push(field); field = ''; }
      else if ((ch === '\r' || ch === '\n') && !quoted) {
        if (ch === '\r' && text[i+1] === '\n') i++;
        row.push(field); field = '';
        if (row.some(v=>v.trim() !== '')) rows.push(row);
        row=[];
      } else { field += ch; }
    }
    if (quoted) throw Error('Unterminated CSV quoted field');
    row.push(field); if (row.some(v => v.trim() !== '')) rows.push(row);
    return rows;
  }
  function parseCSV(text) {
    const rows = csvRows(text);
    if (rows.length < 2) throw Error('CSV needs a header and at least one data row');
    const header = rows.shift().map(x=>x.trim());
    for (const key of ['day','source_type','source_note']) if (!header.includes(key)) throw Error(`Missing required column: ${key}`);
    if (new Set(header).size !== header.length) throw Error('Duplicate CSV column names');
    if (rows.length > 2000) throw Error('Maximum 2000 observations');
    const metricKeys = Object.keys(OBS_METRICS);
    const parsed = [];
    for (const [index, cells] of rows.entries()) {
      if (cells.length !== header.length) throw Error(`Row ${index+2}: wrong column count`);
      const entry = Object.fromEntries(header.map((key,i) => [key,cells[i].trim()]));
      const day = Number(entry.day);
      if (!Number.isInteger(day) || day < 0 || day > 1500) throw Error(`Row ${index+2}: day must be an integer from 0 to 1500`);
      if (entry.source_type !== 'measured' || !entry.source_note || entry.source_note.length < 3 || entry.source_note.length > 200) throw Error(`Row ${index+2}: source_type=measured and source_note required`);
      const record = {day,source_type: 'measured',source_note:entry.source_note};
      let metricCount = 0;
      for (const key of metricKeys) {
        if (entry[key] !== undefined && entry[key] !== '') {
          const n = Number(entry[key]);
          if (!Number.isFinite(n) || n < 0) throw Error(`Row ${index+2}: invalid ${key}`);
          record[key] = n; metricCount++;
        }
      }
      if (!metricCount) throw Error(`Row ${index+2}: no bone quality/metabolism metric`);
      parsed.push(record);
    }
    return parsed;
  }

  document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>explain(b.dataset.topic)));
  $('file').addEventListener('change', async (event) => {
    const f = event.target.files[0]; if (!f) return;
    try {
      const loaded = parseCSV(await f.text());
      observations = loaded;
      txt('uploadstatus', `${loaded.length} user-supplied observations · NOT independently verified · ${f.name} · retained only in this browser tab`);
      renderPlots();
    } catch (error) {
      observations = [];
      txt('uploadstatus', `CSV rejected: ${error.message}`);
      renderPlots();
    }
  });
  $('clear').addEventListener('click', () => { observations=[]; $('file').value=''; txt('uploadstatus','No observations loaded · no placeholder values'); renderPlots(); });
  for (const id of ['quality','metabolism']) $(id).addEventListener('change',renderMonitoring);
  $('quality-study').addEventListener('change', () => { renderPublishedQuality(); renderQualityDynamics(); });
  $('quality-dynamics-day').addEventListener('input', renderQualityDynamics);
  $('quality-dynamics-method').addEventListener('change', renderQualityDynamics);
  $('metabolism-study').addEventListener('change', renderPublishedMetabolism);
  window.addEventListener('resize', renderPlots);
  renderPlots();
  // All charts are always visible; absent observations remain explicitly blank.
})();
