// Sessionless MCP Streamable HTTP JSON-RPC endpoint for the Alexa+ hackathon.
// Protocol: 2025-11-25. All tools operate on fictional Ring Guardian demo records.
// Deploying this function does not automatically register a production Alexa+ add-on.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
const VERSION = '2025-11-25';
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type,mcp-protocol-version,authorization' };
const tools = [
  {name:'list_demo_packages',description:'List simulated Ring Guardian packages and delivery statuses',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'}},required:['demo_session_id']}},
  {name:'get_package_status',description:'Get the status, evidence, and exceptions of one simulated package',inputSchema:{type:'object',properties:{demo_session_id:{type:'string'},tracking_number:{type:'string'}},required:['demo_session_id','tracking_number']}},
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
 const tracking=String(args.tracking_number||'');
 if(name!=='list_demo_packages'&&!/^[A-Za-z0-9-]{6,80}$/.test(tracking))return error(id,-32602,'Valid tracking_number is required');
 try{
  const client=createClientFromRequest(req);
  const entities=client.asServiceRole.entities;
  const shipments=rows(await entities.Shipment.filter({demo_session_id:sid},{limit:100}));
  if(name==='list_demo_packages')return reply(id,textResult({packages:shipments.map(s=>({tracking_number:s.tracking_number,status:s.status,scenario:s.scenario_title,discrepancy:s.discrepancy_flag}))}));
  const shipment=shipments.find(s=>s.tracking_number===tracking);
  if(!shipment)return reply(id,{content:[{type:'text',text:'No simulated package matches this tracking number.'}],isError:true});
  if(name==='get_package_status')return reply(id,textResult({tracking_number:tracking,status:shipment.status,scenario:shipment.scenario_title,discrepancy:shipment.discrepancy_flag,reason:shipment.discrepancy_reason,evidence_status:shipment.evidence_status}));
  const events=rows(await entities.ScanEvent.filter({demo_session_id:sid,tracking_number:tracking},{limit:100}));
  return reply(id,textResult({tracking_number:tracking,events:events.map(e=>({at:e.occurred_at,label:e.event_label,scan_status:e.scan_status,evidence_source:e.evidence_source,clip_key:e.video_clip_key,sync_status:e.sync_status}))}));
 }catch(e){return error(id,-32603,'Demo database unavailable');}
}
