import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Building2,Package,ScanLine,Camera,ClipboardList,PlayCircle,ArrowRight} from 'lucide-react';
import WorkflowStage,{StageProgress} from '@/components/workflow/WorkflowStage';
import CustomerReportsInbox from '@/components/guide/CustomerReportsInbox';
import RoleWalkthrough from '@/components/guide/RoleWalkthrough';
import VoicePicker from '@/components/guide/VoicePicker';
import {getAppMode} from '@/lib/appMode';
import {readGuideActions,recordGuideAction} from '@/lib/guideProgress';
import IntegrationPlaceholders from '@/components/common/IntegrationPlaceholders';

/** @type {Array<[string,string,React.ComponentType<any>,string]>} */
const TOOLS=[
 ['Hub overview','/dashboard',Building2,'Review the simulated shipment queue and exceptions'],
 ['Shipment handling','/packages',Package,'Inspect package records, scans and custody'],
 ['Scanner stations','/scanners',ScanLine,'Review fictional scanner events and handoffs'],
 ['Camera evidence','/evidence',Camera,'Compare simulated video intervals and scan timestamps'],
 ['Investigations','/investigations',ClipboardList,'Review findings and case histories'],
 ['Full demo tour','/guided-demo',PlayCircle,'Try the extended operational simulation']
];
const STAGES=['Customer Reports','Follow Shipment','Match Camera Evidence','Review Investigation','More Management Tools'];
const PROGRESS_KEY='rgc.management.workflow.v1';
function savedProgress(){
 try{
  const value=JSON.parse(sessionStorage.getItem(PROGRESS_KEY)||'{}');
  const done=Array.isArray(value.done)?value.done.filter(n=>Number.isInteger(n)&&n>=1&&n<=5):[];
  const stage=Number.isInteger(value.stage)?Math.min(5,Math.max(1,value.stage)):1;
  return {done,stage:stage<=1||done.includes(stage-1)?stage:Math.min(5,Math.max(1,done.length+1))};
 }catch{return {done:[],stage:1}}
}

function ActionLink({to,title,detail,Icon,accent}){
 return <Link to={to} className="flex items-center gap-3 rounded-xl border-[3px] bg-background p-3 text-foreground" style={{borderColor:accent}}>
  <span className="shrink-0">{Icon&&<Icon size={22}/>}</span>
  <span className="flex-1"><strong className="block text-sm font-black">{title}</strong><span className="text-xs text-muted-foreground">{detail}</span></span>
  <ArrowRight size={18}/>
 </Link>;
}
export default function HubManagement(){
 const [mode,setMode]=useState('loading'),[error,setError]=useState('');
 const [persisted]=useState(savedProgress);
 const [stage,setStage]=useState(persisted.stage),[done,setDone]=useState(persisted.done);
 const [visits,setVisits]=useState(()=>readGuideActions('management'));
 const has=action=>visits.includes(action),isDone=n=>done.includes(n);
 const available=n=>n===1||isDone(n-1);
 const locked=n=>!available(n)&&!isDone(n);
 useEffect(()=>{
  try{sessionStorage.setItem(PROGRESS_KEY,JSON.stringify({stage,done}))}catch{/* private browsing */}
 },[stage,done]);
 function progress(n,action){
  if(action)recordGuideAction('management',action);
  setVisits(readGuideActions('management'));
  setDone(prev=>prev.includes(n)?prev:[...prev,n].sort((a,b)=>a-b));
  setStage(n<5?n+1:5);
  if(n<5)requestAnimationFrame(()=>document.getElementById('management-stage-'+(n+1))?.scrollIntoView({behavior:'smooth',block:'start'}));
 }
 function open(n){if(available(n)||isDone(n))setStage(n)}
 useEffect(()=>{
  try{sessionStorage.setItem('rgc.role','management')}catch{}
  getAppMode().then(setMode).catch(()=>{setMode('unknown');setError('Application mode could not be verified.')});
 },[]);
 useEffect(()=>{
  const refresh=e=>{if(e.detail?.role==='management')setVisits(readGuideActions('management'))};
  window.addEventListener('rgc-guide-action',refresh);
  return()=>window.removeEventListener('rgc-guide-action',refresh);
 },[]);
 return <div className="min-h-screen bg-background px-3 py-5 text-foreground sm:px-6">
  <main className="mx-auto max-w-5xl space-y-5">
   <Link to="/" className="inline-block font-bold text-primary underline">← Choose Customer or Management</Link>
   <header className="rounded-2xl border-2 bg-card p-5">
    <p className="text-xs font-black uppercase tracking-wide text-primary">{mode==='demo'?'Management · fictional connected hub':'Management · live setup'}</p>
    <h1 className="mt-2 text-3xl font-black">Investigate a delivery, one stage at a time</h1>
    <p className="mt-2 text-sm">Start with a submitted customer report. Follow its shipment, check scanner and camera records, then review an investigation. Each step unlocks the next.</p>
   </header>
   {mode==='demo'&&<div className="rounded-xl border-2 border-dashed border-teal-500 bg-card p-3 text-sm">
    <strong>Simulated warehouse + customer integrations linked</strong>
    <p className="mt-1">✓ Hub database (demo) · ✓ Scanners (demo) · ✓ Vest cameras (demo) · ✓ Customer Ring scenes (demo) · ✓ Package records (demo)</p>
    <p className="mt-1 text-xs text-muted-foreground">All records, worker scans, devices and video footage here are fictional. Public Management selection does not authorize real warehouse access.</p>
   </div>}
   {mode==='live'&&<IntegrationPlaceholders audience="management"/>}
   <details id="ask-piper" className="rounded-xl border-[3px] border-teal-500 bg-card p-4">
    <summary className="cursor-pointer text-lg font-black">Need help? Talk to Piper or start the management audio tour</summary>
    <p className="mt-2 text-sm">Piper follows the color-coded management stages and explains demo scans, customer reports and investigations.</p>
    <div className="mt-3"><RoleWalkthrough role="management"/></div>
    <details className="mt-3 rounded-lg border p-3"><summary className="cursor-pointer font-semibold">Audio preferences</summary><VoicePicker/></details>
   </details>
   <StageProgress titles={STAGES} current={stage} done={done}/>
   <WorkflowStage number={1} title="Review Customer Reports" id="management-stage-1" active={stage===1} done={isDone(1)} locked={locked(1)} onReopen={()=>open(1)}
    description="Start with the complaint and video receipt. The customer remains informed.">
    {mode==='demo'?<CustomerReportsInbox/>:<p className="text-sm">Live reporting requires an authorized management session and verified provider data.</p>}
    <p className="text-xs">Check the tracking number, optional package nickname and synthetic Ring scene receipt. A missing clip alone does not prove non-delivery.</p>
    <button type="button" disabled={mode!=='demo'} onClick={()=>progress(1,'complaintsReviewed')} className="w-full rounded-xl bg-yellow-400 px-5 py-3 text-base font-black text-[#171717] disabled:opacity-40">I reviewed the incoming demo queue →</button>
   </WorkflowStage>
   <WorkflowStage number={2} title="Follow Shipment" id="management-stage-2" active={stage===2} done={isDone(2)} locked={locked(2)} onReopen={()=>open(2)}
    description="Compare the customer tracking code to hub and vehicle records.">
    <div className="grid gap-3 sm:grid-cols-2">
     <ActionLink to="/dashboard" title="Hub overview" detail="View flagged exceptions and queue" Icon={Building2} accent="#FF5138"/>
     <ActionLink to="/packages" title="Package history" detail="Match the reported tracking number" Icon={Package} accent="#FF5138"/>
    </div>
    <p className="text-sm font-semibold">{has('dashboardOpened')||has('packageOpened')?'✓ You opened a shipment workspace. Review its records before continuing.':'Open either linked workspace, inspect a fictional shipment and return here to continue.'}</p>
    <button type="button" disabled={mode!=='demo'||(!has('dashboardOpened')&&!has('packageOpened'))} onClick={()=>progress(2)} className="w-full rounded-xl bg-[#FF5138] px-5 py-3 text-base font-black text-white disabled:opacity-40">Continue to 3. Match Camera Evidence →</button>
   </WorkflowStage>
   <WorkflowStage number={3} title="Match Camera Evidence" id="management-stage-3" active={stage===3} done={isDone(3)} locked={locked(3)} onReopen={()=>open(3)}
    description="Compare scanner timestamps with the related synthetic camera interval.">
    <div className="grid gap-3 sm:grid-cols-2">
     <ActionLink to="/scanners" title="Scanner stations" detail="Inspect a simulated custody scan" Icon={ScanLine} accent="#09CFC2"/>
     <ActionLink to="/evidence" title="Camera evidence" detail="Review paired demo video and recorded time" Icon={Camera} accent="#09CFC2"/>
    </div>
    <p className="text-xs text-muted-foreground">Missing scans or footage are unknown evidence, not proof of theft. Check source, location, parcel identity and event time.</p>
    <p className="text-sm font-semibold">{has('scannersOpened')&&has('evidenceOpened')?'✓ Both simulated record screens were opened.':'Open both Scanner stations and Camera evidence, then return to unlock investigation review.'}</p>
    <button type="button" disabled={mode!=='demo'||!has('scannersOpened')||!has('evidenceOpened')} onClick={()=>progress(3)} className="w-full rounded-xl bg-[#09C4B6] px-5 py-3 text-base font-black text-[#041D1A] disabled:opacity-40">Continue to 4. Review Investigation →</button>
   </WorkflowStage>
   <WorkflowStage number={4} title="Review Investigation" id="management-stage-4" active={stage===4} done={isDone(4)} locked={locked(4)} onReopen={()=>open(4)}
    description="Review the audit trail, discrepancies and available recovery actions.">
    <ActionLink to="/investigations" title="Investigation cases" detail="Review fictional case and follow-up details" Icon={ClipboardList} accent="#45C967"/>
    <p className="text-sm font-semibold">{has('investigationsOpened')?'✓ Investigation screen opened. Review the findings before continuing.':'Open Investigations, read a case and return to finish this section.'}</p>
    <p className="text-xs">The walkthrough does not mark any real delivery recovered or customer claim approved. Actual decisions require authorized case actions.</p>
    <button type="button" disabled={mode!=='demo'||!has('investigationsOpened')} onClick={()=>progress(4)} className="w-full rounded-xl bg-[#45C967] px-5 py-3 text-base font-black text-[#08230E] disabled:opacity-40">Finish review · Continue to other tools →</button>
   </WorkflowStage>
   <WorkflowStage number={5} title="More Management Tools" id="management-stage-5" active={stage===5} done={isDone(5)} locked={locked(5)} onReopen={()=>open(5)} optional
    description="Optional tools and further simulations after the main investigation.">
    <div className="grid gap-3 md:grid-cols-2">{TOOLS.map(([name,path,Icon,description])=><ActionLink key={path} to={path} title={name} detail={description} Icon={Icon} accent="#AD70FF"/>)}</div>
    <button type="button" onClick={()=>progress(5)} className="w-full rounded-xl bg-[#AD70FF] px-4 py-3 text-base font-black text-[#180A27]">I explored the optional tools</button>
   </WorkflowStage>
   {error&&<p role="alert" className="rounded-lg border-2 border-red-500 p-3 text-red-500">{error}</p>}
   <p className="text-xs text-muted-foreground">Demo view is not authentication. Real management permissions, records and integrations must be checked on the server.</p>
  </main>
 </div>;
}