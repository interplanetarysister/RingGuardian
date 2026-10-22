import React from 'react';
import EvidencePlayer from '@/components/evidence/EvidencePlayer';
import {doorbellIdentity} from '../../../base44/shared/customerDoorbellProfiles.js';

// Compare the two RELEVANT roles. Expected-door clips always use a single location
// identity; a courier claim may be from another (fictional) entrance.
const ATTRS=[['door_number','Door number'],['door_color','Front door color'],['doormat','Doormat'],['facade','Siding / wall'],['fixture','Porch light'],['window','Side window']];
const COLORS='border-amber-500';
export default function DoorwayComparison({customerClip,claimedClip,trackingNumber,compact=false}){
 const left=customerClip?doorbellIdentity(customerClip):null;
 const right=claimedClip?doorbellIdentity(claimedClip):null;
 if(!customerClip)return <p className="rounded border p-3 text-sm">No customer doorstep sample is included. Do not infer a location mismatch.</p>;
 return <div className="space-y-3">
  <div className="grid gap-3 lg:grid-cols-2">
   <div className="rounded-xl border-[3px] border-teal-500 p-3 space-y-2">
    <h4 className="font-black text-sm">A. Customer's expected doorway</h4>
    <p className="text-xs text-muted-foreground">{customerClip.window_compressed?'2-hour fictional window accelerated into 8 seconds. NOT verified continuous footage.':'8-second synthetic event at the expected address.'}</p>
    <EvidencePlayer key={customerClip.clip_key} clip={customerClip} height="sm" trackingNumber={trackingNumber} cameraId={customerClip.camera_id} />
   </div>
   {claimedClip?<div className={`rounded-xl border-[3px] ${COLORS} p-3 space-y-2`}>
    <h4 className="font-black text-sm">B. Courier's claimed drop-off view</h4>
    <p className="text-xs text-muted-foreground">Separate illustrative eight-second carrier-view dramatization. This does not establish an actual courier took this video.</p>
    <EvidencePlayer key={claimedClip.clip_key} clip={claimedClip} height="sm" trackingNumber={trackingNumber} cameraId={claimedClip.camera_id} />
   </div>:<div className="rounded-xl border-2 border-dashed p-3 text-sm">No courier-view comparison exists for this sample package. Review the available footage and scan records.</div>}
  </div>
  {right&&<div className="overflow-auto rounded-xl border p-3">
   <h4 className="font-black text-sm">Visual address clues — simulated comparison</h4>
   <p className="my-1 text-xs text-muted-foreground">The drawings use stable address seeds. Use these differences to guide a review, not as verified photographic or geographic evidence.</p>
   <table className="w-full text-left text-xs sm:text-sm">
    <thead><tr><th className="p-2">Detail</th><th className="p-2">Customer doorway</th><th className="p-2">Claimed drop-off</th></tr></thead>
    <tbody>{ATTRS.map(([key,label])=><tr key={key} className={left[key]===right[key]?'':'bg-amber-500/10'}>
     <th scope="row" className="p-2 font-semibold">{label}</th><td className="p-2">{left[key]}</td><td className="p-2">{right[key]}{left[key]!==right[key]?' · differs':''}</td>
    </tr>)}</tbody>
   </table>
  </div>}
  {!compact&&<p className="text-xs text-muted-foreground">Actual future footage must include provider permission, camera timestamps, integrity/provenance checks, and a documented capture-gap assessment. Eight sampled seconds alone cannot rule out a delivery during a two-hour period.</p>}
 </div>;
}