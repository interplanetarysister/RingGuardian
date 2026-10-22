/**
 * Evidence comparison is independent of React, carrier credentials and UI choices.
 * It must never treat proximity alone as proof of correct delivery.
 */
export const SAMPLE_ID = 'TBA304711915063';
export const SIMULATED_EVENTS = Object.freeze([
  { id:'dock-start',trackingNumber:SAMPLE_ID,at:'2026-10-20T08:14:02Z',source:'wearable',cameraId:'RG-W01',employeeId:'DEMO-W1',locationId:'DOCK-04',kind:'camera-start',simulation:true },
  { id:'dock-scan',trackingNumber:SAMPLE_ID,at:'2026-10-20T08:14:18Z',source:'scanner',cameraId:'RG-W01',deviceId:'SC-17',locationId:'DOCK-04',kind:'accepted-scan',simulation:true },
  { id:'truck-load',trackingNumber:SAMPLE_ID,at:'2026-10-20T08:15:09Z',source:'wearable',cameraId:'RG-W01',truckId:'TR-218',locationId:'DOCK-04',kind:'package-loaded',simulation:true },
  { id:'driver-handoff',trackingNumber:SAMPLE_ID,at:'2026-10-20T10:21:31Z',source:'wearable',cameraId:'RG-D07',truckId:'TR-218',routeId:'42',kind:'driver-custody',simulation:true },
  { id:'gps-stop',trackingNumber:SAMPLE_ID,at:'2026-10-20T10:37:41Z',source:'carrier-tracking-simulator',routeId:'42',kind:'vehicle-stop',simulation:true },
  { id:'dropoff',trackingNumber:SAMPLE_ID,at:'2026-10-20T10:38:05Z',source:'wearable',cameraId:'RG-D07',routeId:'42',kind:'dropoff-observed',simulation:true },
]);
export function normalizeAddress(value) {
  return String(value||'').normalize('NFKC').trim().toUpperCase().replace(/[.,#]/g,' ').replace(/\s+/g,' ');
}
export function classifyDelivery({expectedAddress,observedAddress,trackingNumber,events,locationAccuracyMeters,visualAddressConfirmed=false}) {
  const reasons=[];
  if(!trackingNumber || !Array.isArray(events)) return {verdict:'needs-review',reasons:['Tracking number or evidence events missing'],confidence:'insufficient'};
  const linked=events.filter(e=>e.trackingNumber===trackingNumber && e.simulation===true).sort((a,b)=>a.at.localeCompare(b.at));
  for(const kind of ['accepted-scan','package-loaded','driver-custody','dropoff-observed']){
    if(!linked.some(e=>e.kind===kind)) reasons.push('Missing '+kind+' evidence');
  }
  const scan=linked.find(e=>e.kind==='accepted-scan'),load=linked.find(e=>e.kind==='package-loaded'),handoff=linked.find(e=>e.kind==='driver-custody'),drop=linked.find(e=>e.kind==='dropoff-observed');
  if(scan&&load&&scan.at>load.at)reasons.push('Scan occurs after loading');
  if(load&&handoff&&load.at>handoff.at)reasons.push('Custody precedes loading');
  if(handoff&&drop&&handoff.at>drop.at)reasons.push('Drop-off precedes custody');
  if(load&&handoff&&load.truckId!==handoff.truckId)reasons.push('Truck assignment mismatch');
  if(handoff&&drop&&handoff.routeId!==drop.routeId)reasons.push('Route assignment mismatch');
  const expected=normalizeAddress(expectedAddress),observed=normalizeAddress(observedAddress);
  if(!expected||!observed)reasons.push('Unverified delivery address');
  const different=expected&&observed&&expected!==observed;
  if(different)reasons.push('Observed address differs from delivery address');
  if(!visualAddressConfirmed)reasons.push('Visual address identification not confirmed by reviewer');
  if(locationAccuracyMeters==null || !Number.isFinite(locationAccuracyMeters)) reasons.push('GPS accuracy unavailable');
  else if(locationAccuracyMeters>30)reasons.push('GPS location not precise enough to confirm doorstep');
  const integrityProblems=reasons.filter(r=>r.startsWith('Missing ')||r.includes('precedes')||r.includes('after loading')||r.includes('assignment mismatch'));
  if(integrityProblems.length)return {verdict:'needs-review',reasons,confidence:'insufficient',linkedEvents:linked.length};
  if(different)return {verdict:'wrong-address-suspected',reasons,confidence:'requires-human-review',linkedEvents:linked.length};
  if(!visualAddressConfirmed || !expected || !observed)return {verdict:'needs-review',reasons,confidence:'insufficient',linkedEvents:linked.length};
  return {verdict:'address-match-supported',reasons,confidence:'human-reviewed-simulation',linkedEvents:linked.length};
}
export function buildEvidenceReport({expectedAddress,observedAddress,trackingNumber,events,notes,visualAddressConfirmed,locationAccuracyMeters}) {
 const result=classifyDelivery({expectedAddress,observedAddress,trackingNumber,events,visualAddressConfirmed,locationAccuracyMeters});
 return {schemaVersion:1,simulation:true,carrierSubmitted:false,deviceConnected:false,trackingConnected:false,trackingNumber,expectedAddress,observedAddress,locationAccuracyMeters,visualAddressConfirmed,reviewerNotes:String(notes||''),decision:result,events:events.filter(e=>e.trackingNumber===trackingNumber),exportedAt:new Date().toISOString()};
}
