// Sessionless MCP Streamable HTTP JSON-RPC endpoint for Alexa+ integration.
// Protocol: 2025-11-25. All tools operate on fictional Ring Guardian demo records.
// Deploying this function does not automatically register a production Alexa+ add-on.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
const VERSION = '2025-11-25';
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type,mcp-protocol-version,authorization' };
const tools = [
  {name:'list_demo_packages',description:'List simulated Ring Guardian packages and delivery statuses',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'}},required:['demo_session_id']}},
  {name:'get_package_status',description:'Get the status, evidence, and exceptions of one simulated package',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'},tracking_number:{type:'string'}},required:['demo_session_id','tracking_number']}},
  {name:'get_walkthrough',description:'Read guided demo steps for Alexa+ voice narration',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'},step_number:{type:'integer'}},required:['demo_session_id']}},
  {name:'get_package_location',description:'Get last recorded facility/location for a simulated shipment, with evidence and uncertainty',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'},tracking_number:{type:'string'}},required:['demo_session_id','tracking_number']}},
  {name:'get_handling_assignment',description:'Find an assigned worker or driver identifier for a simulated shipment if recorded, without real-time person tracking',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'},tracking_number:{type:'string'}},required:['demo_session_id','tracking_number']}},
  {name:'get_location_evidence',description:'Find recorded scans and evidence linked to a simulated shipment location, not a live GPS position',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'},tracking_number:{type:'string'}},required:['demo_session_id','tracking_number']}},
  {name:'get_package_events',description:'Get the timestamped simulated camera and scan events of a package',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'},tracking_number:{type:'string'}},required:['demo_session_id','tracking_number']}}
];
function send(obj,status=200){return new Response(JSON.stringify(obj),{status,headers});}
function reply(id,result){return send({jsonrpc:'2.0',id,result});}
function error(id,code,message){return send({jsonrpc:'2.0',id,error:{code,message}});}
function textResult(value){return {content:[{type:'text',text:JSON.stringify({simulation:true,...value})}],isError:false};}
function rows(data){return Array.isArray(data)?data:(data?.items||[]);}
export default async function(req){
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method==='GET')return send({error:'Use MCP Streamable HTTP POST; SSE not enabled'},405);
 if(req.method!=='POST')return send({error:'Method not allowed'},405);
 let data;
 try{data=await req.json();}catch{return error(null,-32700,'Invalid JSON');}
 const id=data?.id??null,method=data?.method;
 if(data?.jsonrpc!=='2.0'||typeof method!=='string')return error(id,-32600,'Invalid JSON-RPC request');
 if(method==='notifications/initialized')return new Response(null,{status:202,headers});
 if(method==='initialize')return reply(id,{protocolVersion:VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:'ring-guardian-demo',version:'1.0.0'}});
 if(method==='ping')return reply(id,{});
 if(method==='tools/list')return reply(id,{tools});
 if(method!=='tools/call')return error(id,-32601,'Method not found');
 const name=data.params?.name,args=data.params?.arguments||{};
 if(!tools.some(x=>x.name===name))return error(id,-32602,'Unknown tool');
 const sid=String(args.demo_session_id||'');
 if(!/^[A-Za-z0-9_-]{6,80}$/.test(sid))return error(id,-32602,'Valid demo_session_id is required');
 if(name==='get_walkthrough'){
  const guide=[
   ['From order to doorstep','/','An order becomes a shipment, with scans and delivery milestones.'],
   ['When delivery is uncertain','/','A carrier delivery claim is not proof a customer received the parcel.'],
   ['Welcome to Ring Guardian','/','Open Simulated live events from the home page.'],
   ['Watch a delivery event','/live-events','Choose a package scenario and start live simulation.'],
   ['Save matching evidence','/live-events','Save the evidence and open recovery steps.'],
   ['Export the evidence','/live-events','Download the report. Carrier links do not submit claims.'],
   ['Recover a misrouted parcel','/packages/TBA304711915063','Review the wrong truck case and perform corrective recovery.'],
   ['See hands free scanning','/ai-tracking','Run AI tracking. Confirmed scanner results are required.'],
   ['Review an evidence request','/interop','Review and authorize release of simulated evidence.'],
   ['Explore your console','/dashboard','The walkthrough is complete. These are fictional records.']
  ];
  const n=args.step_number===undefined?null:Number(args.step_number);
  if(n!==null&&(!Number.isInteger(n)||n<1||n>guide.length))return error(id,-32602,'Invalid walkthrough step');
  const steps=guide.map(([title,path,speech],i)=>({step_number:i+1,title,web_path:path,speech,simulation:true}));
  return reply(id,textResult({total_steps:steps.length,steps:n===null?steps:[steps[n-1]],note:'Web highlighting requires separately authorized session pairing.'}));
 }
 const tracking=String(args.tracking_number||'');
 if(name!=='list_demo_packages'&&name!=='get_walkthrough'&&!/^[A-Za-z0-9-]{6,80}$/.test(tracking))return error(id,-32602,'Valid tracking_number is required');
 try{
  const client=createClientFromRequest(req);
  const entities=client.asServiceRole.entities;
  const shipments=rows(await entities.Shipment.filter({demo_session_id:sid},{limit:100}));
  if(name==='list_demo_packages')return reply(id,textResult({packages:shipments.map(s=>({tracking_number:s.tracking_number,status:s.status,scenario:s.scenario_title,discrepancy:s.discrepancy_flag}))}));
  const shipment=shipments.find(s=>s.tracking_number===tracking);
  if(!shipment)return reply(id,{content:[{type:'text',text:'No simulated package matches this tracking number.'}],isError:true});
  if(name==='get_package_location')return reply(id,textResult({tracking_number:tracking,location_type:'recorded_not_live',last_known_location:shipment.last_known_location||null,current_facility:shipment.current_facility||null,origin_facility:shipment.origin_facility||null,destination_city:shipment.destination_city||null,expected_destination:shipment.expected_destination||null,location_known:!!(shipment.last_known_location||shipment.current_facility),notice:'Recorded locations are fictional demonstration data, not worker or parcel live GPS.'}));
  if(name==='get_handling_assignment')return reply(id,textResult({tracking_number:tracking,worker_id:shipment.assigned_worker_id||shipment.worker_id||null,driver_id:shipment.assigned_driver_id||shipment.driver_id||null,truck_id:shipment.assigned_truck_id||shipment.truck_id||null,facility:shipment.current_facility||null,person_gps:null,note:'No personnel geolocation is exposed. Blank assignments mean no verified assignment in the demo record.'}));
  if(name==='get_package_status')return reply(id,textResult({tracking_number:tracking,status:shipment.status,scenario:shipment.scenario_title,discrepancy:shipment.discrepancy_flag,reason:shipment.discrepancy_reason,evidence_status:shipment.evidence_status}));
  const events=rows(await entities.ScanEvent.filter({demo_session_id:sid,tracking_number:tracking},{limit:100}));
  if(name==='get_location_evidence')return reply(id,textResult({tracking_number:tracking,last_known_location:shipment.last_known_location||null,events:events.map(e=>({at:e.occurred_at||null,label:e.event_label||null,location:e.location||e.facility||null,scan_status:e.scan_status||null,evidence_source:e.evidence_source||null})),note:'Records without locations do not establish where a worker or parcel is now.'}));
  return reply(id,textResult({tracking_number:tracking,events:events.map(e=>({at:e.occurred_at,label:e.event_label,scan_status:e.scan_status,evidence_source:e.evidence_source,clip_key:e.video_clip_key,sync_status:e.sync_status}))}));
 }catch(e){return error(id,-32603,'Demo database unavailable');}
}