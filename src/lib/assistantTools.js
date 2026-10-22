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
 const q=text.trim().toLowerCase().replace(/[?!.,]/g,' ').replace(/\s+/g,' '),board=await loadBoard();
 const says=(...terms)=>terms.some(term=>q.includes(term));
 const digits=text.match(/\d{4,}/)?.[0];
 const shipment=board.shipments.find(s=>digits&&s.tracking_number.endsWith(digits))||board.shipments.find(s=>s.tracking_number===tracking);
 const navigate=(reply,to,tool)=>({reply,to,tool,tracking:shipment?.tracking_number||tracking});
 // Recovery questions take precedence over generic 'resolve' and 'case' navigation.
 if(/(resolv|clos|finish|complet).*(too (soon|early)|by (mistake|accident)|accidentally|premature|wrongly)|\b(reopen|re-open|undo (a |the )?(resolut|clos)|reverse (a |the )?clos)/.test(q)){
   const match=board.cases.find(c=>shipment&&c.tracking_number===shipment.tracking_number);
   return navigate('If you marked a problem resolved before checking everything, open Cases and find the case under Resolved. Review its resolution and evidence. This demo currently locks resolved cases against edits, so I cannot promise a Reopen button. Record the new discrepancy in a new investigation if appropriate, preserving the original audit trail; contact an authorized manager for corrections to a closed record. Do not erase the original finding. '+(match?'Related demo case: '+match.case_number+'.':''),match?'/investigations/'+match.case_number:'/investigations','explainCaseRecovery');
 }
 const pages=[
  {path:'/dashboard',names:['dashboard','command center','overview'],what:'Command center summarizes shipment status, exceptions, and operations so staff can see what needs attention.'},
  {path:'/packages',names:['packages page','shipment list','package list','my deliveries'],what:'Packages shows the demo shipments and opens their histories, status and evidence.'},
  {path:'/live-events',names:['live events','simulation','sample footage','demo scenarios'],what:'Live events plays fictional delivery scenarios alongside their timestamps and package events, making mismatches easier to see.'},
  {path:'/validation',names:['scan validation','validation','loading check'],what:'Scan validation compares recorded loading scans and manifests to identify missing or contradictory confirmation.'},
  {path:'/investigations',names:['cases','investigations','case management'],what:'Cases collects package discrepancies and evidence so the investigation has a trackable record.'},
  {path:'/alerts',names:['alerts','notifications'],what:'Alerts surfaces exceptions that may need review.'},
  {path:'/scanners',names:['scanners','scanning'],what:'Scanners shows scanner information and package handoff confirmations.'},
  {path:'/cameras',names:['cameras','camera page'],what:'Cameras shows available demo devices and their recorded status; simulated cameras are not a verified live Ring connection.'},
  {path:'/evidence',names:['video evidence','evidence page','recordings','clips'],what:'Video evidence helps connect a recorded camera interval to the package events and report it supports.'},
  {path:'/logistics',names:['logistics','grid','spreadsheet'],what:'Logistics grid organizes package records so teams can review and update demo operational details.'},
  {path:'/ai-tracking',names:['hands-free','ai tracking','wearable'],what:'Hands-free preview demonstrates a proposed camera-assisted scanning workflow. It is a simulation, not deployed wearable hardware.'},
  {path:'/activity',names:['activity history','audit trail'],what:'Activity history helps trace recorded workflow changes and review what happened.'},
  {path:'/ring',names:['ring integration','ring camera','ring connection'],what:'Ring integration explains the planned camera connection. Official live Ring camera pairing is not yet verified.'},
  {path:'/amazon',names:['amazon integration','amazon account'],what:'Amazon integration shows the planned relationship with Amazon shipping services; production account authorization is not verified.'},
  {path:'/alexa',names:['alexa voice','alexa page','alexa integration'],what:'Alexa voice demonstrates package announcements using browser speech and an MCP demo endpoint; official Alexa+ voice registration remains unverified.'},
  {path:'/interop',names:['package p i','package pi','evidence request','sharing evidence'],what:'Package P.I. demonstrates review and authorization of an evidence-sharing request before information is released.'},
  {path:'/guided-demo',names:['guided demo','walkthrough page','tour'],what:'Walkthrough guides you through evidence, scans and recovery using fictional events, narration and on-screen highlighting.'},
  {path:'/connections',names:['connections','integrations'],what:'Connections is where supported service integration states can be inspected; listed services are not automatically linked.'},
  {path:'/settings',names:['settings','preferences'],what:'Settings contains application configuration and controls available to your role.'},
  {path:'/about',names:['about','purpose page'],what:'About explains the problem Ring Guardian aims to solve and the difference between available demonstrations and planned integrations.'},
  {path:'/view/customer',names:['customer portal','customer view'],what:'Customer view is a separate tour for recipients to understand their own delivery and evidence requests.'},
  {path:'/view/management',names:['management portal','management view'],what:'Management view introduces the warehouse and delivery evidence workflow using simulated equipment and records.'}
 ];
 const platformQuestion=/\b(platform|app|application|ring guardian|this system|product|service)\b/.test(q);
 const valueQuestion=/\b(purpose|benefit|benefits|advantage|useful|easier|save time|why use|what is it for|what does it do|help people|solve|capabilities|features|possible|can it do|how does it work)\b/.test(q);
 const navigationQuestion=/\b(where|how do i get|take me|go to|open|navigate|find|show me|which page|what page)\b/.test(q);
 const helpPageQuestion=/\b(page|screen|section|tab|feature|menu|navigate|where do i|how do i use|what is|what does|explain|show me)\b/.test(q);
 const matchedPage=pages.map(p=>({...p,score:p.names.reduce((m,n)=>Math.max(m,q.includes(n)?n.length:0),0)})).filter(p=>p.score).sort((a,b)=>b.score-a.score)[0];
 if(matchedPage&&(helpPageQuestion||navigationQuestion||valueQuestion)){
   return navigate(matchedPage.what+' Open '+matchedPage.path+' to explore it. In demo mode the records and footage are fictional.',matchedPage.path,'explainFeature');
 }
 if(platformQuestion&&valueQuestion||/why (would|should) (i|we|someone) use/.test(q)){
   return navigate('Ring Guardian helps explain what happened between warehouse scanning and delivery by organizing package histories, timestamped evidence, exceptions and recovery steps. It makes missing-package investigations easier to follow, helps staff notice incorrect vehicle or address handoffs, and shows customers what evidence supports a report. The current build demonstrates these workflows with fictional data; real Ring and Alexa authorizations are not confirmed.','/about','explainPlatform');
 }
 if(/\b(how|where) (do|can) i (start|begin|learn|explore)\b|\bshow (me )?(around|the tour)\b/.test(q)){
   return navigate('Start with Walkthrough for the guided tour, Live events for a fictional delivery, or Packages to inspect a specific shipment. I can explain each page as you go.','/guided-demo','navigateToFeature');
 }
 if(/\b(report|claim|recover|resolve|proof|dispute)\b/.test(q)&&!digits&&!tracking){
   return navigate('To investigate a delivery, open Packages, choose the shipment, compare scans with available evidence, then review a case and export a demonstration evidence report. Carrier links do not submit claims automatically.','/packages','explainWorkflow');
 }
 if(/\b(what else|anything else|all features|everything|list features|show features)\b/.test(q)){
   return navigate('Explore the dashboard, packages, live simulations, scanners, cameras, evidence, cases, logistics grid, hands-free preview, Alexa voice demonstration, Ring integration, Amazon integration and Package P.I. evidence-sharing review. Ask me about any one of these screens.','/guided-demo','explainFeatures');
 }

 if(/incomplete|exceptions|flagged packages/.test(q))return navigate(board.shipments.filter(s=>s.discrepancy_flag).map(s=>s.tracking_number+': '+s.discrepancy_reason).join('\n')||'No flagged packages in this demo session.','/validation','findScanExceptions');
 if(/cameras|camera online/.test(q)&&!shipment)return navigate(board.cameras.filter(c=>c.status==='online'||c.status==='recording').map(c=>c.device_id+' at '+c.facility).join(', ')||'Open Cameras to inspect each device status.','/cameras','listActiveCameras');
 if(/this (screen|page)|current (screen|page)|what am i looking at/.test(q)){const current=pages.find(p=>p.path===path);return navigate(current?current.what+' Ask me how to use any feature here.':'You are on the home page. Open Walkthrough for the tour, or Packages and Live events for delivery examples.',path,'explainCurrentScreen');}
 if(/live|simulate|demonstration/.test(q))return navigate('Open simulated live events, choose a package story and press Start live simulation.','/live-events','navigateToFeature');
 if(/scan validation|manifest|truck|vehicle/.test(q)&&!shipment)return navigate('Choose a package in Scan validation. Select its expected vehicle to compare the manifest with the loading scan. Missing data stays unavailable.','/validation','getLoadingManifest');
 if(says('hello','hi guardian','hey guardian','good morning','good evening'))return navigate('Hello. Ask me about package scans, deliveries, video evidence, or how to investigate a missing parcel. I can also guide you through the fictional demonstration.',path,'conversation');
 if(says('what can you do','how can you help','help me','who are you'))return navigate('I can explain Ring Guardian, its benefits and every main screen; guide navigation; describe scanners, camera evidence, delivery exceptions, package recovery and the customer or management tours. I can answer questions about fictional packages and help you open the relevant page. Ask what a feature does or where to find it.',path,'conversation');
 if(says('start tour','walkthrough','guide me','show me around'))return navigate('To see the complete interactive narrated tour, select Start guided walkthrough below. It follows the package from sorting through delivery and investigation.','/guided-demo','navigateToFeature');
 if(says('alexa','voice not working','cannot hear','microphone'))return navigate('This app uses your browser microphone and speech for its guided demonstration. The Cloudflare Alexa Plus MCP service is separate and is not verified as a registered Alexa voice experience. Enable audio and check your device media volume.','/alexa','explainVoice');
 if(says('stolen','porch pirate','theft')&&!shipment)return navigate('A missing parcel is not automatically theft. Open Simulated live events and choose the missing-after-delivery scenario to compare the scan record and simulated footage.','/live-events','navigateToFeature');
 if(says('delivered','never arrived','where is my parcel','where is my package')&&!shipment)return navigate('A delivered scan does not establish that the customer received the parcel. Choose your demo package and I can compare its recorded handoff, delivery evidence and discrepancy.','/packages','findPackage');
 if(says('customer','recipient','buyer')&&!shipment)return navigate('Choose your example delivery in Packages to inspect what the carrier recorded and what the customer can safely share.','/packages','navigateToFeature');
 if(says('manager','management','warehouse operations','loading dock','wearable')&&!shipment)return navigate('Management can review loading, scanner confirmations and fictional wearable footage. Start with Operations or AI tracking to explore those workflows.','/operations','navigateToFeature');
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
 if(/flag|why|missing|review|next|delivered|arrived|wrong address|problem|happened/.test(q))return navigate(reply+(shipment.discrepancy_reason||'No discrepancy is recorded.')+' Check the last verified handoff, expected loading vehicle, incoming vehicle and drop-off location before drawing a conclusion.','/packages/'+shipment.tracking_number,'findScanExceptions');
 if(/truck|vehicle|scanned|loading/.test(q)){const v=validateLoading(shipment,events);return navigate(reply+v.status+'. '+v.reasons.join(' ')+' Observed loading vehicle: '+(v.observed||'not recorded')+'. Expected manifest vehicle must be supplied.','/validation','validatePackageLoading');}
 if(/handled|worker|handoff|where|last/.test(q))reply+=last?'Last confirmed record: '+last.event_label+' at '+last.facility+' on '+last.occurred_at+'. Worker reference: '+(last.employee_id||'not recorded')+'. A last scan does not establish the current physical location.':'No confirmed handoff is available.';
 else reply+=shipment.scenario_summary;
 return navigate(reply+' All these records are fictional demo data.','/packages/'+shipment.tracking_number,'getLastVerifiedHandoff');
}