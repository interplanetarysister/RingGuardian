import React,{useState} from 'react';
import {base44} from '@/api/base44Client';
export default function EmailShippingSync({onPackages}){
 const [options,setOptions]=useState(null),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 async function check(){
  setBusy('options');setMessage('');
  try{
   const result=await base44.functions.invoke('customerShipmentSync',{action:'options'});
   const value=result?.data||result;
   if(!value.ok)throw Error(value.error||'The email connections are unavailable.');
   setOptions(value.available||[]);
   setMessage(!value.available?.length?'Automatic Gmail/Outlook imports are not configured. You can still import an email file or copy shipping updates.':'Connection options ready. Each account requires your individual permission.');
  }catch(e){setOptions([]);setMessage(e?.message||'Unable to check email connection options.')}
  finally{setBusy('')}
 }
 async function connect(provider,id){
  setBusy(provider);setMessage('');
  try{
   const url=await base44.connectors.connectAppUser(id);
   const u=new URL(url);
   if(u.protocol!=='https:')throw Error('Invalid authorization page');
   window.location.assign(u.href);
  }catch(e){setMessage(e?.message||'Could not start account authorization.')}
  finally{setBusy('')}
 }
 async function pull(provider){
  setBusy(provider);setMessage('');
  try{
   const r=await base44.functions.invoke('customerShipmentSync',{action:'sync',provider});
   const value=r?.data||r;
   if(!value?.ok)throw Error(value?.error||'Shipping import failed');
   onPackages?.(value.packages||[]);
   setMessage(value.count+' candidate tracking notifications found. Confirm every record against the original carrier update.');
  }catch(e){setMessage(e?.message||'Could not sync the authorized mailbox.')}
  finally{setBusy('')}
 }
 async function disconnect(provider,id){
  setBusy(provider);setMessage('');
  try{await base44.connectors.disconnectAppUser(id);setMessage(provider+' email connection disconnected.')}
  catch(e){setMessage(e?.message||'Could not disconnect this account.')}
  finally{setBusy('')}
 }
 return <div className="rounded-lg border p-3 space-y-2" aria-label="Optional email-account sync">
  <p className="text-sm font-semibold">Optional private email-account import</p>
  <p className="text-xs text-muted-foreground">For a future verified account connection: Gmail or Outlook can supply shipping notification summaries only after individual OAuth consent. No emails are read automatically. Mailbox connection setup is separate from the manual import above.</p>
  <button type="button" onClick={check} disabled={Boolean(busy)} className="rounded border px-3 py-2 text-xs disabled:opacity-50">{busy==='options'?'Checking…':'Check Gmail / Outlook options'}</button>
  {options?.map(p=><div key={p.provider} className="rounded border p-2 text-xs">
   <strong>{p.provider==='gmail'?'Gmail':'Outlook'} (opt-in)</strong>
   <div className="mt-2 flex flex-wrap gap-2">
    <button disabled={Boolean(busy)} className="rounded border px-2 py-1" onClick={()=>connect(p.provider,p.connectorId)}>Connect my account</button>
    <button disabled={Boolean(busy)} className="rounded border px-2 py-1" onClick={()=>pull(p.provider)}>Pull recent shipping updates</button>
    <button disabled={Boolean(busy)} className="rounded border px-2 py-1" onClick={()=>disconnect(p.provider,p.connectorId)}>Disconnect</button>
   </div>
  </div>)}
  {message&&<p role="status" className="text-xs">{message}</p>}
 </div>;
}