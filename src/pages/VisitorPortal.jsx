import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {getAppMode} from '@/lib/appMode';
import {parseCsv,parseNotice} from '@/lib/importRecords';
import {speak,stopSpeaking,speechSupported} from '@/lib/voice';
const MANAGER_STEPS=[
 ['Choose a logistics source','Import a standard CSV export, or request an authorized connection to your logistics platform.'],
 ['Review your package list','Confirm which tracking numbers and destinations belong to your company.'],
 ['Review handling evidence','Match scans, facilities, vehicles and camera timestamps to the same package.'],
 ['Handle an exception','A wrong-truck scan or missing delivery should be clearly marked and explained.'],
 ['Confirm the action','Review the recorded outcome and proof before closing a case.']
];
const CUSTOMER_STEPS=[
 ['Add your deliveries','Enter one tracking number, import a file, or request a permitted email or carrier connection.'],
 ['Review imported details','Confirm the tracking number, courier and expected delivery.'],
 ['Check delivery updates','Compare courier status and any authorized camera observations.'],
 ['Report an issue','If the courier says delivered but you did not receive it, clearly flag that discrepancy.'],
 ['Follow your next steps','Keep evidence and review official carrier guidance. Nothing is submitted without you.']
];
export default function VisitorPortal({role}) {
 const [mode,setMode]=useState('unknown'),[step,setStep]=useState(0),[text,setText]=useState(''),[file,setFile]=useState(''),[error,setError]=useState(''),[records,setRecords]=useState([]),[showTips,setShowTips]=useState(true);
 const management=role==='management',steps=management?MANAGER_STEPS:CUSTOMER_STEPS;
 useEffect(()=>()=>stopSpeaking(),[step,role]);
 useEffect(()=>{try{sessionStorage.setItem('rgc.role',role)}catch{};getAppMode().then(setMode).catch(()=>setError('Could not verify app mode. Live connections are unavailable.'));},[role]);
 function review(){try{const parsed=(file.toLowerCase().endsWith('.csv') || /^(tracking_number|tracking|tracking_id|shipment_id)[^\n]*,/i.test(text))?parseCsv(text):parseNotice(text);setRecords(parsed);setError(parsed.length?'':'No recognizable rows found.');}catch(e){setRecords([]);setError(e.message);}}
 function loadFile(event) {
   const selected=event.target.files?.[0]; if(!selected)return;
   if(!/\.(csv|txt|eml)$/i.test(selected.name)){setError('Choose a CSV, TXT or EML export.');return}
   if(selected.size>1024*1024){setError('Maximum file size is 1 MB.');return}
   selected.text().then(s=>{setText(s.slice(0,20000));setFile(selected.name);setError('');}).catch(()=>setError('File could not be read.'));
 }
 return <div className="mx-auto max-w-4xl space-y-6 p-5 pb-20">
  <Link to="/" className="text-sm underline">← Choose another view</Link>
  <header className="rounded-xl border bg-card p-5"><div className="text-xs uppercase text-muted-foreground">{mode==='demo'?'SIMULATED TOUR':mode==='live'?'LIVE SETUP HELP':'MODE NOT VERIFIED'}</div>
   <h1 className="mt-2 text-3xl font-semibold">{management?'Management console':'My deliveries'}</h1>
   <p className="mt-2 text-sm">{management?'Logistics import, package scans, camera evidence, investigations and recovery.':'Track only packages you provide or authorize, with simple guidance and camera setup help.'}</p>
   {mode==='live'&&<p role="status" className="mt-3 rounded border p-3 text-sm">Live mode does not load demo records. Carrier/email connections require authorization and are not active by default.</p>}
  </header>
  <section className="rounded-xl border bg-card p-5">
   <h2 className="text-lg font-semibold">Step 1 · Add package information</h2>
   <p className="mt-2 text-sm">{management?'Upload a CSV file exported from your company logistics system.':'Enter a tracking number, paste a shipping email, or import a shipping notice.'}</p>
   <label className="mt-3 block text-sm">Search or paste details<textarea className="mt-1 min-h-24 w-full rounded-md border bg-background p-3" value={text} onChange={e=>setText(e.target.value)} placeholder={management?'Paste the logistics export contents or search for a package':'Paste tracking number, order confirmation or delivery email'}/></label>
   <label className="mt-3 block text-sm">Upload CSV, TXT or EML<input className="mt-1 block w-full rounded border p-2" type="file" accept=".csv,.txt,.eml,text/csv,text/plain,message/rfc822" onChange={loadFile}/></label>
   {file&&<p className="mt-2 text-sm" role="status">File ready to review: {file}</p>}
   <div className="mt-4 grid gap-3 sm:grid-cols-2">
    <div className="rounded-lg border p-3"><strong>{management?'Company logistics integration':'Connect delivery accounts'}</strong><p className="mt-2 text-sm">Choose an authorized connector when available. No password entry or background account access is requested here.</p><span className="mt-2 block text-sm text-muted-foreground">Connection setup pending provider authorization.</span></div>
    <div className="rounded-lg border p-3"><strong>{management?'Company email and reports':'Search my email for deliveries'}</strong><p className="mt-2 text-sm">Email access requires a connected account and explicit permission. Until connected, paste or import an exported notice.</p><span className="mt-2 block text-sm text-muted-foreground">No email account connected to this visitor session.</span></div>
   </div>
   {text&&<button className="mt-3 rounded bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={review}>Review imported packages</button>}
   {records.length>0&&<section className="mt-3 rounded border p-3" aria-label="Imported package review"><h3 className="font-semibold">{records.length} package entries to review</h3><p className="text-xs text-muted-foreground">Guest preview only. No uploads, tracking updates or external lookups were performed.</p><ul className="mt-2 max-h-48 space-y-2 overflow-auto">{records.map((r,i)=><li className="border-b py-1 text-sm" key={i}>{r.tracking} · {r.carrier} · {r.status}</li>)}</ul><button className="mt-2 rounded border px-3 py-2 text-sm" onClick={()=>{setRecords([]);setText('');setFile('')}}>Clear private preview</button></section>}
   {text&&<p role="status" className="mt-3 rounded border p-3 text-sm">Text loaded for review ({text.length} characters). It has not been sent to a carrier, saved to an account, or verified.</p>}
  </section>
  <section className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{mode==='demo'?'Guided tour':'Help when you need it'}</h2><button className="rounded border px-3 py-2 text-sm" onClick={()=>{stopSpeaking();setShowTips(v=>!v)}}>{showTips?'Hide tips':'Show tips'}</button></div>{showTips&&<>
   <div className="mt-3 flex gap-2 items-center justify-between"><span className="text-sm">Step {step+1} of {steps.length}</span><span className="text-xs text-muted-foreground">{management?'Management only':'Customer only'}</span></div>
   <h3 className="rgc-guide-focus mt-3 rounded p-2 font-semibold">{steps[step][0]}</h3><p role="status" className="mt-2 text-sm">{mode==='demo'?steps[step][1]:'Tip: '+steps[step][1]}</p>
   <div className="mt-3 flex flex-wrap gap-2"><button className="rounded border px-3 py-2 text-sm" disabled={!speechSupported()} onClick={()=>{stopSpeaking();speak(steps[step][0]+'. '+steps[step][1])}}>Read this step aloud</button><span className="text-xs text-muted-foreground">Speech matches the currently highlighted step.</span></div><div className="mt-4 flex gap-3"><button className="rounded border px-4 py-2" disabled={!step} onClick={()=>setStep(s=>Math.max(0,s-1))}>Previous</button><button className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={()=>setStep(s=>(s+1)%steps.length)}>{step===steps.length-1?'Restart':'Next tip'}</button></div></>}
  </section>
  {mode==='demo'&&<Link className="inline-flex rounded bg-primary px-4 py-3 text-primary-foreground" to={management?'/guided-demo':'/view/customer'}>{management?'Open full simulated management tour':'Restart customer tour'} →</Link>}
  {error&&<div role="alert" className="rounded border-2 border-red-500 bg-red-950/20 p-4 text-sm"><strong>Action needed:</strong> {error}<button className="ml-3 underline" onClick={()=>speak('Action needed. '+error)}>Hear error</button></div>}
 </div>;
}