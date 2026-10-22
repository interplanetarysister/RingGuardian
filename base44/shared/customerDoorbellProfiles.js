import {buildDemoWindowMotion} from './doorbellWindowMotion.js';

// Canonical fictional address profiles and time-window mapping. Both preview and server
// MUST use these helpers so the customer's doorway never changes between events.
export const WINDOW_REAL_SECONDS = 2 * 60 * 60;
export const DEMO_VIDEO_SECONDS = 8;
export const DEMO_CONSENT_NOTICE = 'Demo auto-share is fictional. Real Ring video needs account-level provider authorization, explicit recording and sharing consent, and a revocation control. Registration alone cannot grant Ring camera access.';

export const DOORBELL_SCENARIOS = {
 successful_delivery:{defaultEvent:'delivery',choices:[
  {eventKey:'delivery',scene:'doorbell_delivery',title:'Courier completes an 8-second doorstep drop-off',description:'Fictional 8-second courier video: enters carrying the package, puts it down, leaves the frame by second six, then the parcel remains for two seconds.',eventType:'delivery'}]},
 direct_handoff_no_scan:{defaultEvent:'handoff',choices:[
  {eventKey:'handoff',scene:'doorbell_handoff',title:'Courier hands the parcel directly to the recipient · no final scan',description:'Fictional eight-second doorbell-perspective handoff: a courier approaches carrying the parcel, a resident comes to the door, the parcel transfers directly into their hands, then the courier leaves. No package is placed on the doorstep, and no delivery scan is shown.',eventType:'delivery'}]},
 delivered_but_missing:{defaultEvent:'disputed_window',choices:[
  {eventKey:'disputed_window',scene:'doorbell_timelapse',title:'Your doorway · two-hour delivery window compressed to 8 seconds',description:'Fictional accelerated summary at the expected address. The parcel never appears in this dramatization. This is not a verified continuous Ring recording; missing frames or an empty sample cannot prove non-delivery.',eventType:'delivery'}]},
 stolen_after_delivery:{defaultEvent:'removal',choices:[
  {eventKey:'delivery',scene:'doorbell_delivery',title:'First event · courier leaves package at your door',description:'Eight-second courier arrival, set-down and exit followed by two seconds showing the parcel at the doorway.',eventType:'delivery'},
  {eventKey:'removal',scene:'doorbell_removal',title:'Second event · same doorway, later package removal',description:'The SAME physical doorway hours later. A separate fictional visitor picks up the unattended package. Identity and intent are not established.',eventType:'removal'}]},
 wrong_delivery_truck:{defaultEvent:null,choices:[],unavailable:'This package is still misrouted in the transport network. No doorstep footage can be attributed to this shipment.'},
 missing_hub_scan:{defaultEvent:null,choices:[],unavailable:'This parcel has an unresolved distribution-center scan. There is no doorstep arrival footage to attach.'}
};
export const doorbellChoices=s=>DOORBELL_SCENARIOS[s?.scenario_key]?.choices||[];
export const doorbellUnavailable=s=>DOORBELL_SCENARIOS[s?.scenario_key]?.unavailable||'No matching fictional doorstep event is available for this parcel.';
export const doorbellDefaultEvent=s=>DOORBELL_SCENARIOS[s?.scenario_key]?.defaultEvent||'';
export const customerDoorwayKey=s=>String(s?.expected_destination||s?.recipient_name||s?.tracking_number||'unknown-doorstep').trim().toLowerCase();
export const wrongDropoffDoorwayKey=s=>'FICTIONAL-OTHER-ADDRESS::'+String(s?.tracking_number||'unknown');
export function findDoorbellEvent(events,tracking,choice){
 if(!choice)return null;
 return (events||[]).filter(e=>e.tracking_number===tracking).find(e=>choice.eventType==='removal'?
  e.event_type==='exception'&&/removed from porch/i.test(e.event_label||''):
  e.event_type==='delivery')||null;
}
export function makeCustomerDoorbellClip(shipment,events,eventKey,window=null){
 const choice=doorbellChoices(shipment).find(c=>c.eventKey===eventKey);
 if(!choice)return null;
 const event=findDoorbellEvent(events,shipment.tracking_number,choice);
 const eventMs=Date.parse(event?.occurred_at||'');
 if(!Number.isFinite(eventMs))return null;
 const timelapse=choice.scene==='doorbell_timelapse';
 const windowStart=Date.parse(window?.start||''), windowEnd=Date.parse(window?.end||'');
 const validWindow=timelapse&&Number.isFinite(windowStart)&&Number.isFinite(windowEnd)&&windowEnd-windowStart===WINDOW_REAL_SECONDS*1000;
 const start=new Date(validWindow?windowStart:eventMs-(timelapse?WINDOW_REAL_SECONDS/2*1000:4000)).toISOString();
 const end=new Date(validWindow?windowEnd:eventMs+(timelapse?WINDOW_REAL_SECONDS/2*1000:4000)).toISOString();
 return {
  clip_key:'RING-DEMO-'+shipment.tracking_number+'-'+choice.eventKey,
  title:choice.title,scene:choice.scene,duration_seconds:DEMO_VIDEO_SECONDS,
  evidence_kind:'scene_reconstruction',camera_id:'SIM-CUSTOMER-DOORBELL',
  tracking_number:shipment.tracking_number,package_dimensions:shipment.dimensions||'',
  doorway_key:customerDoorwayKey(shipment),camera_view_role:'customer_expected_doorway',
  scenario_key:shipment.scenario_key,doorbell_event_key:choice.eventKey,
  recorded_start:start,recorded_end:end,
  window_compressed:timelapse,source_window_start:timelapse?start:'',source_window_end:timelapse?end:'',
  motion_events:timelapse?buildDemoWindowMotion(customerDoorwayKey(shipment),start):[],
  source_label:'FICTIONAL camera-angle scene illustration · NOT an authenticated Ring video',
  generated_sample:true,description:choice.description,
  evidence_provenance:timelapse?'sampled_two_hour_window_unverified':'fictional_event_reenactment'
 };
}
export function makeDeliveryComparisonClip(shipment,events){
 if(shipment?.scenario_key!=='delivered_but_missing')return null;
 const choice={eventType:'delivery'};
 const event=findDoorbellEvent(events,shipment.tracking_number,choice);
 const stamp=Date.parse(event?.occurred_at||'');
 if(!Number.isFinite(stamp))return null;
 return {
  clip_key:'SIM-COURIER-CLAIM-'+shipment.tracking_number,
  title:'Simulated courier claim: package placed at a DIFFERENT doorway',
  scene:'doorbell_delivery',duration_seconds:DEMO_VIDEO_SECONDS,evidence_kind:'scene_reconstruction',
  camera_id:'SIM-COURIER-PROOF',camera_view_role:'carrier_claimed_dropoff',
  tracking_number:shipment.tracking_number,package_dimensions:shipment.dimensions||'',
  doorway_key:wrongDropoffDoorwayKey(shipment),scenario_key:shipment.scenario_key,
  doorbell_event_key:'claimed_dropoff',recorded_start:new Date(stamp-4000).toISOString(),
  recorded_end:new Date(stamp+4000).toISOString(),window_compressed:false,
  source_label:'FICTIONAL COURIER DROP-OFF COMPARISON · NOT verified carrier/Ring video',
  generated_sample:true,evidence_provenance:'fictional_alternate_doorstep',description:
  'Illustrative OTHER address for the wrong-drop-off demo. Different entrance color, number, mat, window and porch fixtures help management identify clues. This clip is invented for the scenario, not authenticated delivery proof.'
 };
}
export function doorbellIdentity(clip){
 const key=clip?.doorway_key||clip?.tracking_number||'unknown';
 let h=2166136261;for(const ch of String(key))h=Math.imul(h^ch.charCodeAt(0),16777619);
 const n=h>>>0;
 const entry=['slate blue','forest green','warm gray','brick red'][n%4];
 const facade=n%4===0||n%4===3?'brick':'siding';
 const mat=['WELCOME','HELLO','HOME','PLAIN'][Math.floor(n/4)%4];
 const light=n%2===0?'black sconce':'bronze lantern';
 return {key,door_number:String(1100+n%899),door_color:entry,facade,doormat:mat,fixture:light,window:'left side window',hash:n};
}