import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {AlertTriangle,Camera,ExternalLink} from 'lucide-react';
import WorkflowStage,{StageProgress} from '@/components/workflow/WorkflowStage';
import OtherCarrierDeliveries from '@/components/customer/OtherCarrierDeliveries';
import PoliceEvidenceReport from '@/components/guide/PoliceEvidenceReport';
import RoleWalkthrough from '@/components/guide/RoleWalkthrough';
import VoicePicker from '@/components/guide/VoicePicker';
import EvidencePlayer from '@/components/evidence/EvidencePlayer';
import DoorwayComparison from '@/components/evidence/DoorwayComparison';
import {getAppMode} from '@/lib/appMode';
import {loadBoard} from '@/lib/board';
import {packageProfilePath} from '@/lib/packageLinks';
import {ops} from '@/lib/demo';
import {recordGuideAction} from '@/lib/guideProgress';
import IntegrationPlaceholders from '@/components/common/IntegrationPlaceholders';
import {doorbellChoices,doorbellDefaultEvent,doorbellUnavailable,makeCustomerDoorbellClip,makeDeliveryComparisonClip,findDoorbellEvent,DEMO_CONSENT_NOTICE} from '../../base44/shared/customerDoorbellProfiles.js';

const TYPES=['Not received','Wrong address','Damaged delivery','Missing after delivery','Other delivery problem'];
const STAGE_TITLES=['Choose Delivery','Describe the Issue','Review Camera Evidence','Send the Report','Other Delivery Services'];
const SIMULATED_ACCOUNTS=['Amazon','Gmail','Ring Doorbell','UPS','FedEx','USPS','DHL','OnTrac'];
const formatStatus=s=>String(s||'').replaceAll('_',' ');
const dateTimeLocal=value=>{
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);
 return local.toISOString().slice(0,16);
};
function primaryDemoEvent(board,tracking){
 return (board?.events||[]).filter(e=>e.tracking_number===tracking).sort((a,b)=>
  Number(b.event_type==='delivery')-Number(a.event_type==='delivery')
 ).find(e=>e.event_type==='delivery')||null;
}
export default function CustomerWorkspace(){
 const [mode,setMode]=useState('loading'),[board,setBoard]=useState(null),[tracking,setTracking]=useState(''),[nickname,setNickname]=useState('');
 const [issue,setIssue]=useState(''),[detail,setDetail]=useState(''),[reportedStart,setReportedStart]=useState(''),[reportedEnd,setReportedEnd]=useState('');
 const [includeFootage,setIncludeFootage]=useState(true),[footageReviewed,setFootageReviewed]=useState(false),[doorbellEvent,setDoorbellEvent]=useState('');
 const [demoSharingConsent,setDemoSharingConsent]=useState(true); // Fictional demo customer pre-authorized at simulated enrollment; can revoke.
 const submissionKeyRef=useRef('');
 const [stage,setStage]=useState(1),[done,setDone]=useState([]),[otherRoute,setOtherRoute]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState('');
 const packages=board?.shipments||[],reports=board?.complaints||[];
 const selected=useMemo(()=>packages.find(p=>p.tracking_number===tracking),[packages,tracking]);
 const cameraChoices=useMemo(()=>doorbellChoices(selected),[selected]);
 const selectedDoorbellEvent=doorbellEvent||doorbellDefaultEvent(selected);
 const pairedClip=useMemo(()=>selected?makeCustomerDoorbellClip(selected,board?.events||[],selectedDoorbellEvent,{start:reportedStart?new Date(reportedStart).toISOString():'',end:reportedEnd?new Date(reportedEnd).toISOString():''}):null,[selected,board?.events,selectedDoorbellEvent,reportedStart,reportedEnd]);
 const comparisonClip=useMemo(()=>selected?makeDeliveryComparisonClip(selected,board?.events||[]):null,[selected,board?.events]);
 const event=useMemo(()=>selected&&pairedClip?findDoorbellEvent(board?.events||[],tracking,cameraChoices.find(c=>c.eventKey===selectedDoorbellEvent)):null,[selected,pairedClip,board?.events,tracking,cameraChoices,selectedDoorbellEvent]);
 const hasReport=reports.some(r=>r.tracking_number===tracking&&r.status==='submitted_to_management');
 const isDone=n=>done.includes(n);
 const available=n=>n===1||(n===5&&otherRoute)||done.includes(n-1);
 const stageLocked=n=>!available(n) && !(done.includes(n));
 const activate=n=>{if(available(n)||done.includes(n)){setStage(n);setError('');requestAnimationFrame(()=>document.getElementById('customer-stage-'+n)?.scrollIntoView({behavior:'smooth',block:'start'}));}};
 function completeStep(n){
  setDone(v=>v.includes(n)?v:[...v,n].sort((a,b)=>a-b));
  setStage(n===4?4:n+1);setError('');
  if(n<4)requestAnimationFrame(()=>document.getElementById('customer-stage-'+(n+1))?.scrollIntoView({behavior:'smooth',block:'start'}));
 }
 useEffect(()=>{
  try{sessionStorage.setItem('rgc.role','customer');}catch{}
  let active=true;
  getAppMode().then(async m=>{if(!active)return;setMode(m);if(m==='demo'){
   const data=await loadBoard();
   if(active){
     setBoard(data);
     // A selected package from the Ring integration demo remains selected
     // when the customer opens the investigation workflow.
     const requested = new URLSearchParams(window.location.search).get('tracking');
     const linked=(data?.shipments||[]).find(p=>p.tracking_number===requested);
     if(linked){
       setTracking(linked.tracking_number);
       setNickname(linked.package_nickname||'');
       const consent=linked.demo_camera_sharing_enabled!==false;
       setDemoSharingConsent(consent);
       setDoorbellEvent(doorbellDefaultEvent(linked));
       setIncludeFootage(consent&&doorbellChoices(linked).length>0);
       const ev=primaryDemoEvent(data,linked.tracking_number);
       if(ev?.occurred_at){
         setReportedStart(dateTimeLocal(new Date(new Date(ev.occurred_at).getTime()-60*60000)));
         setReportedEnd(dateTimeLocal(new Date(new Date(ev.occurred_at).getTime()+60*60000)));
       }
     }
   }
 }})
    .catch(()=>{if(active){setMode('unknown');setError('The customer demo could not be loaded.')}})
  return()=>{active=false};
 },[]);
 function selectTracking(value){
  setTracking(value);setNickname(packages.find(p=>p.tracking_number===value)?.package_nickname||'');
  const ev=primaryDemoEvent(board,value);
  const start=ev?.occurred_at?dateTimeLocal(new Date(new Date(ev.occurred_at).getTime()-60*60000)):'';
  const end=ev?.occurred_at?dateTimeLocal(new Date(new Date(ev.occurred_at).getTime()+60*60000)):'';
  setReportedStart(start);setReportedEnd(end);
  const linked=packages.find(p=>p.tracking_number===value);
  const consent=linked?.demo_camera_sharing_enabled!==false;setDemoSharingConsent(consent);
  setDoorbellEvent(doorbellDefaultEvent(linked));
  setIncludeFootage(consent&&doorbellChoices(linked).length>0);
  submissionKeyRef.current='';
  setFootageReviewed(false);setIssue('');setDetail('');setDone([]);setStage(1);
  setError('');setNotice('');
  if(value&&packages.some(p=>p.tracking_number===value))recordGuideAction('customer','packageSelected');
 }
 async function refresh(){const next=await loadBoard({fresh:true});setBoard(next);return next;}
 async function saveNickname(){
  if(!selected||mode!=='demo'){setError('Select a paired demo package first.');return}
  setBusy('nickname');setError('');setNotice('');
  try{const result=await ops({action:'nameCustomerPackage',tracking_number:selected.tracking_number,package_nickname:nickname.trim()});
   if(!result?.ok)throw Error(result?.error||'Could not save the optional name');
   await refresh();setNotice(nickname?'Package name saved in the shared simulated management record.':'Optional nickname cleared.');
  }catch(e){setError(e?.message||'Could not save name')}
  finally{setBusy('')}
 }
 async function changeDemoConsent(enabled){
  if(!selected||mode!=='demo')return;
  setBusy('consent');setError('');setNotice('');
  try{
   const res=await ops({action:'setCustomerDemoCameraConsent',tracking_number:selected.tracking_number,enabled});
   if(!res?.ok)throw Error(res?.error||'Could not update simulated sharing.');
   setDemoSharingConsent(enabled);
   setIncludeFootage(enabled&&Boolean(pairedClip));setFootageReviewed(false);
   await refresh();setNotice(enabled?'Fictional sample sharing is enabled for this package.':'Fictional sample sharing is disabled; no camera clip will be attached.');
  }catch(e){setError(e?.message||'Could not save simulated sharing preference.')}
  finally{setBusy('')}
 }
 async function submit(e){
  e.preventDefault();setError('');setNotice('');
  if(mode!=='demo'){setError('No live external submission is configured.');return}
  if(!selected||!isDone(3)){setError('Complete package selection, details, and evidence review first.');return}
  if(includeFootage&&!demoSharingConsent){setError('Turn on simulated footage sharing before sending demo camera scenes.');return}
  setBusy('submit');
  try{
   if(!submissionKeyRef.current)submissionKeyRef.current=crypto.randomUUID().replace(/-/g,'');
   const result=await ops({action:'submitCustomerComplaint',submission_key:submissionKeyRef.current,
    tracking_number:selected.tracking_number,issue,detail:detail.trim(),doorbell_event_key:selectedDoorbellEvent,include_simulated_doorbell:includeFootage,simulated_sharing_consent:demoSharingConsent,reported_window_start:reportedStart?new Date(reportedStart).toISOString():'',reported_window_end:reportedEnd?new Date(reportedEnd).toISOString():''});
   if(!result?.ok)throw Error(result?.error||'Internal investigation could not be submitted');
   await refresh();recordGuideAction('customer','reportSubmitted');completeStep(4);
   submissionKeyRef.current='';
   setNotice('Investigation '+result.report.report_number+' received by simulated Ring Guardian management.'+
     (includeFootage?' Selected fictional '+selectedDoorbellEvent+' camera scene received.':' No footage was attached.')+
     ' No carrier, retailer, police department, or insurer was contacted.');
  }catch(err){setError(err?.message||'Could not submit this investigation')}
  finally{setBusy('')}
 }
 function advancePackage(){
  if(!selected){setError('Select a sample package before continuing.');return}
  completeStep(1);recordGuideAction('customer','packageSelected');
 }
 function advanceDetails(){
  if(!issue){setError('Choose what happened to the package first.');return}
  if(reportedStart&&reportedEnd&&new Date(reportedStart)>new Date(reportedEnd)){setError('The reported delivery window ends before it begins.');return}
  if(selected?.scenario_key==='delivered_but_missing'&&(!reportedStart||!reportedEnd||new Date(reportedEnd).getTime()-new Date(reportedStart).getTime()!==7200000)){setError('For the eight-second two-hour demo summary, choose an exact two-hour start and end window.');return}
  completeStep(2);recordGuideAction('customer','issueSelected');
 }
 function advanceEvidence(){
  if(includeFootage&&!footageReviewed){setError('Play or review the linked demo footage, then confirm you reviewed it, or turn off the footage option.');return}
  completeStep(3);recordGuideAction('customer','evidenceReviewed');
 }
 const reportList=reports.filter(r=>!tracking||r.tracking_number===tracking);
 return <div className="min-h-screen bg-background px-3 py-5 text-foreground sm:px-6">
  <main className="mx-auto max-w-5xl space-y-5">
   <Link to="/" className="inline-block font-semibold text-primary underline">← Choose Customer or Management</Link>
   <header className="rounded-2xl border-2 bg-card p-5">
    <p className="text-xs font-black uppercase tracking-wide text-primary">Customer {mode==='demo'?'· Fully connected simulation':'· Live connection setup'}</p>
    <h1 className="mt-1 text-3xl font-black">Your delivery investigation</h1>
    <p className="mt-2 text-sm">Follow four simple stages. Each section unlocks as you go. Your submitted demo report appears in Management.</p>
    <button type="button" onClick={()=>{setOtherRoute(true);setStage(5);requestAnimationFrame(()=>document.getElementById('customer-stage-5')?.scrollIntoView({behavior:'smooth',block:'start'}))}} className="mt-3 rounded-lg border-2 border-violet-500 px-4 py-2 text-sm font-bold text-foreground">Using UPS, FedEx, USPS or another carrier? Open the optional route →</button>
   </header>
   {mode==='demo'&&<section className="rounded-xl border-2 border-dashed border-teal-400 bg-card p-3" aria-label="Simulated account connections">
    <h2 className="text-sm font-black">Demo accounts connected (simulation only)</h2>
    <div className="mt-2 flex flex-wrap gap-2">{SIMULATED_ACCOUNTS.map(name=><span key={name} className="rounded-lg border-2 border-teal-500 px-2 py-1 text-xs font-bold">✓ {name} · DEMO LINKED</span>)}</div>
    <p className="mt-2 text-xs text-muted-foreground">These accounts are fictional pre-linked demo fixtures, not authorized live logins. Ring footage is synthesized, not retrieved from a real doorbell.</p>
   </section>}
   {mode==='live'&&<IntegrationPlaceholders audience="customer"/>}
   <details id="ask-amy" className="rounded-xl border-[3px] border-teal-500 bg-card p-4">
    <summary className="cursor-pointer text-lg font-black">Need help? Talk to Amy or start the audio walkthrough</summary>
    <p className="mt-2 text-sm">Amy follows these four color-coded steps and can answer questions about your fictional package and next action.</p>
    <div className="mt-3"><RoleWalkthrough role="customer"/></div>
    <details className="mt-3 rounded-lg border p-3"><summary className="cursor-pointer font-semibold">Audio preferences</summary><VoicePicker/></details>
   </details>
   <StageProgress titles={STAGE_TITLES} current={stage} done={done}/>
   <div className="flex flex-col gap-0" aria-label="Connected customer workflow stages">
   <WorkflowStage number={1} title="Choose Delivery" id="customer-stage-1" active={stage===1} done={isDone(1)} locked={stageLocked(1)} onReopen={()=>activate(1)} description="Choose your delivery; you may name it for easier reference.">
    <label className="block text-sm font-bold">Paired tracking record
     <select value={tracking} onChange={e=>selectTracking(e.target.value)} disabled={mode!=='demo'||Boolean(busy)} className="mt-2 w-full rounded-xl border-2 border-yellow-500 bg-background p-3 text-base">
      <option value="">Choose a package</option>{packages.map(p=><option key={p.tracking_number} value={p.tracking_number}>{p.package_nickname?p.package_nickname+' · ':''}{p.tracking_number} · {p.scenario_title||formatStatus(p.status)}</option>)}
     </select>
    </label>
    {selected&&<><Link to={packageProfilePath(selected.tracking_number,true)} aria-label={`View package profile for ${selected.package_nickname||selected.scenario_title||selected.tracking_number}`} className="group block rounded-xl border-2 border-yellow-500 bg-card p-4 text-sm text-foreground transition-colors hover:bg-yellow-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <span className="block text-base font-black">{selected.package_nickname||selected.scenario_title||'Sample delivery'} <span aria-hidden="true" className="text-yellow-500">↗</span></span>
      <span className="mt-1 block break-all">Tracking: {selected.tracking_number}</span>
      <span className="mt-1 block font-bold">Current status: {formatStatus(selected.status)} (fictional)</span>
      <span className="mt-2 block text-xs text-muted-foreground">Fictional camera and delivery account paired for this demonstration.</span>
      <span className="mt-2 block font-black text-primary group-hover:underline">View package profile, status &amp; details →</span>
     </Link><label className="block text-sm font-bold">Optional package name<input value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={60} placeholder="Birthday present" className="mt-2 w-full rounded-xl border bg-background p-3"/></label>
     <button type="button" disabled={Boolean(busy)} onClick={saveNickname} className="rounded-lg border-2 border-yellow-500 px-3 py-2 text-sm font-bold disabled:opacity-40">{busy==='nickname'?'Saving…':'Save optional name'}</button></>}
    {mode==='demo'&&selected&&<label className="flex items-start gap-3 rounded-xl border-2 border-yellow-500/60 bg-card p-3 text-sm">
     <input type="checkbox" checked={demoSharingConsent} disabled={Boolean(busy)} onChange={e=>changeDemoConsent(e.target.checked)}/>
     <span><strong>Demo signup preference: automatically include my simulated camera clips when I submit a report.</strong><span className="mt-1 block text-xs text-muted-foreground">The fictional sample customer starts with this enabled; you can turn it off. No real Ring account or camera is connected. {DEMO_CONSENT_NOTICE}</span></span>
    </label>}
    {mode==='demo'?<button type="button" disabled={!selected} onClick={advancePackage} className="block w-full rounded-lg bg-yellow-400 px-5 py-3 text-base font-black text-[#191919] disabled:opacity-40">Continue to 2. Compile Details →</button>:<p className="text-sm">Live shipment linking needs customer-specific authorization; no demo account credentials are used in live mode.</p>}
   </WorkflowStage>
   <WorkflowStage number={2} title="Describe the Issue" id="customer-stage-2" active={stage===2} done={isDone(2)} locked={stageLocked(2)} onReopen={()=>activate(2)} description="Describe the issue and confirm the reported delivery window.">
    <div className="flex items-center gap-2"><AlertTriangle size={19}/><strong className="text-sm">What happened?</strong></div>
    <label className="block text-sm font-bold">Type of problem
     <select value={issue} onChange={e=>setIssue(e.target.value)} className="mt-2 w-full rounded-xl border-2 border-orange-500 bg-background p-3 text-base">
      <option value="">Choose the delivery issue</option>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}
     </select>
    </label>
    <label className="block text-sm font-bold">Explanation (optional)<textarea rows={4} maxLength={1500} value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Explain what you saw, not what you assume occurred." className="mt-2 w-full rounded-xl border-2 border-orange-500 bg-background p-3"/></label>
    <div className="grid gap-3 sm:grid-cols-2">
     <label className="text-sm font-semibold">Carrier-reported delivery window start<input type="datetime-local" value={reportedStart} onChange={e=>setReportedStart(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-orange-500 bg-background p-3"/></label>
     <label className="text-sm font-semibold">Window end<input type="datetime-local" value={reportedEnd} onChange={e=>setReportedEnd(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-orange-500 bg-background p-3"/></label>
    </div>
    <p className="text-xs text-muted-foreground">In the demo, a two-hour window is suggested around the fictional delivery confirmation. The eight-second accelerated scene represents those two hours, but cannot verify uninterrupted camera coverage. Times are not verified from a real carrier.</p>
    <button type="button" onClick={advanceDetails} disabled={!issue} className="w-full rounded-lg bg-[#FF5138] px-5 py-3 text-base font-black text-white disabled:opacity-40">Continue to 3. Gather Evidence →</button>
   </WorkflowStage>
   <WorkflowStage number={3} title="Review Camera Evidence" id="customer-stage-3" active={stage===3} done={isDone(3)} locked={stageLocked(3)} onReopen={()=>activate(3)} description="Review the paired demo Ring-style footage or choose no footage.">
    <div className="rounded-xl border-2 border-teal-500 p-3">
     <strong className="text-sm">Paired camera: Ring Doorbell · DEMO LINKED</strong>
     <p className="mt-1 text-xs text-muted-foreground">Illustrated fixed-doorbell-perspective scene for {selected?.package_nickname||selected?.scenario_title||'your sample package'} (tracking ending {tracking.slice(-4)}). Every person, porch and camera frame is synthetic, not a real Ring recording.</p>
     {cameraChoices.length>1&&<label className="mt-3 block text-sm font-bold">Choose the event to watch and attach
      <select value={selectedDoorbellEvent} onChange={e=>{setDoorbellEvent(e.target.value);setFootageReviewed(false)}} className="mt-1 block w-full rounded-lg border-2 border-teal-500 bg-background p-3">
       {cameraChoices.map(c=><option key={c.eventKey} value={c.eventKey}>{c.title}</option>)}
      </select>
     </label>}
     {pairedClip?<div className="mt-3 space-y-2">
      <p className="text-sm font-semibold">{pairedClip.title} · {event?.occurred_at?new Date(event.occurred_at).toLocaleString('en-US',{timeZone:'America/Los_Angeles'}):'Fictional window'} PT</p>
      {comparisonClip?<DoorwayComparison customerClip={pairedClip} claimedClip={comparisonClip} trackingNumber={tracking} compact/>:
       <EvidencePlayer key={pairedClip.clip_key} clip={pairedClip} height="sm" trackingNumber={tracking} cameraId={pairedClip.camera_id} eventTime={event?.occurred_at||null}/>}
      <p className="text-xs text-muted-foreground">{pairedClip.description}</p>
      {pairedClip.window_compressed&&<p className="rounded border border-amber-500 p-2 text-xs font-bold">Eight-second fictional summary of the TWO-HOUR delivery window, not a verified uninterrupted 2-hour recording. No visual absence claim is conclusive without checking actual footage coverage.</p>}
     </div>:<p role="status" className="mt-3 rounded-lg border border-amber-500 bg-background p-3 text-sm">{doorbellUnavailable(selected)} You can still submit your investigation without camera footage.</p>}
    </div>
    <label className="flex items-start gap-3 text-sm font-bold"><input type="checkbox" checked={includeFootage&&Boolean(pairedClip)} disabled={!pairedClip||!demoSharingConsent} onChange={e=>{setIncludeFootage(e.target.checked);setFootageReviewed(false)}}/> Automatically share this package's eight-second fictional doorbell clip with demo management {pairedClip?'':'(no doorstep event available)'}</label>
    {includeFootage&&pairedClip&&<label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={footageReviewed} onChange={e=>setFootageReviewed(e.target.checked)}/> I reviewed the synthetic event and understand compressed sampling alone cannot prove the parcel was never delivered.</label>}
    <button type="button" disabled={includeFootage&&Boolean(pairedClip)&&!footageReviewed} onClick={advanceEvidence} className="w-full rounded-lg bg-[#09B9AC] px-5 py-3 text-base font-black text-[#061614] disabled:opacity-40">Continue to 4. Submit Investigation →</button>
   </WorkflowStage>
   <WorkflowStage number={4} title="Send the Report" id="customer-stage-4" active={stage===4} done={isDone(4)} locked={stageLocked(4)} onReopen={()=>activate(4)} description="Send your report and chosen synthetic evidence to Ring Guardian’s demo management queue.">
    <div className="rounded-xl border-2 border-green-500/60 bg-background p-3 text-sm space-y-1">
     <p><strong>Package:</strong> {selected?.package_nickname||selected?.scenario_title} · ending {tracking.slice(-4)}</p>
     <p><strong>Problem:</strong> {issue||'Not selected'}</p><p><strong>Time window:</strong> {reportedStart||'Not provided'} to {reportedEnd||'Not provided'}</p>
     <p><strong>Evidence:</strong> {includeFootage&&pairedClip?pairedClip.title+' · simulated':'No video selected'}</p>
     <p className="text-xs">This is an internal simulation submission, not a carrier, police or insurer complaint.</p>
    </div>
    <form onSubmit={submit}><button type="submit" disabled={!isDone(3)||!selected||Boolean(busy)||mode!=='demo'} className="w-full rounded-lg bg-[#3DBD5D] px-5 py-3 text-base font-black text-[#061E0C] disabled:opacity-40">
     {busy==='submit'?'Submitting to demo management…':'Submit Investigation & Selected Evidence'}
    </button></form>
    {notice&&<p role="status" className="rounded-xl border-2 border-green-500 bg-card p-3 text-sm font-semibold">{notice}</p>}
    {hasReport&&<div className="space-y-3"><h3 className="font-black">Submission receipt</h3>
     {reportList.map(r=>{const clip=board?.clips?.find(c=>c.clip_key===r.evidence_clip_key);return <div key={r.id||r.report_number} className="rounded-xl border-2 border-green-500/60 p-3 text-sm space-y-2">
      <p><strong>{r.report_number} · {r.issue}</strong></p>
      <p>{r.evidence_received?'Simulated video receipt confirmed in the management queue':'No video attached'} · {r.tracking_number}</p>
      {clip&&<EvidencePlayer clip={clip} height="sm" trackingNumber={r.tracking_number} cameraId={clip.camera_id||'CAM-9901'} eventTime={clip.recorded_start}/>}
      <button type="button" onClick={()=>{recordGuideAction('customer','reportReviewed');setNotice('Reviewed receipt '+r.report_number+'. The management demo can find this case.')}} className="rounded-lg border-2 border-green-500 px-3 py-2 text-sm font-bold">I reviewed this submitted report</button>
     </div>})}
     <button type="button" onClick={()=>{setDone(v=>v.includes(5)?v:[...v,5]);setOtherRoute(true);setStage(5);requestAnimationFrame(()=>document.getElementById('customer-stage-5')?.scrollIntoView({behavior:'smooth',block:'start'}))}} className="rounded-lg border-2 border-violet-500 px-4 py-3 text-sm font-bold">Optional: other carriers, insurance and police reports →</button>
    </div>}
   </WorkflowStage>
   {error&&<p role="alert" className="rounded-xl border-2 border-red-500 bg-card p-3 text-sm font-semibold text-red-500">{error}</p>}
   <WorkflowStage number={5} title="Other Delivery Services" id="customer-stage-5" active={stage===5} done={isDone(5)} locked={!otherRoute&&!isDone(4)} optional description="Optional independent route for other delivery providers and downloadable evidence.">
    <p className="text-sm font-semibold">You can prepare non-Amazon package evidence even without completing the four-stage Amazon demo.</p>
    <OtherCarrierDeliveries mode={mode}/>
    <details className="rounded-xl border-2 border-violet-500 p-3"><summary className="cursor-pointer text-base font-black">Prepare a police or insurance report (optional)</summary>
     <div className="mt-3"><PoliceEvidenceReport packages={packages} tracking={tracking} issue={issue} detail={detail} mode={mode}/></div>
    </details>
   </WorkflowStage>
   </div>
   <p className="text-xs text-muted-foreground"><Camera className="mr-1 inline" size={14}/> All connected services and camera footage displayed in demo mode are synthetic. Actual live shipping accounts and Ring recordings require individual authorization and production integrations. <ExternalLink size={13} className="inline"/></p>
  </main>
 </div>;
}