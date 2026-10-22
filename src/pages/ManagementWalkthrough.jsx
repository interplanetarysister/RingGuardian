import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_ID, SIMULATED_EVENTS, buildEvidenceReport, classifyDelivery } from '@/lib/deliveryEvidence.mjs';

const scenes = [
  { title:'Loading dock: employee begins shift',source:'Wearable RG-W01 · Dock 04',time:'08:14:02',tracking:'TBA304711915063',location:'Distribution center / Dock 04',speech:'The dock employee activates their wearable Ring Guardian camera. The session records a simulated camera identity, timestamp and work area.',scene:'dock',scan:'Awaiting package scan',event:'Employee wearable recording started'},
  { title:'Package scanned and matched',source:'Wearable RG-W01 + scanner SC-17',time:'08:14:18',tracking:'TBA304711915063',location:'Distribution center / Dock 04',speech:'The employee scans the package. Its tracking identifier now joins the wearable footage and loading-bay location in the same evidence chain.',scene:'scan',scan:'SCAN OK · TBA304711915063',event:'Barcode matched to shipment'},
  { title:'Package loaded into delivery truck',source:'Wearable RG-W01 · Truck TR-218',time:'08:15:09',tracking:'TBA304711915063',location:'Truck TR-218 / loading bay',speech:'The camera shows the package crossing from dock to truck. A vehicle assignment and completed scan confirm the loading event.',scene:'truck',scan:'LOADED · TR-218',event:'Worker footage linked to truck manifest'},
  { title:'Driver takes custody',source:'Wearable RG-D07 · Route 42',time:'10:21:31',tracking:'TBA304711915063',location:'Route 42 · GPS sample checkpoint',speech:'The delivery driver camera takes over. The route-tracking demonstration links the same tracking number to driver location updates. It does not connect to a live carrier.',scene:'driver',scan:'OUT FOR DELIVERY',event:'Custody handoff to driver'},
  { title:'Driver arrives at destination',source:'Wearable RG-D07 + simulated route GPS',time:'10:37:41',tracking:'TBA304711915063',location:'Expected: 120 Sample Lane / Actual: 120 Sample Lane',speech:'The driver approaches the doorstep while route GPS records the approximate stop. GPS proximity alone does not prove the correct house: the camera view is part of the evidence.',scene:'porch',scan:'AT DELIVERY STOP',event:'Camera + GPS delivery window matched'},
  { title:'Drop-off verification',source:'Wearable RG-D07 · Drop-off evidence',time:'10:38:05',tracking:'TBA304711915063',location:'Proof-of-delivery stop',speech:'The driver records the parcel being set down. Compare porch details, address confirmation and the route location to decide whether to submit a correct-address or wrong-address report.',scene:'drop',scan:'DROP-OFF RECORDED',event:'Delivery proof available for review'}
];

function SimulatedFootage({step,wrong}) {
 const p=scenes[step], porch=wrong?'118 SAMPLE LANE':'120 SAMPLE LANE';
 return <div className="relative overflow-hidden rounded-xl border border-slate-600 bg-slate-950 text-white aspect-video" aria-label={'Animated simulated camera perspective: '+p.title}>
  <svg viewBox="0 0 640 360" className="w-full h-full" role="img" aria-label="Illustrated simulation of warehouse dock and delivery camera footage">
   <defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#374151"/><stop offset="1" stopColor="#64748b"/></linearGradient></defs>
   <rect width="640" height="360" fill={step<3?'#1f2937':'url(#sky)'}/>
   {step<3 ? <>
    <rect y="240" width="640" height="120" fill="#4b5563"/>
    <path d="M0 240 L280 180 L640 240" fill="#374151" stroke="#9ca3af" strokeWidth="3"/>
    <rect x="40" y="48" width="190" height="190" rx="4" fill="#111827" stroke="#94a3b8" strokeWidth="5"/>
    <rect x="55" y="65" width="160" height="162" fill="#334155"/>
    <text x="58" y="83" fill="white" fontSize="14">DOCK 04</text>
    <rect x="365" y="95" width="242" height="149" fill="#9ca3af" stroke="#e2e8f0" strokeWidth="4"/>
    <rect x="390" y="110" width="194" height="115" fill="#1e293b"/>
    <text x="401" y="137" fill="white" fontSize="16">TRUCK TR-218</text>
    <rect x={step===0?180:step===1?270:430} y={step===0?222:step===1?222:210} width="92" height="66" rx="2" fill="#b58a54" stroke="#f1d6ac" strokeWidth="3"/>
    <path d={step===0?'M226 222 v66':step===1?'M316 222 v66':'M476 210 v66'} stroke="#72502a" strokeWidth="3"/>
    <text x={step===0?189:step===1?279:438} y={step===2?248:260} fontSize="11" fill="#18181b">PKG 5063</text>
    {step===1&&<rect x="260" y="213" width="112" height="84" fill="none" stroke="#4ade80" strokeWidth="4" strokeDasharray="9 4"/>}
    <path d="M0 360 L145 284 L180 308 L90 360" fill="#d6b08a"/>
    <path d="M640 360 L545 282 L520 310 L573 360" fill="#d6b08a"/>
   </> : <>
    <rect y="242" width="640" height="118" fill="#64748b"/>
    <rect x="125" y="75" width="410" height="190" fill="#d1d5db" stroke="#475569" strokeWidth="4"/>
    <path d="M110 80 L330 12 L550 80Z" fill="#475569"/>
    <rect x="292" y="113" width="110" height="153" fill="#475569"/>
    <rect x="311" y="130" width="74" height="121" fill="#94a3b8"/>
    <rect x="156" y="120" width="80" height="85" fill="#93c5fd" stroke="#f8fafc" strokeWidth="7"/>
    <rect x="435" y="120" width="64" height="85" fill="#93c5fd" stroke="#f8fafc" strokeWidth="7"/>
    <text x="316" y="107" fontSize="13" fill="#111827">{porch}</text>
    <path d="M260 267 L405 267 L505 360 L142 360Z" fill="#9ca3af"/>
    {(step===5||step===4)&&<rect x={step===5?342:455} y={step===5?247:272} width="74" height="52" fill="#b58a54" stroke="#f1d6ac" strokeWidth="3"/>}
    {step===3&&<path d="M0 310 Q160 270 330 315 T640 290" fill="none" stroke="#f8fafc" strokeDasharray="20 12" strokeWidth="7"/>}
   </>}
   <path d="M300 180h40 M320 160v40" stroke="#f8fafc" strokeWidth="1.5" opacity=".55"/>
  </svg>
  <div className="absolute top-2 left-2 rounded bg-black/75 px-2 py-1 text-xs font-bold text-amber-300">SIMULATED · NOT REAL FOOTAGE</div>
  <div className="absolute top-2 right-2 rounded bg-black/75 px-2 py-1 text-xs">● REC · {p.time}</div>
  <div className="absolute bottom-2 left-2 right-2 rounded bg-black/75 px-3 py-2 text-xs flex flex-wrap justify-between gap-1"><span>{p.source}</span><span>{p.scan}</span></div>
 </div>;
}
export default function ManagementWalkthrough(){
 const [step,setStep]=useState(0),[wrong,setWrong]=useState(false),[playing,setPlaying]=useState(false),[decision,setDecision]=useState(''),[notes,setNotes]=useState(''),[visualConfirmed,setVisualConfirmed]=useState(false);
 useEffect(()=>{if(!playing || typeof window==='undefined'||!('speechSynthesis' in window))return; window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(scenes[step].speech);utterance.rate=0.95;window.speechSynthesis.speak(utterance);return()=>window.speechSynthesis.cancel()},[playing,step]);
 useEffect(()=>{if(!playing)return;const t=setTimeout(()=>{setStep(s=>{if(s===scenes.length-1){setPlaying(false);return s;}return s+1;});},5200);return()=>clearTimeout(t)},[playing,step]);
 const p=scenes[step], actual=wrong?'118 Sample Lane':'120 Sample Lane';
 const assessment=classifyDelivery({expectedAddress:'120 Sample Lane',observedAddress:actual,trackingNumber:SAMPLE_ID,events:SIMULATED_EVENTS,visualAddressConfirmed:visualConfirmed,locationAccuracyMeters:12});
 const report={...buildEvidenceReport({expectedAddress:'120 Sample Lane',observedAddress:actual,trackingNumber:SAMPLE_ID,events:SIMULATED_EVENTS,notes,visualAddressConfirmed:visualConfirmed,locationAccuracyMeters:12}),managerSelection:decision||'unreviewed',source:'Illustrated simulated employee and driver wearable cameras'};
 const download=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='sample-package-investigation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
 return <main className="mx-auto max-w-5xl p-4 space-y-5">
  <div><Link className="text-sm underline" to="/management">← Operations management</Link><h1 className="mt-2 text-2xl font-bold">Employee-to-doorstep evidence walkthrough</h1><p className="text-sm text-muted-foreground">Guided, animated simulation of wearable camera and package tracking evidence, not recorded video or a live Ring/carrier feed.</p></div>
  <div className="rounded-xl border p-4 space-y-3"><p className="text-xs font-bold uppercase">Demo case · TBA304711915063</p><div className="flex items-center gap-3 flex-wrap"><label className="text-sm font-semibold" htmlFor="outcome">Drop-off scenario</label><select id="outcome" value={wrong?'wrong':'correct'} onChange={e=>{setWrong(e.target.value==='wrong');setDecision('')}} className="rounded border bg-background px-3 py-2"><option value="correct">Correct address</option><option value="wrong">Wrong address</option></select><span className="text-xs text-muted-foreground">Fictional addresses and location updates</span></div></div>
  <SimulatedFootage step={step} wrong={wrong}/>
  <div className="rounded-xl border p-4 space-y-3" aria-live="polite"><div className="flex items-center justify-between gap-2"><h2 className="font-bold">Step {step+1} of {scenes.length}: {p.title}</h2><span className="text-xs">Camera {step<3?'Employee':'Driver'}</span></div><p className="text-sm">{p.speech}</p><p className="text-sm"><strong>Evidence checkpoint:</strong> {p.event}</p><p className="text-sm"><strong>Simulated location:</strong> {step>=4?('Expected: 120 Sample Lane · Observed: '+actual):p.location}</p><div className="flex gap-2 flex-wrap"><button className="rounded border px-4 py-2 text-sm" onClick={()=>{setStep(s=>Math.max(0,s-1));setPlaying(false)}} disabled={step===0}>Previous</button><button className="rounded bg-primary text-primary-foreground px-4 py-2 text-sm" onClick={()=>{setStep(s=>Math.min(scenes.length-1,s+1));setPlaying(false)}} disabled={step===scenes.length-1}>Next evidence</button><button className="rounded border px-4 py-2 text-sm" onClick={()=>{if(step===scenes.length-1)setStep(0);setPlaying(!playing)}}>{playing?'Pause':'Play guided walkthrough'}</button><button className="rounded border px-4 py-2 text-sm" onClick={()=>{if('speechSynthesis' in window){window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(p.speech))}}}>Read step aloud</button><button className="rounded border px-4 py-2 text-sm" onClick={()=>{setStep(0);setPlaying(false);setDecision('')}}>Restart</button></div></div>
  <section className="rounded-xl border p-4 space-y-3"><h2 className="font-bold">Linked package evidence timeline</h2><div className="space-y-2">{scenes.map((s,i)=><button key={s.time} onClick={()=>{setStep(i);setPlaying(false)}} className={'w-full text-left rounded border p-3 text-sm '+(i===step?'border-primary bg-muted':'')}><span className="font-semibold">{s.time} · {s.title}</span><span className="block text-xs text-muted-foreground">{s.source} · {s.scan}</span></button>)}</div></section>
  <section className="rounded-xl border p-4 space-y-3"><h2 className="font-bold">Manager review: Was this the right address?</h2><p className="text-sm">Expected delivery address: 120 Sample Lane. Simulated drop-off observation: {actual}. Tracking data is a sample, not a live delivery-driver connection.</p><div className="flex flex-wrap gap-2">{[['correct','Correct address confirmed'],['wrong','Wrong address suspected'],['uncertain','Needs human review']].map(([value,label])=><button key={value} onClick={()=>setDecision(value)} className={'rounded border px-3 py-2 text-sm '+(decision===value?'bg-primary text-primary-foreground':'')}>{label}</button>)}</div>{decision==='correct'&&wrong&&<p role="alert" className="text-sm text-amber-600">Your decision conflicts with the simulated address evidence. Review before finalizing.</p>}{decision==='wrong'&&!wrong&&<p role="alert" className="text-sm text-amber-600">The displayed address matches the expected address; consider other evidence before concluding wrong delivery.</p>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visualConfirmed} onChange={e=>setVisualConfirmed(e.target.checked)}/> I reviewed and confirmed the address visible in the simulated camera view</label><div className="rounded border p-3 text-sm"><strong>Evidence assessment: {assessment.verdict}</strong><ul className="list-disc pl-5 mt-1">{assessment.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></div><label className="block text-sm">Investigation notes<textarea rows={3} className="mt-1 w-full rounded border bg-background p-2" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Describe the observed porch, GPS accuracy and any uncertainty"/></label><button onClick={download} className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Export simulated evidence report</button><p className="text-xs text-muted-foreground">Report is downloaded locally, never sent to a carrier or Amazon. Actual integrations require approved device/route APIs and explicit authorization.</p></section>
 </main>;
}
