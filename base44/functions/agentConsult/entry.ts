import {consultation} from '../../shared/agentConsultation.ts';
export default async function(req:Request){
 if(req.method!=='POST')return Response.json({ok:false,error:'POST required'},{status:405});
 try{
  if(Number(req.headers.get('content-length'))>1024)return Response.json({ok:false,error:'Payload too large'},{status:413});
  const raw=await req.text();
  if(raw.length>1024)return Response.json({ok:false,error:'Payload too large'},{status:413});
  const data=JSON.parse(raw);
  const result=consultation(data?.source,data?.target,data?.topic);
  return Response.json(result,{status:result.ok?200:400,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({ok:false,error:'Invalid consultation request'},{status:400});}
}