import {loadBoard,eventsFor} from '@/lib/board';
import {ops} from '@/lib/demo';
export const ASSISTANT_TOOLS=['findPackage','getPackageHistory','getLastVerifiedHandoff','listActiveCameras','getCameraEvents','findScanExceptions','openEvidenceClip','createInvestigation','getInvestigationStatus','getLoadingManifest','validatePackageLoading','showVehicleActivity','explainCurrentScreen','navigateToFeature'];
export function validateLoading(shipment,events,rules={}){
 const latest=events.filter(e=>e.scan_status==='confirmed').at(-1);
 const loading=events.filter(e=>e.event_type==='loading').at(-1);
 const expected=rules.expectedVehicle||null,observed=loading?.vehicle||null;
 const checks={package_data:shipment?.tracking_number?100:0,scan_confirmation:loading?(loading.scan_status==='confirmed'?100:0):null,
 vehicle_match:expected&&observed?(expected===observed?100:0):null,
 camera_evidence:loading?(loading.sync_status==='matched'&&!!loading.video_clip_key?100:0):null};
 const reasons=[];
 if(!loading)reasons.push('No loading scan is recorded.');
 else if(loading.scan_status!=='confirmed')reasons.push('Loading scan is incomplete or unconfirmed.');
 if(checks.vehicle_match===0)reasons.push('Observed vehicle differs from the selected manifest.');
 if(checks.camera_evidence===0)reasons.push('No uniquely matched loading capture.');
 if(shipment.discrepancy_flag)reasons.push(shipment.discrepancy_reason||'Package has an unresolved exception.');
 return {checks,reasons,lastVerified:latest||null,expected,observed,status:reasons.length?'Review required':Object.values(checks).some(v=>v===null)?'Pending manifest data':'Checks complete',method:'Binary record-completeness checks: 100 means the named record check passed, 0 means it failed, unavailable means there is not enough data. These percentages are not vision confidence.'};
}
export async function assistantAnswer(text,{tracking='',path='/',confirm=false}={}){
 const q=text.trim().toLowerCase(),board=await loadBoard();
 const digits=text.match(/\d{4,}/)?.[0];
 const shipment=board.shipments.find(s=>digits&&s.tracking_number.endsWith(digits))||board.shipments.find(s=>s.tracking_number===tracking);
 const navigate=(reply,to,tool)=>({reply,to,tool,tracking:shipment?.tracking_number||tracking});
 if(/incomplete|exceptions|flagged packages/.test(q))return navigate(board.shipments.filter(s=>s.discrepancy_flag).map(s=>s.tracking_number+': '+s.discrepancy_reason).join('\n')||'No flagged packages in this demo session.','/validation','findScanExceptions');
 if(/cameras|camera online/.test(q)&&!shipment)return navigate(board.cameras.filter(c=>c.status==='online'||c.status==='recording').map(c=>c.device_id+' at '+c.facility).join(', ')||'Open Cameras to inspect each device status.','/cameras','listActiveCameras');
 if(/this screen|what does|explain/.test(q))return navigate('You are on '+(path==='/'?'the home page':path.replaceAll('/',' '))+'. Use Packages for shipment histories, Live events for a simulated event, Scan validation for missing checks, and Cases to record findings.',path,'explainCurrentScreen');
 if(/live|simulate|demonstration/.test(q))return navigate('Open simulated live events, choose a package story and press Start live simulation.','/live-events','navigateToFeature');
 if(/scan validation|manifest|truck|vehicle/.test(q)&&!shipment)return navigate('Choose a package in Scan validation. Select its expected vehicle to compare the manifest with the loading scan. Missing data stays unavailable.','/validation','getLoadingManifest');
 if(!shipment)return {reply:digits?'That package is not in your current demo session. Open Packages to choose a fictional shipment.':'Enter a package number or its last four digits. You can also ask about incomplete scans, cameras or this screen.',to:'/packages',tool:'findPackage',tracking};
 const events=eventsFor(board,shipment.tracking_number),last=events.filter(e=>e.scan_status==='confirmed').at(-1),capture=[...events].reverse().find(e=>e.video_clip_key);
 let reply=shipment.tracking_number+': '+shipment.status.replaceAll('_',' ')+'. ';
 if(/create|open.*investigation|investigate/.test(q)){
  if(!confirm)return {reply:'Open a demo investigation for '+shipment.tracking_number+'? This writes a case and audit record.',tool:'createInvestigation',needsConfirmation:true,tracking:shipment.tracking_number};
  const res=await ops({action:'flagDiscrepancy',tracking_number:shipment.tracking_number,reason:'Investigation requested through the conversational guide. Review the available evidence before reaching a conclusion.'});
  if(!res?.ok)throw Error(res?.error||'Case could not be saved.');
  return navigate('The demo case was saved: '+res.case_number,'/investigations/'+res.case_number,'createInvestigation');
 }
 if(/recording|video|footage|evidence/.test(q))return navigate(reply+(capture?'The most recent linked capture is '+capture.video_clip_key+'. It is labeled '+capture.evidence_source+'.':'No package-specific capture is available. Missing footage does not prove non-delivery.'),'/packages/'+shipment.tracking_number,'openEvidenceClip');
 if(/flag|why|missing|review|next/.test(q))return navigate(reply+(shipment.discrepancy_reason||'No discrepancy is recorded.')+' Check the last verified handoff, expected loading vehicle, incoming vehicle and drop-off location before drawing a conclusion.','/packages/'+shipment.tracking_number,'findScanExceptions');
 if(/truck|vehicle|scanned|loading/.test(q)){const v=validateLoading(shipment,events);return navigate(reply+v.status+'. '+v.reasons.join(' ')+' Observed loading vehicle: '+(v.observed||'not recorded')+'. Expected manifest vehicle must be supplied.','/validation','validatePackageLoading');}
 if(/handled|worker|handoff|where|last/.test(q))reply+=last?'Last confirmed record: '+last.event_label+' at '+last.facility+' on '+last.occurred_at+'. Worker reference: '+(last.employee_id||'not recorded')+'. A last scan does not establish the current physical location.':'No confirmed handoff is available.';
 else reply+=shipment.scenario_summary;
 return navigate(reply+' All these records are fictional demo data.','/packages/'+shipment.tracking_number,'getLastVerifiedHandoff');
}