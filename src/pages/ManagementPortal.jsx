import React from 'react';
import { Link } from 'react-router-dom';
export default function ManagementPortal(){
 return <main className="max-w-4xl mx-auto p-5 space-y-5">
 <h1 className="text-2xl font-bold">Operations management</h1>
 <p className="text-sm text-muted-foreground">Concept preview for a hypothetical battery-powered Ring-style wearable camera that employees could pair during package handling. No such device or supported pairing integration is currently available. This page does not grant Amazon employee access by itself.</p>
 <section className="rounded-xl border p-4 space-y-3"><h2 className="font-semibold">Wearable camera workflow</h2>
 <ol className="list-decimal pl-6 space-y-2 text-sm">
 <li>Administrator verifies the organization and provisions staff roles.</li>
 <li>Demonstrate a future opt-in device pairing flow (QR / device code, battery and connection state), using clearly simulated devices until compatible hardware and APIs exist.</li>
 <li>Track scans, loading-bay arrivals, missing scans and video-event timestamps.</li>
 <li>Flag questionable loading events for authorized human investigation.</li>
 <li>Preserve original evidence, access history, timestamps and review results.</li>
 </ol></section>
 <Link className="block rounded-xl border border-primary/50 bg-card p-5 hover:border-primary" to="/management/walkthrough"><span className="block text-lg font-bold">Start guided delivery evidence walkthrough →</span><span className="block text-sm text-muted-foreground mt-1">Follow a hypothetical battery-powered employee wearable camera at the loading dock, package scanning and truck loading, then a driver camera with simulated GPS-linked doorstep evidence. Compare correct and wrong address cases and export the investigation.</span></Link>
 <div className="grid sm:grid-cols-2 gap-3">
 <Link className="rounded-xl border p-4 underline" to="/cameras">Camera inventory (demo)</Link>
 <Link className="rounded-xl border p-4 underline" to="/scanners">Scan event tracking</Link>
 <Link className="rounded-xl border p-4 underline" to="/investigations">Investigation review</Link>
 <Link className="rounded-xl border p-4 underline" to="/evidence">Evidence records</Link>
 </div>
 <p className="text-sm border rounded-xl p-4">Access warning: these existing operations pages must be protected with verified server-side staff authorization before production use. Simulated device events must always be visibly labeled simulated.</p>
 </main>;
}