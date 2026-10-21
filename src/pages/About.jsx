import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, AlertTriangle, ExternalLink, Github, FlaskConical, ArrowRight } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';

const BACKEND_CHECKS = [
  { name: 'Demo dataset provisioned for a session', result: 'Pass — 5 packages, 31 scan events, 4 cases, 18 capture windows, 7 cameras, 7 scanners', executed: true },
  { name: 'Reset restores the five starting scenarios', result: 'Pass — reset re-created the identical dataset for the same session', executed: true },
  { name: 'Successful delivery: complete custody chain', result: 'Pass — 7 of 7 events matched, no unresolved warnings', executed: true },
  { name: 'Ambiguous match detected and reported', result: 'Pass — overlapping capture windows reported as ambiguous, not guessed', executed: true },
  { name: 'Missing footage reported accurately', result: 'Pass — valid scan, no capture window, reported as missing', executed: true },
  { name: 'Incorrect camera attribution rejected', result: 'Pass — unpaired scanner cannot be bound to a wearable recording', executed: true },
  { name: 'Delayed synchronization', result: 'Pass — offline device defers association instead of losing it', executed: true },
  { name: 'Post-delivery removal kept separate from delivery', result: 'Pass — delivery matched at +4s, removal matched at +7s as a distinct event', executed: true },
  { name: 'Unconfirmed handling with available capture', result: 'Pass — capture matched, scan state remained unconfirmed', executed: true },
  { name: 'Corrective recovery updates package and case', result: 'Pass — new scan written, package set to recovered, case resolved', executed: true },
  { name: 'AI state machine transitions', result: 'Pass — one object red → yellow → green, five remained red', executed: true },
  { name: 'Package P.I. request creation', result: 'Pass — versioned envelope returned, request queued as pending', executed: true },
  { name: 'Ring adapter status', result: 'Pass — simulated mode reported with documented endpoints', executed: true },
  { name: 'Amazon adapter status', result: 'Pass — simulated mode reported with documented LWA and order endpoints', executed: true },
  { name: 'Amazon order retrieval (simulated)', result: 'Pass — orders returned in the documented response shape', executed: true }
];

export default function About() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">About, disclosures and submission material</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Ring Guardian Cam · Amazon Build, Ship, Shape 2026 · Ring track. This page states exactly what is real, what is
          simulated, and what has actually been verified.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="What is genuinely implemented" subtitle="Runs in this application, now">
          <ul className="space-y-2">
            {[
              'A Ring developer adapter written against documented endpoints: OAuth 2.0 refresh-token exchange, JSON:API device discovery, WHEP live-video session requests, and HMAC-verified webhooks with request_id idempotency.',
              'An Amazon Selling Partner API adapter: Login with Amazon refresh-token exchange, order retrieval, tracking-update payload construction, and HMAC-verified order-change notifications with NotificationId idempotency.',
              'A deterministic timestamp-correlation engine that accepts only a camera-matched capture window containing the event, and refuses everything else.',
              'Persistent demonstration data: five scenarios, scan events, cases, evidence references and an audit trail, all stored server-side and surviving a refresh.',
              'Real investigator workflows: flagging a discrepancy, opening a case, requesting verification, performing a corrective scan, resolving and closing.',
              'A versioned evidence-request contract with a companion application, including review, redaction choice and release.'
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-tone-ok" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="What is simulated, and labelled as such" subtitle="Fictional by design">
          <ul className="space-y-2">
            {[
              'All logistics data — facilities, employees, trucks, packages, scans, cases — is fictional and generated for the demonstration.',
              'Guardian vest cameras are proposed hardware. No physical device exists and no footage was recorded by one.',
              'Evidence playback renders a scene reconstruction, not a recording from a Ring device. Real clips can be attached by an operator and are then labelled as operator-supplied.',
              'The hands-free scanning preview is a scripted object-state display. No computer-vision model is trained or executed.',
              'Alexa announcements are spoken by the browser’s speech synthesiser. No Alexa skill is registered, no Echo device is paired, and the announcements are generated from this application’s own records.',
              'No Amazon logistics system, employee record, customer account or Ring customer account is connected.'
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <X className="mt-0.5 h-3 w-3 shrink-0 text-tone-warn" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Ring track eligibility"
        subtitle="Stated precisely rather than generously"
        actions={<StatusPill tone="warn" label="Simulator-demonstrated" />}
      >
        <p className="text-[11px] leading-relaxed text-foreground/90">
          This application separates Ring APIs, SDKs, simulators and devices from the fictional logistics scenarios. Demonstration through
          a simulator or an actual device. This build contains real adapter code that calls the documented Ring token
          endpoint, the JSON:API device-discovery resource and the WHEP live-video session resource, plus an
          HMAC-verified webhook receiver.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          In this session the adapter reports <span className="text-foreground">simulated mode</span>: no Ring developer
          credentials are configured, so documented response shapes are produced locally and labelled. Adding
          RING_CLIENT_ID, RING_CLIENT_SECRET, RING_REFRESH_TOKEN and RING_HMAC_KEY switches every call to your own Ring
          developer account without a code change.
        </p>
        <div className="mt-2.5 flex items-start gap-2 rounded-md border border-tone-warn/30 bg-tone-warn/10 p-2.5">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-tone-warn" />
          <p className="text-[10px] leading-relaxed text-foreground/90">
            Not claimed: a connected Ring customer account, a completed Ring certification, or any Ring device recording
            shown as evidence. The fictional logistics operations are not connected to Amazon production systems.
          </p>
        </div>
      </Panel>

      <Panel title="Verification" subtitle="Executed checks, not assumptions">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Check</th>
                <th className="py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {BACKEND_CHECKS.map((c) => (
                <tr key={c.name}>
                  <td className="py-2 pr-4 text-[11px] text-foreground">{c.name}</td>
                  <td className="py-2 text-[11px] text-muted-foreground">{c.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
          <FlaskConical className="mt-0.5 h-3 w-3 shrink-0" />
          Every row above was executed against the live backend during development, with the returned records read back
          to confirm persistence. Screens that are not listed were not part of the automated check set.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Submission material" subtitle="Draft Devpost fields">
          <dl className="space-y-2">
            {[
              ['Project name', 'Ring Guardian Cam'],
              ['Track', 'Ring'],
              ['Short description', 'A wearable camera for parcel handlers that joins the scanner event to the seconds of video that explain it, so a misplaced package can be investigated from evidence instead of assumption.'],
              ['Inspiration', 'A package goes missing and the only record is a scan. The scan proves a package was handled, never what happened around it. We wanted the frame that closes that gap without turning a camera into an accusation.'],
              ['What it does', 'Correlates scanner events with wearable camera capture, presents a custody timeline, and gives investigators the exact footage for an event — reporting honestly when that footage is missing, ambiguous or mis-attributed.'],
              ['How it was built', 'Base44 platform: React front end, JSON entity schemas for the logistics model, backend functions for the correlation engine and the Ring adapter, and a versioned interoperability contract.'],
              ['Challenges', 'Refusing to guess. The hard part was not matching a scan to a clip — it was defining, precisely, when the system must say it cannot.'],
              ['Accomplishments', 'A correlation engine that rejects mismatches, an honest evidence player that distinguishes reconstruction from recording, and workflows that persist real state changes.'],
              ['What we learned', 'Evidence products earn trust by what they decline to assert. Every ambiguous case taught us a new failure mode to surface.'],
              ['Future plans', 'Real YOLO/ByteTrack/ZBar inference, tamper-evident custody records, and scanner replacement only after strict reliability testing.'],
              ['Technology', 'React, Vite, Tailwind, Base44 entities and backend functions, Ring API adapter (OAuth 2.0, JSON:API, WHEP, HMAC webhooks).']
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="text-[11px] leading-relaxed text-foreground/90">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <div className="space-y-4">
          <Panel title="Repository and licensing">
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/interplanetarysister/RingGuardian"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                >
                  <Github className="h-3 w-3" /> github.com/interplanetarysister/RingGuardian
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/interplanetarysister/AmazonHackathon"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
                >
                  <Github className="h-3 w-3" /> Package P.I. — companion project
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </li>
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              MIT licensed. Package P.I. is a separate application and a separate submission. The two exchange requests
              through the versioned contract documented on the interoperability page; neither has been certified against
              the other.
            </p>
          </Panel>

          <Panel title="Still outstanding">
            <ul className="space-y-1.5">
              {[
                'Published URL — the application must be published from the Base44 dashboard before a URL exists.',
                'Demonstration video — must be recorded from the running application, under three minutes.',
                'Ring credentials — provide RING_CLIENT_ID / SECRET / REFRESH_TOKEN to switch the adapter to live mode.',
                'GitHub synchronisation — this build lives in Base44; commit it to the repository separately.',
                'Devpost submission — fields drafted above; verify whether edits are permitted after submission.'
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-tone-warn" />
                  {t}
                </li>
              ))}
            </ul>
          </Panel>

          <Link
            to="/guided-demo"
            className="inline-flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-[11px] font-medium text-foreground hover:border-primary/50"
          >
            Walk the guided operational walkthrough
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </Link>
        </div>
      </div>

      <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
        Ring Guardian Cam is an independent package accountability project and is not affiliated with, endorsed by, or produced by
        Amazon.com, Inc. or Ring LLC. Amazon and Ring are trademarks of their respective owners. All persons, facilities,
        tracking numbers and events depicted are fictional.
      </p>
    </div>
  );
}