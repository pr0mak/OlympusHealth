import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import PageHeading from '../components/PageHeading.jsx';
import TrendChart from '../components/TrendChart.jsx';
import {QualityChart,MetabolismChart} from '../components/ScienceCharts.jsx';
import {projectionApi} from '../api/client.js';
import {useAuth} from '../context/AuthContext.jsx';
const defaults={durationDays:30,currentDay:0,environment:'LEO',baseline:'',qualityMetricId:'failure_load',metabolismMetricId:'ctx_urinary'};
const qualityFallback=[{id:'failure_load',label:'Estimated failure load'},{id:'total_vbmd',label:'Total volumetric BMD'},{id:'trabecular_vbmd',label:'Trabecular volumetric BMD'},{id:'trabecular_thickness',label:'Trabecular thickness'},{id:'cortical_thickness',label:'Cortical thickness'},{id:'cortical_porosity',label:'Cortical porosity'}];
const metabFallback=[{id:'ctx_urinary',label:'Urinary CTx'},{id:'ntx_urinary',label:'Urinary NTx'},{id:'osteocalcin',label:'Osteocalcin'},{id:'sclerostin',label:'Sclerostin'}];
export default function FutureProjection(){
 const {token,loading:authLoading}=useAuth();
 const [form,setForm]=useState(defaults),[catalog,setCatalog]=useState(null),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const update=(key,value)=>setForm(p=>({...p,[key]:value}));
 const calculate=async(settings, alive=()=>true)=>{
  if(!token)return;
  setBusy(true);setError('');
  try{
   const r=await projectionApi.simulate(token,{
    mission:{environment:settings.environment,durationDays:Number(settings.durationDays),currentDay:Number(settings.currentDay)},
    health:{initialFemoralNeckBmdGcm2:settings.baseline===''?null:Number(settings.baseline)},
    exercise:{weeklyBudgetMinutes:210,targetMinutesPerDay:45,resistanceFraction:.5},
    qualityMetricId:settings.qualityMetricId, metabolismMetricId:settings.metabolismMetricId
   });
   if(alive())setResult(r.projection);
  }catch(e){if(alive()){setError(e.message);setResult(null);}}finally{if(alive())setBusy(false);}
 };
 useEffect(()=>{
  if(!token){setResult(null);return;}
  let active=true;
  projectionApi.catalog(token).then(d=>{if(active)setCatalog(d.catalog);}).catch(()=>{});
  calculate(defaults,()=>active);
  return ()=>{active=false;};
 },[token]);
 const trajectory=result?.boneDensity?.trajectory||[];
 const values=useMemo(()=>trajectory.map(p=>p.bmd_pct),[trajectory]);
 const last=trajectory.at(-1), density=result?.boneDensity,quality=result?.boneQuality,metabolism=result?.boneMetabolism;
 const sourceLink=(source,label)=>source?.url?<a href={source.url} target="_blank" rel="noreferrer">{label} ↗</a>:null;
 return <main className="dashboard detail-page" id="main-content" tabIndex={-1}>
  <PageHeading title="Future Projection & Bone Health" description="Three scientific perspectives on bone changes during and after spaceflight."/>
  <p className="demo-note">Evidence guide: <strong>Bone Density = modeled population trajectory</strong>; <strong>Bone Quality = published group observations</strong>; <strong>Bone Metabolism = published preflight group comparison</strong>. None is a clinical prediction for your account.</p>
  {!token?<section className="content-card"><h2>Sign in to explore</h2><p><Link to="/sign-in">Sign in</Link> to load the Python engine.</p></section>:<>
   <section className="content-card science-config scenario-inputs">
    <h2>Mission & scientific indicators</h2>
    <div className="science-control-grid">
     <label>Environment<select value={form.environment} onChange={e=>update('environment',e.target.value)}><option value="LEO">Low Earth Orbit (model reference)</option><option value="LUNAR_ORBIT">Lunar orbit (context only)</option><option value="LUNAR_SURFACE">Lunar surface (context only)</option><option value="MARS_TRANSIT">Mars transit (context only)</option><option value="MARS_SURFACE">Mars surface (context only)</option></select></label>
     <label>Duration (days)<input type="number" min="1" max="1200" value={form.durationDays} onChange={e=>setForm(p=>({...p,durationDays:e.target.value,currentDay:Math.min(Number(p.currentDay),Number(e.target.value))}))}/></label>
     <label>Current mission day<input type="number" min="0" max={Number(form.durationDays)||1200} value={form.currentDay} onChange={e=>update('currentDay',e.target.value)}/></label>
     <label>Real preflight DXA BMD (g/cm², optional)<input type="number" min="0.001" max="2.5" step="0.001" placeholder="Not available" value={form.baseline} onChange={e=>update('baseline',e.target.value)}/></label>
     <label>Bone Quality indicator<select value={form.qualityMetricId} onChange={e=>update('qualityMetricId',e.target.value)}>{(catalog?.qualityMetrics||qualityFallback).map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
     <label>Bone Metabolism marker<select value={form.metabolismMetricId} onChange={e=>update('metabolismMetricId',e.target.value)}>{(catalog?.metabolismMetrics||metabFallback).map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
    </div>
    <div className="science-actions"><button className="secondary-button" disabled={busy||authLoading} onClick={()=>calculate(form)}>{busy?'Calculating…':'Generate projection'}</button><button className="secondary-button" disabled={busy} onClick={()=>{setForm(defaults);calculate(defaults);}}>Reset</button></div>
    <p className="projection-subnote">The current BMD model is supported for LEO-like conditions only. Selecting Moon/Mars does not change that underlying model.</p>
   </section>
   {error&&<p className="projection-error" role="alert">{error}</p>}
   {busy&&<p role="status" className="demo-note">Calculating with the Python AI Engine…</p>}
   {result&&<div className="science-stack">
    <section className="content-card"><div className="science-heading"><h2>01 · Bone Density</h2><span className="science-chip">MODELED · FEMORAL NECK</span></div>
     <p className="muted-copy">Estimated percentage of preflight BMD across {result.mission?.durationDays} days. This is a population-based mathematical reference.</p>
     {values.length>0&&<TrendChart values={values} label="Femoral-neck BMD percent of preflight" startLabel="Launch · Day 0" endLabel={`Day ${result.mission?.durationDays}`}/>}
     <div className="projection-stats"><div><span>Estimated BMD at mission end</span><strong>{last?.bmd_pct?.toFixed(2)??'—'}%</strong></div><div><span>Relative loss</span><strong>{last?.bmd_loss_pct?.toFixed(2)??'—'}%</strong></div><div><span>Absolute BMD</span><strong>{last?.bmd_g_cm2==null?'No DXA supplied':`${last.bmd_g_cm2.toFixed(4)} g/cm²`}</strong></div></div>
     <div className="science-explain"><strong>Why does this happen?</strong><p>In microgravity, bones that normally carry body weight experience less mechanical loading. Bone resorption can exceed bone formation, leading to mineral loss, especially at weight-bearing sites. The speed and recovery vary between individuals.</p></div>
     <p className="projection-subnote">{density?.limitation} {sourceLink(density?.source,'Axpe et al. (2020)')}</p>
    </section>
    <section className="content-card"><div className="science-heading"><h2>02 · Bone Quality</h2><span className="science-chip">OBSERVED GROUP DATA · DISTAL TIBIA</span></div>
     <p className="muted-copy">{quality?.label} · {quality?.unit}. Published median paired percent change vs preflight (17 astronauts).</p>
     <QualityChart labels={quality?.timepoints||[]} values={quality?.values||[]}/>
     <div className="science-explain"><strong>Why does this matter?</strong><p>Bone health is more than density. Its inner structure, cortical shell and estimated resistance to failure can also change. These points describe published measurements at return, six months and twelve months after landing—not daily predictions.</p></div>
     <p className="projection-subnote">{quality?.summary} {sourceLink(quality?.source,'Gabel et al. (2022), Table 1')}</p>
    </section>
    <section className="content-card"><div className="science-heading"><h2>03 · Bone Metabolism</h2><span className="science-chip">OBSERVED GROUP COMPARISON · PREFLIGHT</span></div>
     <p className="muted-copy">{metabolism?.label} · {metabolism?.unit}. Groups classified retrospectively by tibia BMD recovery after spaceflight.</p>
     <MetabolismChart groups={metabolism?.groups||[]} values={metabolism?.values||{}} unit={metabolism?.unit}/>
     <div className="science-explain"><strong>What do the markers tell us?</strong><p>Bone is continuously remodeled: specialized cells remove old tissue and build new tissue. Biomarkers such as CTx/NTx reflect resorption, while other indicators relate to formation or regulation. This chart compares published group measurements taken <strong>before</strong> flight; it cannot diagnose or predict anyone's recovery.</p></div>
     <p className="projection-subnote">The ± quantities are preserved exactly as reported; they are not relabeled as SD or SEM. {sourceLink(metabolism?.source,'Gabel et al. (2022)')}</p>
    </section>
    <section className="content-card"><h2>How to interpret these three charts</h2><p className="muted-copy">Density is a <strong>modeled population trend</strong>; Quality and Metabolism are <strong>real published group results</strong> with different anatomical sites and observation times. They are not interchangeable and are not the current user's personal measurements.</p><p className="projection-subnote">For LinUCB decisions and the seven-day MPC exercise schedule, visit the <Link to="/mission-assistant">AI Assistant →</Link>.</p></section>
   </div>}
  </>}
 </main>;
}
