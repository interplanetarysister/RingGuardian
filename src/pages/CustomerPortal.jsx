import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/** Customer-side reporting. Deliberately keeps evidence local until a real, authorized carrier adapter is configured. */
export default function CustomerPortal() {
  const [report, setReport] = useState({ carrier: 'Amazon Logistics', trackingNumber: '', orderNumber: '', issue: 'Package marked delivered but missing', expectedAddress: '', eventDate: '', description: '', evidenceNotes: '' });
  const [attachments, setAttachments] = useState([]);
  const set = (field, value) => setReport(previous => ({ ...previous, [field]: value }));
  const saveDraft = () => {
    const payload = { format: 'ring-guardian-customer-report-v1', status: 'draft-not-submitted', createdAt: new Date().toISOString(), ...report, evidenceFiles: attachments.map(file => ({ name: file.name, type: file.type, size: file.size })) };
    const objectURL = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = objectURL; link.download = 'ring-guardian-report-draft.json'; link.click(); setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  };
  return <div className="max-w-3xl mx-auto p-5 space-y-6">
    <div><h1 className="text-2xl font-bold">Customer package report</h1><p className="text-sm text-muted-foreground">Prepare and review a report with delivery details and your own camera evidence. This preview does not send data to carriers.</p></div>
    <div className="rounded-xl border p-4 space-y-2">
      <h2 className="font-semibold">1. Connect your camera</h2>
      <p className="text-sm">Link your own Ring account through an approved connection. No Ring login or video access is claimed until authorization is available.</p>
      <Link to="/ring" className="text-primary underline">View Ring connection options</Link>
    </div>
    <form onSubmit={e => { e.preventDefault(); saveDraft(); }} className="rounded-xl border p-4 space-y-4">
      <h2 className="font-semibold">2. Edit delivery report</h2>
      {[
        ['carrier','Delivery service'],['trackingNumber','Tracking number'],['orderNumber','Order number (optional)'],
        ['issue','What happened?'],['expectedAddress','Delivery address'],['eventDate','Delivery date and time'],
        ['description','Details for the carrier'],['evidenceNotes','Video timestamps and evidence description']
      ].map(([field,label]) => <label key={field} className="block space-y-1 text-sm"><span className="font-medium">{label}</span>
        {['description','evidenceNotes'].includes(field) ? <textarea className="w-full rounded-md border bg-background p-2" rows={3} value={report[field]} onChange={e=>set(field,e.target.value)}/> :
        <input className="w-full rounded-md border bg-background p-2" value={report[field]} onChange={e=>set(field,e.target.value)}/>}
      </label>)}
      <label className="block space-y-1 text-sm"><span className="font-medium">3. Select evidence files from your device</span><input type="file" accept="video/*,image/*,.pdf" multiple className="block w-full" onChange={e=>setAttachments(Array.from(e.target.files || []))}/></label>
      <p className="text-xs text-muted-foreground">Files remain on your device. The exported draft includes filenames and descriptions, not copies of the files. Attach them separately when submitting with your carrier.</p>
      <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-3 font-semibold">Save report draft</button>
    </form>
    <div className="rounded-xl border p-4 space-y-2"><h2 className="font-semibold">4. Send to your delivery service</h2>
      <p className="text-sm">Review your saved report, then submit it with evidence using your carrier’s official support process. Automatic submission is not yet connected.</p>
    </div>
  </div>;
}
