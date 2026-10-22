import React, {useMemo, useState} from 'react';
import {Document, Packer, Paragraph, TextRun, HeadingLevel} from 'docx';

const MAX_FILE_MB = 150;
const fullDate = value => value ? new Date(value).toLocaleString() : 'Not supplied';
const safeName = value => String(value||'package').replace(/[^a-z0-9-]/gi,'-').slice(-28);

function downloadBlob(blob,name) {
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function buildPoliceReportData({selected,tracking,incidentDate,description,location,department,videoFile,customerName}){
 return {
  header:'Ring Guardian — package incident evidence statement',
  status:'DRAFT — NOT SUBMITTED TO POLICE OR INSURANCE',
  provenance:'User-prepared statement. Demo package information is fictional and must not be used as a real police report.',
  tracking:String(tracking||'Not supplied'),scenario:String(selected?.scenario_title||'Not supplied'),
  shippingStatus:String(selected?.status||'Not supplied').replaceAll('_',' '),
  itemDescription:String(selected?.description||selected?.item_description||'Not provided'),
  lastRecordedEvent:String(selected?.updated_date||selected?.updated_at||selected?.created_date||'Not available'),
  incidentDate:incidentDate||'Not supplied',
  incidentLocation:location.trim()||'Not supplied',
  submitter:customerName.trim()||'Not supplied',
  agency:department.trim()||'Not selected',
  statement:description.trim()||'No statement entered',
  videoAttachment:videoFile ? videoFile.name+' ('+(videoFile.size/1048576).toFixed(1)+' MB; separate file, not embedded in Word report)' : 'No video attached',
  caution:'A delivery status or missing package alone does not establish theft. Report only what you personally observed. Preserve the original media, timestamps, and source. Do not falsely identify suspects.'
 };
}
export default function PoliceEvidenceReport({packages=[],tracking='',issue='',detail='',mode='unknown'}) {
 const selected=useMemo(()=>packages.find(p=>p.tracking_number===tracking),[packages,tracking]);
 const [date,setDate]=useState(''),[location,setLocation]=useState(''),[name,setName]=useState(''),[agency,setAgency]=useState(''),[agencyUrl,setAgencyUrl]=useState(''),[statement,setStatement]=useState(''),[file,setFile]=useState(null),[includeFootage,setIncludeFootage]=useState(false),[status,setStatus]=useState(''),[working,setWorking]=useState(false);
 const report=()=>buildPoliceReportData({selected,tracking,incidentDate:date,description:statement||detail||('I would like to report a package delivery concern: '+issue+'. I have not established whether this was theft.'),location,department:agency,videoFile:includeFootage?file:null,customerName:name});
 async function makeDoc(){
  if(mode!=='demo'){setStatus('The current live report has no authenticated package evidence service. Nothing was submitted.');return}
  if(!tracking.trim()){setStatus('Select a package first so its details can be included.');return}
  setWorking(true);setStatus('');
  try{
   const data=report();
   const rows=Object.entries(data).map(([key,value])=>new Paragraph({spacing:{after:120},children:[new TextRun({text:key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())+': ',bold:true}),new TextRun({text:String(value)})]}));
   const doc=new Document({sections:[{children:[
    new Paragraph({text:data.header,heading:HeadingLevel.HEADING_1}),
    new Paragraph({children:[new TextRun({text:data.status,bold:true,color:'B91C1C'})]}),
    ...rows,
    new Paragraph({text:'Evidence handling checklist',heading:HeadingLevel.HEADING_2}),
    new Paragraph({text:'Attach the original unedited video separately, when you have permission to share it. Include original timestamps and note any mismatch or missing footage.'}),
    new Paragraph({text:'The police department or insurer may require its own form. No agency received this download.'})
   ]}]});
   const blob=await Packer.toBlob(doc);
   downloadBlob(blob,'ring-guardian-incident-'+safeName(tracking)+'.docx');
   setStatus('Word report downloaded. No report was filed. Attach the video separately if appropriate.');
  }catch(e){setStatus('Could not generate the Word report: '+(e?.message||'unknown error'))}
  finally{setWorking(false)}
 }
 function downloadVideo(){
  if(!file)return setStatus('Choose a video file first. No verified downloadable camera footage is available from this demo.');
  downloadBlob(file,'ring-guardian-evidence-'+safeName(tracking)+'-'+safeName(file.name));
  setStatus('A copy of the selected video was downloaded. The original remains on your device.');
 }
 function openAgency(){
  try {
   const u=new URL(agencyUrl);
   if(u.protocol!=='https:')throw Error('Use an official HTTPS police department reporting website.');
   window.open(u.href,'_blank','noopener,noreferrer');
   setStatus('Opened the address you supplied. No information or evidence was sent. Complete the official form yourself.');
  }catch{setStatus('Enter the verified official HTTPS reporting link supplied by your local police department.')}
 }
 return <section className="rounded-xl border border-primary/40 bg-card p-5 space-y-4" aria-label="Police and insurance evidence report">
   <div><h2 className="text-xl font-bold">Prepare a police or insurance report</h2>
   <p className="mt-1 text-sm text-muted-foreground">For suspected package theft. Prepare a statement and a real Word document, then use your local police department's official reporting website or insurer's claim process. No automatic police filing is supported.</p></div>
   <p className="rounded border p-3 text-xs">Simulation only: package records shown here are fictional. Never submit demonstration data as a real police report. No actual Ring recording is retrieved by this form.</p>
   <div className="grid gap-3 sm:grid-cols-2">
     <label className="text-sm">Tracking number (from your selected package)<input value={tracking||''} readOnly className="mt-1 w-full rounded border bg-muted p-3"/></label>
     <label className="text-sm">Recorded package status<input readOnly value={selected?.status?.replaceAll('_',' ')||'Select a sample package'} className="mt-1 w-full rounded border bg-muted p-3"/></label>
     <label className="text-sm">Name for report (optional)<input value={name} onChange={e=>setName(e.target.value)} maxLength={100} className="mt-1 w-full rounded border bg-background p-3" placeholder="Your name"/></label>
     <label className="text-sm">Incident date / time<input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded border bg-background p-3"/></label>
     <label className="text-sm">Incident location (optional)<input value={location} onChange={e=>setLocation(e.target.value)} maxLength={200} placeholder="Location for report — not transmitted" className="mt-1 w-full rounded border bg-background p-3"/></label>
     <label className="text-sm">Police department (optional)<input value={agency} onChange={e=>setAgency(e.target.value)} maxLength={150} className="mt-1 w-full rounded border bg-background p-3" placeholder="Your local agency"/></label>
   </div>
   <label className="block text-sm">Describe what you observed, and what evidence supports it<textarea rows={4} maxLength={2500} className="mt-1 w-full rounded border bg-background p-3" value={statement} onChange={e=>setStatement(e.target.value)} placeholder="Explain what the delivery status says, what you observed, and any video timestamps. Avoid guessing who took the parcel."/></label>
   <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={includeFootage} onChange={e=>setIncludeFootage(e.target.checked)} /> Include a separate video file in my evidence package</label>
   {includeFootage&&<div className="rounded border p-3 space-y-2"><label className="block text-sm">Choose original footage from your device<input type="file" accept="video/*" className="mt-2 block w-full text-sm" onChange={e=>{const f=e.target.files?.[0];if(f && (f.size>MAX_FILE_MB*1048576 || !f.type.startsWith('video/'))){setStatus('Choose a video file no larger than '+MAX_FILE_MB+' MB.');setFile(null)}else{setFile(f||null);setStatus('')}}}/></label><p className="text-xs text-muted-foreground">{file?'Selected: '+file.name:'Choose video only if you have permission to share it.'} Video is not uploaded, stored, or sent by Ring Guardian.</p><button type="button" onClick={downloadVideo} disabled={!file} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Download a copy of the selected video</button></div>}
   <div className="flex flex-wrap gap-2"><button type="button" onClick={makeDoc} disabled={working||!tracking||mode!=='demo'} className="rounded bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{working?'Preparing document…':'Download Word report (.docx)'}</button></div>
   <div className="rounded border p-3 space-y-2"><h3 className="font-semibold text-sm">Use your local police reporting portal</h3><p className="text-xs text-muted-foreground">Find the official police website for the location where the incident occurred and confirm it accepts online theft reports. Some departments require a phone call or in-person report. Do not use emergency services for routine reports.</p><label className="block text-sm">Official police department report link<input type="url" placeholder="https://your-police-department.gov/..." value={agencyUrl} onChange={e=>setAgencyUrl(e.target.value)} className="mt-1 w-full rounded border bg-background p-3"/></label><button type="button" onClick={openAgency} className="rounded border px-4 py-2 text-sm">Open official reporting website</button><p className="text-xs text-muted-foreground">The app cannot transfer your Word document or video to that website. Attach the files yourself when the agency accepts evidence.</p></div>
   {status&&<p role="status" className="rounded border p-3 text-sm">{status}</p>}
 </section>
}