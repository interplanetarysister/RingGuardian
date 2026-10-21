import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Check, Loader2, ArrowRight, Radio, ScanLine, Clapperboard, AlertTriangle,
  Wrench, CheckCircle2, BrainCircuit, ArrowLeftRight, ShoppingCart, Volume2
} from 'lucide-react';
import Panel from '@/components/common/Panel';
import {startTour} from '@/lib/tour';
import { ops } from '@/lib/demo';

const STEPS = [
  {
    icon: Radio,
    title: 'Ring developer integration',
    body: 'Open the Ring adapter, show the documented endpoints it calls, then discover devices and request a live video session. This is the Ring-track capability.',
    to: '/ring',
    cta: 'Open Ring adapter'
  },
  {
    icon: ShoppingCart,
    title: 'Amazon system integration',
    body: 'Open the Amazon adapter, show the documented Selling Partner API endpoints, then pull orders and preview the tracking update the adapter would send.',
    to: '/amazon',
    cta: 'Open Amazon adapter'
  },
  {
    icon: Volume2,
    title: 'Alexa announcement',
    body: 'Play the briefing. Every announcement is generated from a stored package record, so the voice states exactly what the console shows.',
    to: '/alexa',
    cta: 'Open Alexa voice'
  },
  {
    icon: ScanLine,
    title: 'Simulate a scanner event',
    body: 'On the scanners page, run a test scan. A confirmed synthetic event is written, a capture window covering it is created, and the correlation engine associates the two.',
    to: '/scanners',
    cta: 'Open scanners'
  },
  {
    icon: Clapperboard,
    title: 'Timestamp synchronization',
    body: 'In the synchronization lab, pick any event and run the engine. Show the four outcomes: matched, ambiguous, missing and mis-attributed.',
    to: '/evidence',
    cta: 'Open evidence lab'
  },
  {
    icon: AlertTriangle,
    title: 'Wrong-truck investigation',
    body: 'Open package TBA304711915063. Every scan is valid, but the recording shows the parcel placed beside the wrong trailer.',
    to: '/packages/TBA304711915063',
    cta: 'Open the package'
  },
  {
    icon: Clapperboard,
    title: 'Review the evidence',
    body: 'The loading event is pre-selected. Play the capture, scrub to the scan marker, and note the offset between the scan and the physical action.',
    to: '/packages/TBA304711915063',
    cta: 'Open playback'
  },
  {
    icon: Wrench,
    title: 'Update the logistics record',
    body: 'Perform the corrective recovery from this page. A new scan event is created, the package becomes recovered, and the case resolves.',
    action: 'recover',
    cta: 'Run corrective recovery'
  },
  {
    icon: CheckCircle2,
    title: 'Verified case resolution',
    body: 'Open the resolved case and show the finding, the resolution and the audit trail the action produced.',
    to: '/investigations/CASE-2026-0419',
    cta: 'Open the case'
  },
  {
    icon: BrainCircuit,
    title: 'Hands-free scanning preview',
    body: 'Run the AI preview. One parcel moves red to yellow to green; the other five stay red. The barcode read suggests identity and does not confirm a scan.',
    to: '/ai-tracking',
    cta: 'Open AI preview'
  },
  {
    icon: ArrowLeftRight,
    title: 'Package P.I. footage request',
    body: 'Approve the pending request, release the redacted sample, and show the versioned response envelope returning to the companion application.',
    to: '/interop',
    cta: 'Open the contract'
  }
];

export default function GuidedDemo() {
  const [done, setDone] = useState({});
  const [busy, setBusy] = useState('');
  const [recovery, setRecovery] = useState(null);
  const [error, setError] = useState('');

  async function runRecovery() {
    setBusy('recover');
    setError('');
    try {
      const res = await ops({ action: 'correctiveRecovery', tracking_number: 'TBA304711915063' });
      if (res?.ok === false) throw new Error(res.error);
      setRecovery(res);
      setDone((d) => ({ ...d, 7: true }));
    } catch (err) {
      setError(err?.message || 'The corrective recovery failed.');
    } finally {
      setBusy('');
    }
  }

  const completed = Object.keys(done).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Operational walkthrough</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Eleven steps, about three minutes. Each step opens the exact screen or performs the exact action, so the
            walkthrough and the product are the same thing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: (completed / STEPS.length) * 100 + '%' }} />
          </div>
          <span className="rgc-mono text-[10px] text-muted-foreground">{completed}/{STEPS.length}</span>
        </div>
      </div>

      {error ? <p className="text-[11px] text-tone-danger">{error}</p> : null}

      <button className="rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground" onClick={startTour}>Start interactive audio walkthrough</button>
      <ol className="space-y-2.5">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = Boolean(done[i]);
          return (
            <li key={step.title} className={'rgc-panel p-4 transition-colors ' + (isDone ? 'border-tone-ok/40' : '')}>
              <div className="flex items-start gap-3">
                <span
                  className={
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ' +
                    (isDone ? 'border-tone-ok/50 bg-tone-ok/10 text-tone-ok' : 'border-border bg-muted/40 text-muted-foreground')
                  }
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, '0')}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <h2 className="text-xs font-semibold text-foreground">{step.title}</h2>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{step.body}</p>

                  {step.action === 'recover' ? (
                    <div className="mt-2 space-y-2">
                      <button
                        onClick={runRecovery}
                        disabled={Boolean(busy)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        {busy === 'recover' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3" />}
                        {step.cta}
                      </button>
                      {recovery ? (
                        <div className="rounded-md border border-tone-ok/30 bg-tone-ok/10 p-2.5">
                          <p className="text-[11px] font-medium text-foreground">Package recovered and record updated</p>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                            New corrective scan recorded with a matched capture. Case {recovery.case_number} resolved.
                            Open the package to see the new event in the timeline.
                          </p>
                          <Link
                            to="/packages/TBA304711915063"
                            className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                          >
                            View the updated record <ArrowRight className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <Link
                      to={step.to}
                      onClick={() => setDone((d) => ({ ...d, [i]: true }))}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50"
                    >
                      <Play className="h-3 w-3" /> {step.cta}
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <Panel title="Three-minute shot list" subtitle="For the recorded walkthrough">
        <ol className="space-y-1.5">
          {[
            '0:00 — Landing: the problem, in one sentence.',
            '0:10 — Ring adapter: mode, endpoints, device discovery, live session request.',
            '0:30 — Amazon adapter: endpoints, order pull, tracking-update preview.',
            '0:45 — Alexa voice: play the briefing, generated from the live records.',
            '1:00 — Scanner test scan: a real event written, a real capture matched.',
            '1:20 — Synchronization lab: matched, ambiguous, missing, mis-attributed.',
            '1:40 — Wrong-truck package: play the capture at the scan marker.',
            '2:00 — Corrective recovery: package recovered, case resolved, audit trail updated.',
            '2:20 — Hands-free preview: red to yellow to green, others remain red.',
            '2:35 — Package P.I.: approve, release, show the versioned envelope.',
            '2:55 — Close on the disclosure: what is real, what is simulated.'
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {line}
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}