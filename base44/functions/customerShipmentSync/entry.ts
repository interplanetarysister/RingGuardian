// Optional, explicit one-shot mail import. Requires user sign-in, separately
// registered app-user OAuth connector and the user's OAuth consent.
// Never uses a platform-wide mailbox token. No raw email body is retained.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
const ids={gmail:Deno.env.get('RGC_GMAIL_APP_USER_CONNECTOR_ID')||'',outlook:Deno.env.get('RGC_OUTLOOK_APP_USER_CONNECTOR_ID')||''};
const PROVIDERS=['gmail','outlook'];
const KNOWN=[
 ['UPS',/\b(?:ups\.com|UPS)\b/i],['FedEx',/\b(?:fedex\.com|FedEx)\b/i],
 ['USPS',/\b(?:usps\.com|USPS|Informed Delivery)\b/i],['DHL',/\b(?:dhl\.com|DHL)\b/i],
 ['OnTrac',/\b(?:ontrac\.com|OnTrac)\b/i]
];
const trackingFrom=text=>{
 const match=String(text).match(/(?:tracking(?: number| no\.?| id)?|waybill|shipment (?:number|id))\s*[:#\-]?\s*([A-Z0-9-]{7,40})/i)
  ||String(text).match(/\b(1Z[A-Z0-9]{16}|9[2345678]\d{18,20})\b/i);
 const val=String(match?.[1]||'').toUpperCase();
 return /^[A-Z0-9-]{7,40}$/.test(val)?val:'';
};
const summarize=(text,source)=>{
 const carrier=KNOWN.find(([,pattern])=>pattern.test(text))?.[0]||'Other';
 const tracking=trackingFrom(text);
 if(!tracking)return null;
 const lower=text.toLowerCase();
 const status=/not delivered|not received|delivery failed/.test(lower)?'Delivery problem reported'
  :/out for delivery/.test(lower)?'Out for delivery (message)'
  :/delivered/.test(lower)?'Delivered (reported in message)'
  :/delay|exception/.test(lower)?'Delivery delayed (message)'
  :/shipped|in transit/.test(lower)?'In transit (message)':'Status not determined';
 // Never return sender's address, subject/body/snippet, OAuth token, or metadata.
 return {carrier,tracking,status,source,updatedAt:new Date().toISOString()};
};
const safeJson=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function requestJson(url,token){
 const r=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error'});
 if(!r.ok)throw Error('The email provider rejected the authorized request.');
 return await r.json();
}
async function gmailFetch(token){
 const q='newer_than:21d {from:ups.com from:fedex.com from:usps.com from:dhl.com from:ontrac.com}';
 const list=await requestJson('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q='+encodeURIComponent(q),token);
 const rows=[];
 for(const item of (list.messages||[]).slice(0,15)){
  const id=String(item.id||'');
  if(!/^[a-f0-9]{5,40}$/i.test(id))continue;
  const value=await requestJson('https://gmail.googleapis.com/gmail/v1/users/me/messages/'+id+'?format=metadata&metadataHeaders=Subject&metadataHeaders=From',token);
  const headers=value.payload?.headers||[];
  const field=name=>String(headers.find(h=>String(h.name).toLowerCase()===name)?.value||'');
  const parsed=summarize((field('subject')+' '+field('from')+' '+String(value.snippet||'')).slice(0,700),'Gmail notice (account authorized; status unverified)');
  if(parsed)rows.push(parsed);
 }
 return rows;
}
async function outlookFetch(token){
 const url='https://graph.microsoft.com/v1.0/me/messages?$top=20&$select=subject,bodyPreview,from,receivedDateTime&$orderby=receivedDateTime%20desc';
 const list=await requestJson(url,token);
 return (list.value||[]).slice(0,20).map(item=>{
  const text=(String(item.subject||'')+' '+String(item.from?.emailAddress?.address||'')+' '+String(item.bodyPreview||'')).slice(0,700);
  if(!KNOWN.some(([,pattern])=>pattern.test(text)))return null;
  return summarize(text,'Outlook notice (account authorized; status unverified)');
 }).filter(Boolean);
}
export default async function(req){
 if(req.method!=='POST')return safeJson({ok:false,error:'POST required'},405);
 try{
  if(Number(req.headers.get('content-length'))>1000)return safeJson({ok:false,error:'Invalid request'},413);
  const input=await req.json().catch(()=>null);
  if(!input||!['options','sync'].includes(input.action))return safeJson({ok:false,error:'Unknown action'},400);
  const sdk=createClientFromRequest(req);
  const user=await sdk.auth.me().catch(()=>null);
  if(!user?.id)return safeJson({ok:false,error:'Sign in to connect a private email account.'},401);
  if(input.action==='options')return safeJson({ok:true,available:PROVIDERS.filter(p=>Boolean(ids[p])).map(p=>({provider:p,connectorId:ids[p]})),notice:'Private app-user OAuth consent required. No email scanned.'});
  const provider=input.provider;
  if(!PROVIDERS.includes(provider)||!ids[provider])return safeJson({ok:false,error:'This email provider has not been configured by the app owner.'},422);
  // Only an individually authorized connector for THIS signed-in app user.
  let account;
  try{account=await sdk.asServiceRole.connectors.getCurrentAppUserConnection(ids[provider]);}
  catch{return safeJson({ok:false,error:'Connect this email account using your own permission first.'},403)}
  if(!account?.accessToken)return safeJson({ok:false,error:'Email account not connected.'},403);
  const reports=provider==='gmail'?await gmailFetch(account.accessToken):await outlookFetch(account.accessToken);
  return safeJson({ok:true,provider,packages:reports.slice(0,15),count:reports.length,notice:'Only matching notification summaries returned. Raw email is not saved to Ring Guardian.'});
 }catch{return safeJson({ok:false,error:'Could not retrieve shipping notifications. No messages were saved.'},503)}
}