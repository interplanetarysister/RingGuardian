import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import DoorwayReview from '@/components/guide/DoorwayReview';
import {loadBoard} from '@/lib/board';
import {recordGuideAction} from '@/lib/guideProgress';

export default function CustomerReportsInbox(){
 const [board,setBoard]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[search,setSearch]=useState('');
 const refresh=useCallback(async()=>{setBusy(true);setError('');try{setBoard(await loadBoard({fresh:true}));}catch(e){setError(e.message||'Could not fetch customer reports.')}finally{setBusy(false)}},[]);
 useEffect(()=>{refresh()},[refresh]);
 const reports=useMemo(()=>{const q=search.trim().toLowerCase();return (board?.complaints||[]).filter(r=>!q||[r.report_number,r.tracking_number,r.package_nickname,r.issue].some(s=>String(s||'').toLowerCase().includes(q)));},[board,search]);
 return <section id="customer-reports-inbox" aria-label="Customer reports received" className="rounded-xl border border-primary/40 bg-card p-5 space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Customer reports & received doorbell evidence</h2><p className="mt-1 text-sm text-muted-foreground">Internal fictional complaint queue for this demo session. Review by permanent tracking number; a customer nickname is only an extra label.</p></div><button type="button" disabled={busy} className="rounded border px-3 py-2 text-sm disabled:opacity-50" onClick={refresh}>{busy?'Refreshing…':'Refresh received reports'}</button></div>
  <label className="block text-sm">Find a report or package<input className="mt-1 w-full rounded border bg-background p-3" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tracking number, optional name or report ID"/></label>
  {error&&<p role="alert" className="text-sm text-red-500">{error}</p>}
  {!board&&!error&&<p className="text-sm">Loading the management queue…</p>}
  {board&&reports.length===0&&<p className="rounded border p-3 text-sm">No submitted customer reports match this search. Open the Customer demo and submit a report with optional scene footage, then refresh here.</p>}
  {reports.map(r=>{const s=board?.shipments?.find(p=>p.tracking_number===r.tracking_number);const clip=board?.clips?.find(c=>c.clip_key===r.evidence_clip_key);const claimedClip=board?.clips?.find(c=>c.clip_key===r.comparison_clip_key);const investigation=board?.cases?.find(c=>c.case_number==='CASE-CUST-'+r.report_number.slice(-10));return <article key={r.id||r.report_number} className="space-y-3 rounded-lg border p-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><div><strong>{r.report_number}</strong><p className="text-sm">{r.issue} · {r.status?.replaceAll('_',' ')}</p></div><span className="rounded border px-2 py-1 text-xs font-semibold">{r.evidence_received?'SIMULATED VIDEO RECEIVED':'NO VIDEO ATTACHED'}</span></div>
   <p className="text-sm"><strong>{s?.package_nickname||r.package_nickname||'Unnamed package'}</strong> · {r.tracking_number}</p>
   <p className="text-xs text-muted-foreground">Internal customer submission · {new Date(r.submitted_at).toLocaleString()} · No external filing</p>
   {r.detail&&<p className="text-sm">{r.detail}</p>}
   {clip&&<div className="space-y-2"><p className="text-sm font-semibold">Received fictional customer doorway recording</p><DoorwayReview report={r} expectedClip={clip} claimedClip={claimedClip} onSaved={refresh}/><p className="text-xs text-muted-foreground">{r.evidence_note}</p></div>}
   <p className="text-xs text-muted-foreground">The eight-second time-lapse is a fictional summary of a two-hour delivery window, not verified continuous coverage. Judge a possible location mismatch only after comparing address details and scan records.</p>
   <div className="flex flex-wrap gap-2"><Link to={'/packages/'+encodeURIComponent(r.tracking_number)} className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={()=>recordGuideAction('management','complaintsReviewed')}>Track this package and scans</Link>{investigation&&<Link to={'/investigations/'+encodeURIComponent(investigation.case_number)} className="rounded border px-3 py-2 text-sm" onClick={()=>recordGuideAction('management','complaintsReviewed')}>Investigate case</Link>}{clip&&<Link to={'/evidence?clip='+encodeURIComponent(clip.clip_key)} className="rounded border px-3 py-2 text-sm" onClick={()=>recordGuideAction('management','complaintsReviewed')}>Open camera evidence</Link>}</div>
  </article>})}
 </section>;
}