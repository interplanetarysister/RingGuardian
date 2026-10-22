// Read-only, server-mediated data access for fictional Ring Guardian demo sessions.
// Never expose an entity SDK or service-role capability to the browser.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
const TABLES={shipments:['Shipment',50],events:['ScanEvent',400,'-occurred_at'],clips:['VideoClip',300],cameras:['GuardianCamera',100],scanners:['Scanner',100],employees:['Employee',100],cases:['Investigation',100],requests:['FootageRequest',100],activity:['ActivityLog',80,'-occurred_at']};
const listed=x=>Array.isArray(x)?x:(x?.items||[]);
export default async function(req){
 if(req.method!=='POST')return Response.json({ok:false,error:'Method not allowed'},{status:405});
 try{
  const sdk=createClientFromRequest(req),data=await req.json().catch(()=>({}));
  const sid=String(data.demo_session_id||'');
  if(!/^[A-Za-z0-9_-]{6,80}$/.test(sid))return Response.json({ok:false,error:'Invalid demo session'},{status:400});
  const cfg=listed(await sdk.asServiceRole.entities.AppSetting.filter({key:'global-mode'}))[0];
  if(cfg?.mode==='live')return Response.json({ok:false,error:'Public demo records unavailable in live mode'},{status:403});
  const output={};
  for(const [key,[table,limit,sort]] of Object.entries(TABLES)){
    const value=await sdk.asServiceRole.entities[table].filter({demo_session_id:sid},sort?{sort,limit}:{limit});
    output[key]=listed(value).map(row=>{
      const {demo_session_id,created_by,updated_by,...safe}=row;
      return safe;
    });
  }
  return Response.json({ok:true,board:output},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return Response.json({ok:false,error:'Demo snapshot unavailable'},{status:500});}
}