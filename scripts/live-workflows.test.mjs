import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const moduleText=async code=>import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const live=await moduleText(await fs.readFile('base44/shared/liveScenarios.ts','utf8'));
test('five distinct scenarios keep timestamp order and package identity',()=>{
 assert.equal(live.LIVE_SCENARIOS.length,5);assert.equal(new Set(live.LIVE_SCENARIOS.map(s=>s.tracking)).size,5);
 for(const s of live.LIVE_SCENARIOS){const report=live.evidenceReport(s,{id:'run',started_at:'2026-10-21T12:00:00Z'});assert.equal(report.tracking_number,s.tracking);assert.ok(report.events.every((e,i)=>i===0||e.offset_seconds>report.events[i-1].offset_seconds));assert.ok(report.events.every(e=>Date.parse(e.timestamp)>=Date.parse(report.started_at)&&Date.parse(e.timestamp)<=Date.parse(report.ended_at)));assert.equal(live.scenarioAt(s.key,-1).seconds,0);assert.equal(live.scenarioAt(s.key,999).complete,true);}
});
test('wrong-address evidence shows empty expected porch, not successful delivery',()=>{const s=live.liveScenario('delivered_but_missing');assert.equal(s.scene,'porch_quiet');assert.equal(s.issue,true);assert.match(s.finding,/absence.*does not prove/);assert.equal(live.scenarioAt(s.key,4).events.length,1);});
let toolsText=await fs.readFile('src/lib/assistantTools.js','utf8');toolsText=toolsText.replace(/^import .*;\n/gm,'');toolsText=toolsText.slice(0,toolsText.indexOf('export async function assistantAnswer'));
const validation=await moduleText(toolsText);
test('missing manifest and missing scans stay unknown, not fabricated percentages',()=>{const r=validation.validateLoading({tracking_number:'TEST'},[]);assert.equal(r.checks.vehicle_match,null);assert.equal(r.checks.scan_confirmation,null);assert.equal(r.status,'Review required');});
test('wrong truck and incomplete scan cannot pass loading validation',()=>{const r=validation.validateLoading({tracking_number:'TEST'},[{event_type:'loading',scan_status:'failed',vehicle:'TRUCK-2',sync_status:'matched',video_clip_key:'CLIP'}],{expectedVehicle:'TRUCK-1'});assert.equal(r.checks.scan_confirmation,0);assert.equal(r.checks.vehicle_match,0);assert.equal(r.status,'Review required');});
test('all supplied checks passing yields complete, not a probability claim',()=>{const r=validation.validateLoading({tracking_number:'TEST'},[{event_type:'loading',scan_status:'confirmed',vehicle:'TRUCK-1',sync_status:'matched',video_clip_key:'CLIP'}],{expectedVehicle:'TRUCK-1'});assert.equal(r.status,'Checks complete');assert.match(r.method,/not vision confidence/);});
const data={};let nextId=0;const store=new Proxy({},{get:(_,name)=>{data[name]??=[];return {filter:async q=>data[name].filter(r=>Object.entries(q).every(([k,v])=>r[k]===v)),get:async id=>data[name].find(r=>r.id===id),create:async r=>{const item={...r,id:'id-'+(++nextId)};data[name].push(item);return item;},update:async(id,patch)=>{const item=data[name].find(r=>r.id===id);Object.assign(item,patch);return item;},bulkCreate:async rows=>Promise.all(rows.map(r=>store[name].create(r)))};}});
const access=await moduleText(await fs.readFile('base44/shared/access.ts','utf8'));
const windowMotion=await moduleText(await fs.readFile('base44/shared/doorbellWindowMotion.js','utf8'));
globalThis.__testWindowMotion=windowMotion;
const doorbell=await moduleText('const {buildDemoWindowMotion}=globalThis.__testWindowMotion;\n'+(await fs.readFile('base44/shared/customerDoorbellProfiles.js','utf8')).replace(/^import .*;\n/gm,''));
globalThis.__testDeps={...access,...live,...doorbell,synchronizeEvent:()=>({sync_status:'matched'}),SYNC_STATUS:{},createClientFromRequest:()=>({entities:store,asServiceRole:{entities:store}})};
let entry=await fs.readFile('base44/functions/demoOps/entry.ts','utf8');entry=entry.replace(/^import .*;\n/gm,'');entry='const {createClientFromRequest,synchronizeEvent,SYNC_STATUS,readStore,writeStore,recordActivity,listAll,badRequest,nowIso,LIVE_SCENARIOS,evidenceReport,makeCustomerDoorbellClip,makeDeliveryComparisonClip,doorbellDefaultEvent,doorbellIdentity}=globalThis.__testDeps;\n'+entry;
const backend=(await moduleText(entry)).default;
const invoke=async body=>{const res=await backend(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}));return {status:res.status,...await res.json()};};
test('backend rejects premature saves and unknown scenarios',async()=>{const base={demo_session_id:'session-test',action:'saveLiveScenario',run_id:'00000000-0000-4000-a000-000000000001',started_at:new Date().toISOString()};assert.equal((await invoke({...base,scenario_key:'bad'})).status,400);assert.equal((await invoke({...base,scenario_key:'successful_delivery'})).status,400);});
test('backend persists the matching clip, event and case; retry does not duplicate',async()=>{
 const scenario=live.liveScenario('delivered_but_missing');await store.Shipment.create({demo_session_id:'session-test',tracking_number:scenario.tracking,current_facility:'SIM-HUB'});
 const body={demo_session_id:'session-test',action:'saveLiveScenario',scenario_key:scenario.key,run_id:'00000000-0000-4000-a000-000000000002',started_at:new Date(Date.now()-30000).toISOString(),completed:true};
 const first=await invoke(body);assert.equal(first.ok,true);assert.equal(first.verified,true);assert.ok(first.case_number);assert.equal(data.VideoClip[0].scene,'porch_quiet');assert.equal(first.report.started_at,body.started_at);
 const again=await invoke(body);assert.equal(again.event_id,first.event_id);assert.equal(data.VideoClip.length,1);assert.equal(data.ScanEvent.length,1);assert.equal(data.Investigation.length,1);
});
test('a different session cannot reuse the previous session package or evidence',async()=>{const res=await invoke({demo_session_id:'other-session',action:'saveLiveScenario',scenario_key:'delivered_but_missing',run_id:'00000000-0000-4000-a000-000000000002',started_at:new Date(Date.now()-30000).toISOString(),completed:true});assert.equal(res.status,400);assert.equal(data.VideoClip.length,1);});

test('customer reports are submitted to internal management, with a matching synthetic doorbell scene and optional nickname',async()=>{
 const count=data.CustomerComplaint?.length||0;
 const demo_session_id='session-test';
 const shipment=data.Shipment.find(s=>s.demo_session_id===demo_session_id);
 assert.ok(shipment);
 const nick=await invoke({demo_session_id,action:'nameCustomerPackage',tracking_number:shipment.tracking_number,package_nickname:'Birthday present'});
 assert.equal(nick.ok,true);
 assert.equal(nick.shipment.package_nickname,'Birthday present');
 await store.Shipment.update(shipment.id,{scenario_key:'delivered_but_missing',dimensions:'16 x 12 x 8 in'});
 await store.ScanEvent.create({demo_session_id,tracking_number:shipment.tracking_number,event_type:'delivery',event_label:'Carrier delivery confirmation recorded',occurred_at:'2026-10-20T16:41:44.000Z'});
 const beforeClips=data.VideoClip.length;
 const body={demo_session_id,action:'submitCustomerComplaint',submission_key:'customer-report-unique-0001',tracking_number:shipment.tracking_number,issue:'Not received',detail:'No handoff appears in this simulated time interval.',include_simulated_doorbell:true,simulated_sharing_consent:true};
 const result=await invoke(body);
 assert.equal(result.ok,true);
 assert.equal(result.report.external_submission,false);
 assert.equal(result.report.evidence_received,true);
 assert.equal(result.report.package_nickname,'Birthday present');
 assert.equal(result.report.status,'submitted_to_management');
 assert.equal(data.VideoClip.length,beforeClips+2);
 const customerClip=data.VideoClip.find(c=>c.clip_key===result.report.evidence_clip_key);
 const courierClip=data.VideoClip.find(c=>c.clip_key===result.report.comparison_clip_key);
 assert.equal(customerClip.scene,'doorbell_timelapse');
 assert.equal(customerClip.tracking_number,shipment.tracking_number);
 assert.equal(customerClip.duration_seconds,8);
 assert.equal(customerClip.window_compressed,true);
 assert.equal(Date.parse(customerClip.source_window_end)-Date.parse(customerClip.source_window_start),7200000);
 assert.equal(customerClip.recorded_start,'2026-10-20T15:41:44.000Z');
 assert.equal(customerClip.generated_sample,true);
 assert.equal(courierClip.scene,'doorbell_delivery');
 assert.equal(courierClip.tracking_number,shipment.tracking_number);
 assert.notEqual(courierClip.doorway_key,customerClip.doorway_key);
 assert.notEqual(doorbell.doorbellIdentity(courierClip).door_number,doorbell.doorbellIdentity(customerClip).door_number);
 assert.ok(data.Investigation.some(c=>c.case_number===result.case_number && c.tracking_number===shipment.tracking_number));
 assert.equal(data.CustomerComplaint.length,count+1);
 const duplicate=await invoke(body);
 assert.equal(duplicate.ok,true);
 assert.equal(duplicate.report.report_number,result.report.report_number);
 assert.equal(data.CustomerComplaint.length,count+1);
 const other=await invoke({...body,demo_session_id:'other-session',submission_key:'customer-report-other-0002'});
 assert.equal(other.status,400);
 assert.equal(data.CustomerComplaint.length,count+1);
});


test('customer doorbell events preserve each package scenario and timestamp',async()=>{
 const sId='session-scenario';
 const available=[
  {tracking_number:'TBA-DELIVERED-0001',scenario_key:'successful_delivery',dimensions:'12 x 9 x 4 in',event_type:'delivery',event_label:'Delivery scan at recipient address',occurred_at:'2026-10-20T11:12:07Z',expected:'doorbell_delivery'},
  {tracking_number:'TBA-REMOVAL-0002',scenario_key:'stolen_after_delivery',dimensions:'10 x 8 x 3 in',event_type:'exception',event_label:'Parcel removed from porch after delivery',occurred_at:'2026-10-20T17:48:07Z',expected:'doorbell_removal'}
 ];
 for(const row of available){
  await store.Shipment.create({demo_session_id:sId,tracking_number:row.tracking_number,scenario_key:row.scenario_key,dimensions:row.dimensions});
  await store.ScanEvent.create({demo_session_id:sId,tracking_number:row.tracking_number,event_type:row.event_type,event_label:row.event_label,occurred_at:row.occurred_at});
  const eventKey=row.expected==='doorbell_removal'?'removal':'delivery';
  const result=await invoke({demo_session_id:sId,action:'submitCustomerComplaint',tracking_number:row.tracking_number,issue:'Other delivery problem',detail:'Check the matching simulated camera event.',submission_key:'demo-'+eventKey+'-'+row.tracking_number,include_simulated_doorbell:true,simulated_sharing_consent:true,doorbell_event_key:eventKey});
  assert.equal(result.ok,true);
  assert.equal(data.VideoClip.at(-1).scene,row.expected);
  assert.equal(data.VideoClip.at(-1).tracking_number,row.tracking_number);
  assert.equal(data.VideoClip.at(-1).duration_seconds,8);
  assert.equal(data.VideoClip.at(-1).recorded_start,new Date(Date.parse(row.occurred_at)-4000).toISOString());
 }
 const missing=await store.Shipment.create({demo_session_id:sId,tracking_number:'TBA-NOT-ARRIVED-0003',scenario_key:'wrong_delivery_truck'});
 const forbidden=await invoke({demo_session_id:sId,action:'submitCustomerComplaint',tracking_number:missing.tracking_number,issue:'Not received',submission_key:'missing-porch-event-0003',include_simulated_doorbell:true,simulated_sharing_consent:true});
 assert.equal(forbidden.status,400);
 const accepted=await invoke({demo_session_id:sId,action:'submitCustomerComplaint',tracking_number:missing.tracking_number,issue:'Not received',submission_key:'missing-no-footage-0004',include_simulated_doorbell:false});
 assert.equal(accepted.ok,true);assert.equal(accepted.report.evidence_received,false);
});

test('multiple events at one address use one stable doorway and separate event times',()=>{
 const shipment={tracking_number:'SAMPLE-ONE',expected_destination:'44 Sample Place',scenario_key:'stolen_after_delivery',dimensions:'12 x 8 x 4'};
 const other={...shipment,tracking_number:'SAMPLE-TWO'};
 const events=[
  {tracking_number:'SAMPLE-ONE',event_type:'delivery',occurred_at:'2026-10-20T12:00:00Z'},
  {tracking_number:'SAMPLE-ONE',event_type:'exception',event_label:'Parcel removed from porch after delivery',occurred_at:'2026-10-20T17:48:00Z'}
 ];
 const delivery=doorbell.makeCustomerDoorbellClip(shipment,events,'delivery');
 const removal=doorbell.makeCustomerDoorbellClip(shipment,events,'removal');
 assert.equal(delivery.doorway_key,removal.doorway_key);
 assert.deepEqual(doorbell.doorbellIdentity(delivery),doorbell.doorbellIdentity(removal));
 assert.equal(delivery.duration_seconds,8);assert.equal(removal.duration_seconds,8);
 assert.equal(Date.parse(removal.recorded_start)-Date.parse(delivery.recorded_start),5*3600000+48*60000);
 const otherClip=doorbell.makeCustomerDoorbellClip(other,[{...events[0],tracking_number:'SAMPLE-TWO'}],'delivery');
 assert.equal(otherClip.doorway_key,delivery.doorway_key); // One address => one fixed door, even for two parcels.
});

test('demo sharing consent is required and management clues reach linked investigation',async()=>{
 const report=data.CustomerComplaint.find(r=>r.comparison_clip_key);
 assert.ok(report);
 const rejected=await invoke({demo_session_id:report.demo_session_id,action:'submitCustomerComplaint',tracking_number:report.tracking_number,issue:'Not received',submission_key:'consent-negative-1234',include_simulated_doorbell:true,simulated_sharing_consent:false});
 assert.equal(rejected.status,400);
 const bad=await invoke({demo_session_id:report.demo_session_id,action:'reviewDeliveryLocation',report_number:report.report_number,comparison_verdict:'guaranteed_theft',investigation_notes:'Could be there'});
 assert.equal(bad.status,400);
 const cross=await invoke({demo_session_id:'other-session',action:'reviewDeliveryLocation',report_number:report.report_number,comparison_verdict:'possible_location_mismatch',investigation_notes:'Different door'});
 assert.equal(cross.status,400);
 const good=await invoke({demo_session_id:report.demo_session_id,action:'reviewDeliveryLocation',report_number:report.report_number,comparison_verdict:'possible_location_mismatch',identifying_factors:['door_number','doormat','door_color'],investigation_notes:'Alternate claimed drop-off view has a different number and mat; verify carrier route and original recordings.'});
 assert.equal(good.ok,true);
 assert.equal(good.report.status,'under_review');
 assert.deepEqual(good.report.identifying_factors,['door_number','doormat','door_color']);
 assert.match(data.Investigation.find(c=>c.case_number===good.case_number).findings,/different number and mat/);
 assert.equal(data.Investigation.find(c=>c.case_number===good.case_number).status,'investigating');
});

test('two-hour customer-selected window survives the preview-to-management boundary',async()=>{
 const sId='window-session',tracking_number='TBA-DEMO-WINDOW-008';
 await store.Shipment.create({demo_session_id:sId,tracking_number,scenario_key:'delivered_but_missing',expected_destination:'99 Window Ct',dimensions:'8 x 9 x 4'});
 await store.ScanEvent.create({demo_session_id:sId,tracking_number,event_type:'delivery',event_label:'Carrier delivery claimed',occurred_at:'2026-10-20T15:00:00Z'});
 const start='2026-10-20T14:20:00.000Z',end='2026-10-20T16:20:00.000Z';
 const base={demo_session_id:sId,action:'submitCustomerComplaint',tracking_number,issue:'Wrong address',submission_key:'twohour-demo-unique-123456',include_simulated_doorbell:true,simulated_sharing_consent:true,reported_window_start:start,reported_window_end:end};
 const good=await invoke(base);
 assert.equal(good.ok,true);
 assert.equal(good.report.reported_window_start,start);
 const clip=data.VideoClip.find(c=>c.clip_key===good.report.evidence_clip_key);
 assert.equal(clip.source_window_start,start);
 assert.equal(clip.source_window_end,end);
 assert.equal(clip.duration_seconds,8);
 const bad=await invoke({...base,submission_key:'bad-threehour-unique-1234',reported_window_end:'2026-10-20T17:20:00.000Z'});
 assert.equal(bad.status,400);
});
test('fictional sharing preferences are saved by package and server-enforced',async()=>{
 const sId='consent-session',tracking_number='TBA-CONSENT-0007';
 await store.Shipment.create({demo_session_id:sId,tracking_number,scenario_key:'successful_delivery',expected_destination:'17 Sample Circle'});
 await store.ScanEvent.create({demo_session_id:sId,tracking_number,event_type:'delivery',event_label:'Delivered',occurred_at:'2026-10-20T13:00:00Z'});
 const disabled=await invoke({demo_session_id:sId,action:'setCustomerDemoCameraConsent',tracking_number,enabled:false});
 assert.equal(disabled.ok,true);assert.equal(disabled.provider_authorized,false);
 const req={demo_session_id:sId,action:'submitCustomerComplaint',tracking_number,issue:'Other delivery problem',submission_key:'consent-optout-0000001',include_simulated_doorbell:true,simulated_sharing_consent:true};
 assert.equal((await invoke(req)).status,400);
 const none=await invoke({...req,include_simulated_doorbell:false});
 assert.equal(none.ok,true);assert.equal(none.report.evidence_received,false);
 const enabled=await invoke({demo_session_id:sId,action:'setCustomerDemoCameraConsent',tracking_number,enabled:true});
 assert.equal(enabled.ok,true);
 const yes=await invoke({...req,submission_key:'consent-optin-0000002'});
 assert.equal(yes.ok,true);assert.equal(yes.report.evidence_received,true);
});

test('the complete fictional two-hour camera window retains diverse movement instead of showing only a blank porch',()=>{
 const clips=windowMotion.buildDemoWindowMotion('same expected doorway','2026-10-20T15:00:00.000Z');
 assert.equal(clips.length,4);
 assert.equal(new Set(clips.map(c=>c.type)).size,4);
 assert.deepEqual(clips,windowMotion.buildDemoWindowMotion('same expected doorway','2026-10-20T15:00:00.000Z'));
 assert.ok(clips.every(c=>c.source_offset_seconds>0&&c.source_offset_seconds+c.source_duration_seconds<=7200));
 assert.ok(clips.every(c=>c.playback_end_seconds>c.playback_start_seconds));
 for(const c of clips){
  const at=windowMotion.activeWindowMotion(clips,(c.playback_start_seconds+c.playback_end_seconds)/2);
  assert.equal(at.type,c.type);
  assert.ok(at.progress>0&&at.progress<1);
  assert.ok(Math.abs(windowMotion.sourceOffsetAtPlayback(clips,c.playback_start_seconds)-c.source_offset_seconds)<.00001);
  assert.ok(Math.abs(windowMotion.sourceOffsetAtPlayback(clips,c.playback_end_seconds)-(c.source_offset_seconds+c.source_duration_seconds))<.00001);
 }
 assert.equal(windowMotion.sourceOffsetAtPlayback(clips,0),0);
 assert.equal(windowMotion.sourceOffsetAtPlayback(clips,8),7200);
});
test('the simulated camera clip carries all motion identifiers through complaint submission',async()=>{
 const report=data.CustomerComplaint.find(r=>r.reported_window_start);
 assert.ok(report);
 const clip=data.VideoClip.find(c=>c.clip_key===report.evidence_clip_key);
 assert.ok(clip);
 assert.equal(clip.scene,'doorbell_timelapse');
 assert.equal(clip.motion_events.length,4);
 assert.deepEqual(clip.motion_events,windowMotion.buildDemoWindowMotion(clip.doorway_key,clip.source_window_start));
});