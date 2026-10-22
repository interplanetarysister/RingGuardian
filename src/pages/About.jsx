import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Package, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';

const features = [
  { title: 'Package history', body: 'Compare shipping events, tracking records and last confirmed custody.' },
  { title: 'Doorstep evidence', body: 'View authorized camera video independently from fictional scenario illustrations. Recordings must match their package and doorway.' },
  { title: 'Investigation workflow', body: 'Customers report the issue and review available evidence. Management traces the shipment, compares records and documents its findings.' },
  { title: 'Privacy and provenance', body: 'Camera authorization, device identity, recording origin and customer sharing consent remain separate from simulated data.' }
];

export default function About() {
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 text-foreground sm:p-6">
      <header className="rounded-2xl border-2 border-teal-500 bg-card p-5">
        <p className="text-xs font-black uppercase tracking-wider text-teal-500">Ring Guardian</p>
        <h1 className="mt-2 text-3xl font-black">A clearer picture of every delivery</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed">
          Ring Guardian brings package movements, camera evidence and customer reports into one organized investigation.
          A tracking status alone cannot establish where a package was physically handed off.
        </p>
      </header>
      <section className="grid gap-0 overflow-hidden rounded-2xl border-2 border-border sm:grid-cols-2">
        {features.map(({title,body},i) => <article key={title} className="border border-border bg-card p-5">
          <div className="flex items-center gap-2">{i===0?<Package size={21}/>:i===1?<Camera size={21}/>:<ShieldCheck size={21}/>}
            <h2 className="text-lg font-black">{title}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </article>)}
      </section>
      <section className="rounded-xl border-2 border-orange-500 bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-black"><AlertTriangle size={20}/> Understanding video sources</h2>
        <p className="mt-2 text-sm">A genuine Ring stream must be retrieved through authorized Ring APIs. Fictional illustrations in the demonstration are not recordings of real people, homes or deliveries. An operator may attach appropriately authorized recordings; the source and event must be checked before making any package attribution.</p>
        <p className="mt-2 text-sm">The Ring Developer Playground offers authenticated simulated device streams for development, but it does not guarantee that a package in this application's sample history appears in a particular video. The system must not claim a match based on timing or appearance alone.</p>
      </section>
      <nav className="flex flex-wrap gap-3">
        <Link to="/view/customer" className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Customer deliveries</Link>
        <Link to="/view/management" className="rounded-lg border border-border px-4 py-3 text-sm font-bold">Management investigations</Link>
        <Link to="/ring" className="rounded-lg border border-teal-500 px-4 py-3 text-sm font-bold">Ring camera integration</Link>
        <a href="https://github.com/interplanetarysister/RingGuardian" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-3 text-sm font-bold">Source code <ExternalLink size={14}/></a>
      </nav>
    </main>
  );
}