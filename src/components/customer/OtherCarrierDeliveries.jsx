import WorkflowStage,{StageProgress} from '@/components/workflow/WorkflowStage';
import EmailShippingSync from '@/components/customer/EmailShippingSync';
import React,{useMemo,useState} from 'react';
import JSZip from 'jszip';
import {Document,Packer,Paragraph,TextRun,HeadingLevel} from 'docx';
import {CARRIER_INFO,parseShipmentNotice,createShipment,mergeShipment,carrierPortal} from '@/lib/customerShipmentImports';

const DEMO_CARRIER_PACKAGES=[
 {carrier:'UPS',tracking:'1Z999AA10123456784',nickname:'Vintage camera (demo)',status:'Reported delivered (fictional)',source:'UPS linked account (SIMULATED)'},
 {carrier:'FedEx',tracking:'782523871645',nickname:'Birthday gift (demo)',status:'Out for delivery (fictional)',source:'FedEx linked account (SIMULATED)'},
 {carrier:'USPS',tracking:'9400100000000000000010',nickname:'Family photos (demo)',status:'Reported delivered (fictional)',source:'Gmail shipping notification (SIMULATED)'},
 {carrier:'DHL',tracking:'JD014600006499999999',nickname:'Replacement item (demo)',status:'In transit (fictional)',source:'DHL linked portal (SIMULATED)'}
];
const CARRIER_STAGES=['Import Shipment','Select Parcel','Prepare Evidence','Carrier Submission'];
const MAX_EMAIL_BYTES=1024*1024;
const MAX_VIDEO_BYTES=40*1024*1024;
const safeName=value=>String(value||'parcel').replace(/[^a-z0-9._-]/gi,'-').slice(0,45);
function downloadBlob(blob,fileName){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function displayWindow(from,to,zone){
 if(!from&&!to)return 'Not provided';
 return (from||'Not provided')+' to '+(to||'Not provided')+' ('+zone+')';
}
export function carrierEvidenceSummary({shipment,deliveryStart,deliveryEnd,videoStart,videoEnd,statement,videoName='',sha256='',zone='local'}){
 return {
  title:'Ring Guardian — customer-prepared parcel evidence package',
  status:'PREPARED LOCALLY — NOT SENT OR FILED',
  carrier:shipment.carrier,
  trackingNumber:shipment.tracking,
  packageName:shipment.nickname||'Not named',
  reportedShipmentStatus:shipment.status,
  shippingUpdateSource:shipment.source,
  providerVerified:'No. The tracking update was entered or imported by the customer and has not been confirmed with the carrier.',
  reportedDeliverySlot:displayWindow(deliveryStart,deliveryEnd,zone),
  suppliedFootageWindow:displayWindow(videoStart,videoEnd,zone),
  complaint:statement.trim(),
  videoFile:videoName||'No footage selected',
  videoSha256:sha256||'Not applicable',
  evidenceExplanation:'Video is provided by the customer, not retrieved or authenticated by a Ring API. A clip with no visible delivery does not establish non-delivery outside its recorded interval.',
  nextStep:'Customer must open the official carrier support/claims process and upload the documents and video if accepted. Carrier rules and eligible claimants differ.'
 };
}
function validateTimes(a,b){
 if(!a||!b)return true;
 return new Date(a).getTime()<=new Date(b).getTime();
}
function escapeText(t){return String(t||'').slice(0,3000)}
export default function OtherCarrierDeliveries({mode='unknown'}){
 const [shipments,setShipments]=useState([]);
 const [phase,setPhase]=useState(1),[done,setDone]=useState([]);
 const isDone=n=>done.includes(n);
 const available=n=>n===1||isDone(n-1);
 const locked=n=>!available(n)&&!isDone(n);
 function advance(n){
  setDone(prev=>prev.includes(n)?prev:[...prev,n]);
  setPhase(Math.min(4,n+1));
  if(n<4)requestAnimationFrame(()=>document.getElementById(['','carrier-import-1','carrier-select-2','carrier-evidence-3','carrier-submit-4'][n+1])?.scrollIntoView({behavior:'smooth',block:'start'}));
 }
 function useDemoLinkedAccounts(){
  setShipments(prev=>DEMO_CARRIER_PACKAGES.reduce((items,shipment)=>mergeShipment(items,createShipment(shipment)),prev));
  setFeedback('Demo shipping feeds linked: UPS, FedEx, USPS via Gmail, and DHL. All records are fictional; no account was accessed.');
  advance(1);
 }

 const [selectedId,setSelectedId]=useState('');
 const [notice,setNotice]=useState('');
 const [carrier,setCarrier]=useState('Other'),[tracking,setTracking]=useState(''),[nickname,setNickname]=useState(''),[status,setStatus]=useState('Status not verified');
 const [importText,setImportText]=useState(''),[feedback,setFeedback]=useState(''),[working,setWorking]=useState(false);
 const [deliveryStart,setDeliveryStart]=useState(''),[deliveryEnd,setDeliveryEnd]=useState('');
 const [videoStart,setVideoStart]=useState(''),[videoEnd,setVideoEnd]=useState('');
 const [complaint,setComplaint]=useState(''),[video,setVideo]=useState(null),[permission,setPermission]=useState(false);
 const [otherClaimUrl,setOtherClaimUrl]=useState('');
 const zone=useMemo(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'device local time',[]);
 const selected=shipments.find(s=>s.carrier+'|'+s.tracking===selectedId)||null;
 function selectShipment(s){
  const next=s.carrier+'|'+s.tracking;
  if(selectedId!==next){
    // Never silently reuse evidence or complaint fields for another tracking ID.
    setComplaint('');setDeliveryStart('');setDeliveryEnd('');
    setVideoStart('');setVideoEnd('');setVideo(null);setPermission(false);
  }
  setSelectedId(next);setFeedback('');
  setDone(prev=>prev.filter(n=>n<=1));setPhase(2);
 }
 function saveShipment(){
  const shipment=createShipment({carrier,tracking,nickname,status,source:notice?'Imported message; details confirmed by customer':'Manually entered by customer'});
  if(!shipment){setFeedback('Enter a tracking code with 7–40 letters, digits or hyphens.');return}
  setShipments(list=>mergeShipment(list,shipment));selectShipment(shipment);
  setNotice('');setImportText('');setFeedback('Delivery details added locally. They have not been verified with the carrier.');
  advance(1);
 }
 function previewImport(raw){
  const parsed=parseShipmentNotice(raw);
  setNotice(raw?'selected':'');setTracking(parsed.tracking||'');
  setCarrier(parsed.carrier);setStatus(parsed.status);
  setFeedback(parsed.tracking
   ? 'Tracking candidate found. Check the carrier, code and message status before selecting Add package.'
   : 'No reliable tracking code was detected. Enter the tracking number yourself.');
 }
 async function importFile(e){
  const file=e.target.files?.[0];e.target.value='';
  if(!file)return;
  if(file.size>MAX_EMAIL_BYTES){setFeedback('The email file must be smaller than 1 MB.');return}
  if(!/\.(eml|txt|html|htm)$/i.test(file.name)){setFeedback('Choose an .eml or plain-text shipping notice.');return}
  try{previewImport((await file.text()).slice(0,35000))}
  catch{setFeedback('Could not read that shipping notification.')}
 }
 function erase(){
  if(!selected)return;
  setShipments(prev=>prev.filter(p=>p.carrier+'|'+p.tracking!==selectedId));
  setSelectedId('');setVideo(null);setComplaint('');setDone(prev=>prev.filter(n=>n===1));setPhase(2);setFeedback('Removed package from this browser session.');
 }
 function chooseVideo(e){
  const f=e.target.files?.[0]||null;
  if(f&&(f.size>MAX_VIDEO_BYTES||!f.type.startsWith('video/'))){
   setVideo(null);setPermission(false);
   setFeedback('Choose a real video clip under 40 MB (larger originals can be supplied separately to the carrier).');
   return;
  }
  setVideo(f);setPermission(false);setFeedback(f?'Selected device video; not yet uploaded anywhere.':'');
 }
 function targetUrl(){
  if(selected?.carrier!=='Other')return carrierPortal(selected?.carrier);
  try{
   const url=new URL(otherClaimUrl);
   if(url.protocol==='https:'&&url.hostname.includes('.')&&!/^(localhost|127\.|10\.|192\.168\.)/.test(url.hostname))return url.href;
  }catch{}
  return null;
 }
 async function downloadEvidence(format='zip'){
  if(!selected){setFeedback('Choose an imported or manually entered package first.');return}
  if(!complaint.trim()){setFeedback('Write your complaint and what you observed first.');return}
  if(!validateTimes(deliveryStart,deliveryEnd)||!validateTimes(videoStart,videoEnd)){setFeedback('Time window start must be before its end.');return}
  if(video&&!permission){setFeedback('Confirm that you are authorized to share the selected video.');return}
  setWorking(true);setFeedback('');
  try{
   const bytes=video?await video.arrayBuffer():null;
   const digest=bytes&&globalThis.crypto?.subtle?await crypto.subtle.digest('SHA-256',bytes):null;
   const sha=digest?Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join(''):'';
   const data=carrierEvidenceSummary({shipment:selected,deliveryStart,deliveryEnd,videoStart,videoEnd,statement:escapeText(complaint),videoName:video?.name||'',sha256:sha,zone});
   const paragraphs=[new Paragraph({text:data.title,heading:HeadingLevel.HEADING_1}),
    new Paragraph({text:data.status,heading:HeadingLevel.HEADING_2}),
    ...Object.entries(data).filter(([k])=>!['title','status'].includes(k)).map(([key,value])=>new Paragraph({spacing:{after:160},children:[
     new TextRun({text:key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())+': ',bold:true}),
     new TextRun({text:String(value)})]}))];
   const doc=new Document({sections:[{children:paragraphs}]});
   const docx=await Packer.toBlob(doc);
   if(format==='docx'){
     downloadBlob(docx,'Ring-Guardian-Complaint-'+safeName(selected.tracking.slice(-6))+'.docx');
     setFeedback('Editable Word complaint downloaded. No data or evidence was sent to the carrier.');
     advance(3);
     return;
   }
   const zip=new JSZip();
   zip.file('Ring-Guardian-Customer-Complaint.docx',docx);
   zip.file('DELIVERY-DETAILS.json',JSON.stringify(data,null,2));
   zip.file('READ-ME.txt','Prepared on this device. Nothing was filed or sent by Ring Guardian. Open the verified carrier portal, submit the complaint, and attach the Word report and original footage if accepted. Keep original unedited files, timestamps and receipts. The provider decides its claim rules and evidence acceptance.');
   if(bytes){const ext=video.name.match(/\.(mp4|mov|webm|m4v|avi)$/i)?.[1]||'video';zip.file('customer-provided-footage.'+ext,bytes,{compression:'STORE'})}
   const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}});
   downloadBlob(blob,'ring-guardian-'+safeName(selected.carrier)+'-'+safeName(selected.tracking.slice(-6))+'.zip');
   setFeedback('Evidence package downloaded: editable Word complaint, shipment details'+(video?' and selected video':'')+'. Not submitted to '+selected.carrier+'.');
   advance(3);
  }catch(err){setFeedback('Could not prepare the evidence ZIP: '+(err?.message||'unknown error'))}
  finally{setWorking(false)}
 }
 return <section className="rounded-xl border border-primary/40 bg-card p-5 space-y-5" id="non-amazon-deliveries" aria-label="Other parcel carriers and evidence">
  <header><h2 className="text-xl font-bold">Non-Amazon package updates & carrier claims</h2>
   <p className="mt-1 text-sm text-muted-foreground">Optional for UPS, FedEx, USPS, DHL, OnTrac and other couriers. Add shipment notifications from your email or carrier portal, then prepare a Ring Guardian complaint with your footage. Nothing is transmitted until you submit it yourself to the courier.</p>
  </header>
  <div className="rounded-lg border p-3 text-sm">
   <strong>Private, opt-in imports</strong>
   <p className="mt-1 text-xs text-muted-foreground">Manual email imports, tracking codes and selected video stay on this device. An authorized Gmail/Outlook connection, when configured, processes recent shipping notices through a private server function but does not store complete emails or videos. Carrier-portal accounts are not connected. Never enter your email or shipping-portal password here.</p>
   <p className="mt-2 text-xs">For email updates, save or forward a shipping notice to yourself, then paste its tracking details below or choose the exported .eml file. For portal updates, open the carrier link and copy your package status back here.</p>
  </div>
  <StageProgress titles={CARRIER_STAGES} current={phase} done={done}/>
  <WorkflowStage number={1} id="carrier-import-1" title="Import Shipment" active={phase===1} done={isDone(1)} locked={locked(1)} onReopen={()=>setPhase(1)} description="Pull from simulated linked accounts or add a shipping notice yourself.">
    {mode==='demo'&&<div className="rounded-xl border-2 border-teal-500 p-3">
      <strong className="block text-sm">Connected demo feeds (simulated)</strong>
      <p className="mt-1 text-xs">✓ UPS · ✓ FedEx · ✓ USPS via Gmail · ✓ DHL · ✓ Ring Doorbell. These are pre-linked fictional test accounts, not real carrier or email logins.</p>
      <button type="button" onClick={useDemoLinkedAccounts} className="mt-3 rounded-lg bg-yellow-400 px-4 py-3 text-sm font-black text-[#171717]">Load demo shipments from linked accounts →</button>
    </div>}
    <h3 className="font-bold">Or add a shipping update</h3>
    <label className="block text-sm">Paste email or portal notification
     <textarea className="mt-1 w-full rounded border bg-background p-2 text-sm" rows={3} maxLength={35000} value={importText} onChange={e=>setImportText(e.target.value)} placeholder="Copy only the tracking update, not your personal email thread or password."/>
    </label>
    <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>previewImport(importText)} disabled={!importText.trim()} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Find tracking details</button>
     <label className="rounded border px-3 py-2 text-sm">Import .eml or .txt<input type="file" accept=".eml,.txt,.html,.htm,text/plain,message/rfc822" onChange={importFile} className="sr-only"/></label>
    </div>
    <label className="block text-sm">Carrier
     <select value={carrier} onChange={e=>setCarrier(e.target.value)} className="mt-1 w-full rounded border bg-background p-2">{Object.entries(CARRIER_INFO).map(([id,info])=><option key={id} value={id}>{info.label}</option>)}</select>
    </label>
    <label className="block text-sm">Tracking number<input value={tracking} onChange={e=>setTracking(e.target.value)} maxLength={40} className="mt-1 w-full rounded border bg-background p-2" placeholder="Check against the original notice"/></label>
    <label className="block text-sm">Package name (optional)<input value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={65} placeholder="e.g. Gift from Mom" className="mt-1 w-full rounded border bg-background p-2"/></label>
    <label className="block text-sm">Last status reported by email or portal<input value={status} onChange={e=>setStatus(e.target.value)} maxLength={110} className="mt-1 w-full rounded border bg-background p-2"/></label>
    <button type="button" onClick={saveShipment} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add package to my list</button>
    <details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm font-bold">Live Gmail / Outlook setup (requires account authorization)</summary>
    <EmailShippingSync onPackages={items=>{
     const imported=items.map(v=>createShipment({...v,source:v.source||'Authorized email notice (unverified)'})).filter(Boolean);
     if(!imported.length)return;
     setShipments(prev=>imported.reduce((acc,item)=>mergeShipment(acc,item),prev));
     selectShipment(imported[0]);
     setFeedback(imported.length+' shipping notices added from your authorized email account. Carrier delivery status is not independently confirmed.');
     advance(1);
    }}/></details>
  </WorkflowStage>
  <WorkflowStage number={2} id="carrier-select-2" title="Select Parcel" active={phase===2} done={isDone(2)} locked={locked(2)} onReopen={()=>setPhase(2)} description="Choose one imported delivery so details and footage stay correctly matched.">
    {shipments.length?shipments.map(s=><div key={s.carrier+'|'+s.tracking} className={'rounded border p-3 '+(selectedId===s.carrier+'|'+s.tracking?'border-primary':'')}>
     <button type="button" onClick={()=>selectShipment(s)} className="text-left text-sm font-semibold underline">{s.nickname||s.carrier+' package'} — {s.carrier} · ending {s.tracking.slice(-4)}</button>
     <p className="mt-1 text-xs text-muted-foreground">{s.status}</p><p className="text-[11px] text-muted-foreground">{s.source}</p>
    </div>):<p className="text-sm text-muted-foreground">No packages imported yet. No inbox or courier account is monitored.</p>}
    {selected&&<div className="space-y-2">
     <div className="flex gap-2 flex-wrap">
      {carrierPortal(selected.carrier,'tracking')&&<a href={carrierPortal(selected.carrier,'tracking')} target="_blank" rel="noopener noreferrer" className="rounded border px-3 py-2 text-xs">Open official {selected.carrier} tracking</a>}
      <button type="button" onClick={erase} className="rounded border px-3 py-2 text-xs">Remove this package</button>
     </div>
     <p className="text-xs text-muted-foreground">Imported information is customer-supplied, not independently checked by a carrier.</p>
    </div>}
    <p className="text-xs text-muted-foreground">When using genuine accounts, status is only as current as the last authorized email import or manual update. Demo records are fictional.</p>
    <button type="button" disabled={!selected} onClick={()=>advance(2)} className="w-full rounded-xl bg-[#FF5138] px-4 py-3 text-base font-black text-white disabled:opacity-40">Continue to 3. Prepare Evidence →</button>
  </WorkflowStage>
  <WorkflowStage number={3} id="carrier-evidence-3" title="Prepare Evidence" active={phase===3} done={isDone(3)} locked={locked(3)} onReopen={()=>setPhase(3)} description="Add your complaint, carrier-reported delivery slot and authorized video.">
   <p className="font-bold">Compile the written complaint and video</p>
   <p className="text-sm text-muted-foreground">Selected package: <strong>{selected?(selected.nickname||selected.carrier+' package')+' · '+selected.carrier+' · '+selected.tracking:'Choose a package above'}</strong></p>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm">Reported delivery window — starts<input type="datetime-local" value={deliveryStart} onChange={e=>setDeliveryStart(e.target.value)} className="mt-1 w-full rounded border bg-background p-2"/></label>
    <label className="text-sm">Reported delivery window — ends<input type="datetime-local" value={deliveryEnd} onChange={e=>setDeliveryEnd(e.target.value)} className="mt-1 w-full rounded border bg-background p-2"/></label>
    <label className="text-sm">Doorbell clip window — starts<input type="datetime-local" value={videoStart} onChange={e=>setVideoStart(e.target.value)} className="mt-1 w-full rounded border bg-background p-2"/></label>
    <label className="text-sm">Doorbell clip window — ends<input type="datetime-local" value={videoEnd} onChange={e=>setVideoEnd(e.target.value)} className="mt-1 w-full rounded border bg-background p-2"/></label>
   </div>
   <p className="text-xs text-muted-foreground">Times are entered in your device’s local timezone ({zone}). Do not assume the carrier’s reported window and the footage timestamp use the same timezone; confirm both first.</p>
   <label className="block text-sm">Your written explanation / complaint
    <textarea rows={5} maxLength={3000} className="mt-1 w-full rounded border bg-background p-2" value={complaint} onChange={e=>setComplaint(e.target.value)} placeholder="Example: Carrier tracking says delivered during the reported time window, but no delivery is visible in my selected camera clip. Please investigate the recorded delivery scan and provide next steps. This is my observation, not proof of theft."/>
   </label>
   <label className="block text-sm">Select a doorbell video exported from your device (optional, max 40 MB)
    <input type="file" accept="video/*" className="mt-1 block w-full text-sm" onChange={chooseVideo}/>
   </label>
   {video&&<p className="text-xs text-muted-foreground">Video selected: {video.name} · {(video.size/1048576).toFixed(1)} MB. This file is not authenticated as Ring footage.</p>}
   {video&&<label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={permission} onChange={e=>setPermission(e.target.checked)}/> I am authorized to share this clip and understand it shows only the recorded interval.</label>}
   <div className="flex flex-wrap gap-2">
    <button type="button" disabled={!selected||!complaint.trim()||working} onClick={()=>downloadEvidence('zip')} className="rounded bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{working?'Preparing evidence…':'Download full evidence package (.zip)'}</button>
    <button type="button" disabled={!selected||!complaint.trim()||working} onClick={()=>downloadEvidence('docx')} className="rounded border px-4 py-3 text-sm font-semibold disabled:opacity-50">Download Word complaint separately</button>
    {video&&<button type="button" onClick={()=>downloadBlob(video,'carrier-evidence-'+safeName(video.name))} className="rounded border px-4 py-3 text-sm">Download selected video separately</button>}
   </div>
   <p className="text-xs text-muted-foreground">The ZIP includes an editable Word complaint, shipment details, submission instructions and your selected video. Many carrier portals do not accept ZIP or video uploads, so the Word and video files are also available separately. All files are prepared locally; submission and acceptance are controlled by the courier.</p>
  </WorkflowStage>
  <WorkflowStage number={4} id="carrier-submit-4" title="Carrier Submission" active={phase===4} done={isDone(4)} locked={locked(4)} onReopen={()=>setPhase(4)} description="Use the official carrier website to send your package; Ring Guardian does not submit it for you.">
   <p className="text-sm text-muted-foreground">Open the carrier’s verified support or claim page, review its rules, then attach the report and video where allowed. Some recipients must contact the retailer or shipper first.</p>
   {selected?.carrier==='Other'&&<label className="block text-sm">Verified HTTPS carrier support URL<input type="url" value={otherClaimUrl} onChange={e=>setOtherClaimUrl(e.target.value)} placeholder="https://carrier.example/support" className="mt-1 w-full rounded border bg-background p-2"/></label>}
   {selected&&targetUrl()?<a href={targetUrl()} target="_blank" rel="noopener noreferrer" className="inline-block rounded border px-4 py-2 text-sm font-semibold">Open {selected.carrier} customer support / claims →</a>:<p className="text-xs text-muted-foreground">Select a carrier with an official support page or provide your carrier’s verified HTTPS link.</p>}
   <p className="text-xs text-muted-foreground">No claim number is issued by Ring Guardian, and preparing a ZIP does not submit a complaint or request a replacement.</p>
   <button type="button" onClick={()=>{setDone(prev=>prev.includes(4)?prev:[...prev,4]);setFeedback('All local steps finished. External filing is not verified; check the courier portal for the actual claim status.')}} className="rounded-xl border-[3px] border-green-500 px-4 py-3 text-sm font-bold">I understand that I must file on the carrier website</button>
  </WorkflowStage>
  {feedback&&<p role="status" className="rounded border p-3 text-sm">{feedback}</p>}
 </section>
}