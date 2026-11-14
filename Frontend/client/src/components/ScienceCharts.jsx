import React from 'react';
const format = (n, digits=1) => typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : '—';
export function QualityChart({labels=[], values=[]}) {
  const width=650, height=230, left=55, top=18, bottom=44;
  const nums=values.filter(Number.isFinite);
  if (!nums.length) return <p>No quality observations available.</p>;
  const lo=Math.min(-1, ...nums)*1.2, hi=Math.max(1, ...nums)*1.2;
  const y=v=> top+(hi-v)/(hi-lo)*(height-top-bottom);
  const barWidth=72, step=(width-left-16)/Math.max(values.length,1);
  return <svg className="science-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.map((l,i)=>`${l}: ${values[i]} percent change`).join('; ')}>
    <line x1={left} x2={width-8} y1={y(0)} y2={y(0)} stroke="#afbac888" strokeDasharray="5 4" />
    <text x={7} y={y(0)-6} fill="#bbced8" fontSize="12">0%</text>
    {values.map((v,i)=> {if (!Number.isFinite(v)) return null; const cx=left+step*(i+.5), bY=Math.min(y(v),y(0)), h=Math.max(2,Math.abs(y(v)-y(0))); return <g key={i}><rect x={cx-barWidth/2} y={bY} width={barWidth} height={h} rx="4" fill={i===0?'#889aa5':'#78d9c3'} opacity=".9"/><text x={cx} y={v>=0?bY-7:bY+h+15} fontSize="12" textAnchor="middle" fill="#e8f4f4">{format(v)}%</text><text x={cx} y={height-18} fontSize="12" textAnchor="middle" fill="#c1d1dd">{labels[i]||`T${i}`}</text></g>})}
  </svg>;
}
export function MetabolismChart({ groups=[], values={}, unit='' }) {
 const items=groups.map(g=>({ ...g, data:values[g.id]})).filter(g=>Number.isFinite(g.data?.mean));
 if (!items.length) return <p>No metabolism measurements available.</p>;
 const max=Math.max(...items.map(g=>g.data.mean+Math.abs(g.data.reported_plus_minus||0)),1)*1.15;
 const W=650,H=205,x0=185,right=85,usable=W-x0-right;
 return <svg className="science-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={items.map(g=>`${g.label}: ${g.data.mean} plus or minus ${g.data.reported_plus_minus} ${unit}`).join('; ')}>
 {items.map((g,i)=>{const y=40+i*90,avg=x0+g.data.mean/max*usable,pm=(g.data.reported_plus_minus||0)/max*usable;return <g key={g.id}><text x="8" y={y-4} fontSize="12" fill="#e0edf2">{g.id==='recovered'?'Recovered':'Incomplete recovery'} (n={g.n})</text><rect x={x0} y={y-24} width={Math.max(1,avg-x0)} height="28" rx="4" fill={i===0?'#78d9c3':'#8dace9'}/><line x1={avg-pm} x2={avg+pm} y1={y-10} y2={y-10} stroke="#fff" strokeWidth="2"/><line x1={avg-pm} x2={avg-pm} y1={y-17} y2={y-3} stroke="#fff"/><line x1={avg+pm} x2={avg+pm} y1={y-17} y2={y-3} stroke="#fff"/><text x={x0} y={y+22} fontSize="12" fill="#e0edf2">{format(g.data.mean)} ± {format(g.data.reported_plus_minus)} {unit}</text></g>})}
 </svg>;
}
export function ExerciseChart({days=[]}) {
 const maximum=Math.max(1,...days.map(d=>Number(d.total_minutes)||0));
 return <div className="science-plan" role="list" aria-label="Seven-day exercise plan">{days.map((d,i)=>{
 const res=Number(d.resistance?.minutes)||0, aer=Number(d.aerobic?.minutes)||0;
 return <div className="science-plan-row" role="listitem" key={d.day??i}><span>Day {d.day??i+1}</span><div className="science-plan-track" aria-label={`${res.toFixed(1)} minutes resistance, ${aer.toFixed(1)} minutes aerobic`}><span style={{width:`${res/maximum*100}%`}} className="science-plan-res"/><span style={{width:`${aer/maximum*100}%`}} className="science-plan-aer"/></div><b>{(Number(d.total_minutes)||0).toFixed(1)} min</b></div>})}<div className="science-legend"><span>■ Resistance</span><span>■ Aerobic</span></div></div>;
}
export function ScoreChart({scores=[]}) {
 const max=Math.max(0.001,...scores.map(s=>Math.abs(s.ucbScore||0)));
 return <div className="science-scores">{scores.map(s=><div className="science-score-row" key={s.armId}><span>{s.label}</span><div className="science-score-track"><span style={{width:`${Math.max(0, (s.ucbScore||0)/max)*100}%`}}/></div><b>{format(s.ucbScore,3)}</b><small>{s.observations} feedback</small></div>)}</div>;
}
