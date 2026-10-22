import React,{useEffect,useState} from 'react';
import {ops} from '@/lib/demo';
import DoorwayComparison from '@/components/evidence/DoorwayComparison';

const FACTORS=[
 ['door_number','Address or unit number'],['door_color','Front door color'],['doormat','Mat or floor decoration'],
 ['wall_or_siding','Brick, siding or wall details'],['window_position','Window or side entrance position'],
 ['porch_fixture','Lights, railings and fixtures'],['parcel_placement','Where the parcel was left'],
 ['landmark','Landmark or surrounding objects'],['other','Other non-sensitive identifying feature']
];
const VERDICTS=[
 ['not_determined','Not determined'],['possible_location_mismatch','Possible drop-off address mismatch'],
 ['appears_to_match','Appear visually consistent'],['needs_more_evidence','Need more evidence']
];
export default function DoorwayReview({report,expectedClip,claimedClip,onSaved}){
 const [verdict,setVerdict]=useState(report.comparison_verdict||'not_determined');
 const [factors,setFactors]=useState(report.identifying_factors||[]);
 const [notes,setNotes]=useState(report.investigation_notes||'');
 const [status,setStatus]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setVerdict(report.comparison_verdict||'not_determined');setFactors(report.identifying_factors||[]);setNotes(report.investigation_notes||'')},[report.report_number,report.comparison_reviewed_at]);
 const toggle=v=>setFactors(prev=>prev.includes(v)?prev.filter(x=>x!==v):[...prev,v]);
 async function save(e){
  e.preventDefault();setBusy(true);setError('');setStatus('');
  try{
   const res=await ops({action:'reviewDeliveryLocation',report_number:report.report_number,comparison_verdict:verdict,identifying_factors:factors,investigation_notes:notes});
   if(!res?.ok)throw Error(res?.error||'Could not save investigation notes.');
   setStatus('Observations saved to customer report and linked management investigation.');
   await onSaved?.();
  }catch(e){setError(e?.message||'Unable to save.')}finally{setBusy(false)}
 }
 return <section className="space-y-4 rounded-xl border-[3px] border-teal-500 bg-card p-4">
  <h3 className="text-lg font-black">Doorway comparison & recovery clues</h3>
  <p className="text-sm text-muted-foreground">Use the package ID to compare the customer’s expected front door to the alleged courier drop-off. Both scenes are fictional. A different-looking doorway is a lead for verification, never an automatic conclusion.</p>
  <DoorwayComparison customerClip={expectedClip} claimedClip={claimedClip} trackingNumber={report.tracking_number}/>
  <form onSubmit={save} className="space-y-3">
   <label className="block text-sm font-bold">Management assessment
    <select value={verdict} onChange={e=>setVerdict(e.target.value)} className="mt-2 block w-full rounded-xl border-2 border-teal-500 bg-background p-3">{VERDICTS.map(([key,label])=><option value={key} key={key}>{label}</option>)}</select>
   </label>
   <fieldset className="rounded-lg border-2 p-3">
    <legend className="px-2 text-sm font-bold">Which location clues matter for recovery?</legend>
    <div className="grid gap-2 sm:grid-cols-2">{FACTORS.map(([key,label])=><label key={key} className="flex items-center gap-2 rounded border p-2 text-sm"><input type="checkbox" checked={factors.includes(key)} onChange={()=>toggle(key)}/>{label}</label>)}</div>
   </fieldset>
   <label className="block text-sm font-bold">Investigation details and identifying factors
    <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} maxLength={2000} placeholder="Example: customer view has a slate-blue door and welcome mat; alleged courier image shows a different door number, a different door color and another light fixture. Verify delivery geolocation, scan data and permissioned footage before following up." className="mt-2 block w-full rounded-xl border-2 border-teal-500 bg-background p-3 text-sm"/>
   </label>
   <p className="text-xs text-muted-foreground">Avoid identifying people by appearance alone or treating simulated visuals as verified evidence. These observations are saved within this demo session only.</p>
   {error&&<p role="alert" className="text-sm text-red-500">{error}</p>}
   {status&&<p role="status" className="text-sm text-green-600">{status}</p>}
   <button disabled={busy} type="submit" className="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{busy?'Saving…':'Save doorway observations to investigation'}</button>
  </form>
 </section>;
}