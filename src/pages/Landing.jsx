import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, ShieldCheck, Camera, ScanLine, Clapperboard, VideoOff, Check, X } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import SceneStage from '@/components/evidence/SceneStage';
import StatusPill from '@/components/common/StatusPill';
import { loadBoard } from '@/lib/board';
import { SHIPMENT_STATUS, meta } from '@/lib/status';

const TRACK = [
  { icon: ScanLine, title: 'The scanner identifies the package', body: 'Existing handheld and wearable scanners stay the authoritative record. Nothing here replaces them.' },
  { icon: Camera, title: 'The camera records the perspective', body: 'A forward-facing camera on the safety vest captures what the associate physically did.' },
  { icon: Clapperboard, title: 'The software joins the timestamps', body: 'Scanner, work session, camera and facility are correlated into one addressable evidence record.' }
];

export default function Landing() {
  const [shipments, setShipments] = useState([]);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let alive = true;
    loadBoard()
      .then((board) => {
        if (!alive) return;
        setShipments(board.shipments);
        setState('ready');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold tracking-tight text-foreground">Ring Guardian Cam</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Evidence console</p>
          </div>
          <div className="flex-1" />
          <ThemeToggle />
          <Link to="/about" className="hidden text-xs text-muted-foreground hover:text-foreground sm:block">
            What is simulated
          </Link>
          <Link to="/live-events" className="text-xs text-muted-foreground hover:text-foreground">
            Console
          </Link>
        </div>
      </header>

      <section className="rgc-grid-bg border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Package accountability · Camera and scanner evidence
              </span>
            </div>

            <h1 className="mt-4 font-heading text-[32px] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[42px]">
              Every scan,
              <br />
              with the frame that proves it.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              A wearable camera for associates who handle parcels, joined to the scanners they already carry. When a
              package goes astray, an investigator opens the exact seconds of video that correspond to the scan — and
              sees what the record cannot tell them.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link to="/customer-report" className="rounded-lg border border-primary/40 bg-card p-4 hover:border-primary"><span className="block text-sm font-bold">Amazon customer</span><span className="block mt-1 text-xs text-muted-foreground">Prepare a missing-package report and camera evidence</span></Link>
              <Link to="/management" className="rounded-lg border border-primary/40 bg-card p-4 hover:border-primary"><span className="block text-sm font-bold">Operations management</span><span className="block mt-1 text-xs text-muted-foreground">Wearable cameras, scanners and investigations — demo access only</span></Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Enter the demo
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/live-events"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:border-primary/50"
              >
                <Play className="h-3.5 w-3.5" />
                Simulated live events
              </Link>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              No account needed. Five fictional package scenarios are created for your session and can be reset at any
              time.
            </p>

            <dl className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-5">
              {[
                { k: '5', v: 'package scenarios' },
                { k: '31', v: 'scan events' },
                { k: '18', v: 'evidence windows' }
              ].map((item) => (
                <div key={item.v}>
                  <dt className="font-heading text-xl font-semibold tracking-tight text-foreground">{item.k}</dt>
                  <dd className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="rgc-mono text-[10px] text-muted-foreground">TBA304711915063 · dock 2</span>
                <StatusPill tone="warn" label="Misroute detected" />
              </div>
              <SceneStage scene="dock_misroute" progress={0.62} />
              <div className="space-y-1.5 border-t border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rgc-mono text-[10px] text-muted-foreground">17:22:36</span>
                  <span className="text-[10px] text-foreground">Loading scan — TRL-3388</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rgc-mono text-[10px] text-muted-foreground">+6s</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-tone-warn">
                    <VideoOff className="h-2.5 w-2.5" /> parcel placed beside the trailer
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Scene reconstruction shown. Not device footage.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">How it works</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TRACK.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rgc-panel p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/40">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span className="rgc-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                </div>
                <p className="mt-2.5 text-xs font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your session</p>
            <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight text-foreground">Five packages, five different problems</h2>
          </div>
          <Link to="/packages" className="text-xs text-primary hover:underline">
            Open all packages
          </Link>
        </div>

        {state === 'loading' ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="rgc-panel h-32 animate-pulse" />
            ))}
          </div>
        ) : state === 'error' ? (
          <p className="mt-4 rounded-md border border-tone-danger/30 bg-tone-danger/10 p-3 text-xs text-tone-danger">
            The demonstration dataset could not be loaded. Reload the page to try again.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shipments.map((s) => {
              const status = meta(SHIPMENT_STATUS, s.status);
              return (
                <Link
                  key={s.id}
                  to={`/packages/${s.tracking_number}`}
                  className="rgc-panel group flex flex-col justify-between p-4 transition-colors hover:border-primary/50"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rgc-mono text-[11px] text-foreground">{s.tracking_number}</span>
                      <StatusPill tone={status.tone} label={status.label} />
                    </div>
                    <p className="mt-2 text-xs font-medium text-foreground">{s.scenario_title}</p>
                    <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">{s.scenario_summary}</p>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Investigate <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-10 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-tone-ok">What is real here</p>
            <ul className="mt-3 space-y-2">
              {[
                'A working Ring developer adapter: OAuth 2.0 refresh-token exchange, JSON:API device discovery, WHEP live-video session requests, and HMAC-verified webhooks with request_id idempotency.',
                'A real persistence layer. Every scan, case, decision and recovery you perform is written to the database and survives a refresh.',
                'A deterministic timestamp-correlation engine that rejects mismatches instead of guessing.'
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-tone-ok" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-tone-warn">What is simulated</p>
            <ul className="mt-3 space-y-2">
              {[
                'All logistics data: facilities, employees, trucks, packages, scans and cases are fictional.',
                'Guardian vest cameras are proposed hardware. No such device exists in this build.',
                'Evidence playback renders a scene reconstruction, not a recording from a Ring device.',
                'No Amazon logistics system, employee record or customer account is connected.'
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                  <X className="mt-0.5 h-3 w-3 shrink-0 text-tone-warn" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 py-6">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Ring Guardian Cam is an independent package accountability project. Not an Amazon or Ring product. Amazon and Ring are
          trademarks of their respective owners.
        </p>
      </footer>
    </div>
  );
}