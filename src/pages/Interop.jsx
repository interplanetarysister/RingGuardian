import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Check, X, Loader2, Send, ShieldCheck, FileJson, Truck, Info } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import { loadBoard } from '@/lib/board';
import { gateway, demoToken } from '@/lib/demo';
import { REQUEST_STATUS, meta } from '@/lib/status';
import { formatDateTime } from '@/lib/format';

const CONTRACT = [
  { method: 'POST', path: '/v1/footage-requests', action: 'request_footage', who: 'Package P.I.', desc: 'Create an evidence request for a tracking number.' },
  { method: 'GET', path: '/v1/footage-requests', action: 'list_requests', who: 'Both', desc: 'List requests for the session with their disclosure state.' },
  { method: 'GET', path: '/v1/footage-requests/{id}', action: 'get_request', who: 'Both', desc: 'Read one request and the released evidence, if any.' },
  { method: 'POST', path: '/v1/footage-requests/{id}/decision', action: 'decide', who: 'Ring Guardian', desc: 'Approve or decline disclosure at a stated redaction level.' },
  { method: 'POST', path: '/v1/footage-requests/{id}/deliver', action: 'deliver', who: 'Ring Guardian', desc: 'Release the approved sample clip or the approved summary.' }
];

export default function Interop() {
  const [board, setBoard] = useState(null);
  const [response, setResponse] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ tracking_number: 'TBA304711902417', scope: 'Delivery window 2026-10-20 16:30-16:50', justification: 'Customer disputes delivery and requests any available evidence.' });

  const load = useCallback(async () => {
    const b = await loadBoard();
    setBoard(b);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function call(action, payload) {
    setBusy(action);
    setError('');
    try {
      const res = await gateway({ action, ...payload });
      setResponse(res);
      if (res?.ok === false) setError(res.error || 'The contract returned an error.');
      await load();
    } catch (err) {
      setError(err?.message || 'The contract call failed.');
    } finally {
      setBusy('');
    }
  }

  if (!board) return <div className="h-40 animate-pulse rounded-lg bg-muted/40" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Package P.I. interoperability</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          A versioned evidence-request contract between two separate applications. Package P.I. asks for the
          last-known footage; Ring Guardian locates the package, opens a review, and only releases what the investigator
          approves.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <Panel
            title="Simulate a Package P.I. request"
            subtitle="This is what the companion application sends"
            actions={<StatusPill tone="info" label="API v1.0.0" />}
          >
            <div className="space-y-2">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Tracking number</label>
                <select
                  value={form.tracking_number}
                  onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {board.shipments.map((s) => (
                    <option key={s.id} value={s.tracking_number}>{s.tracking_number} — {s.scenario_title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Requested window</label>
                <input
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Justification</label>
                <textarea
                  value={form.justification}
                  onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <button
                onClick={() => call('request_footage', form)}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy === 'request_footage' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Send request
              </button>
              <p className="flex items-start gap-1 text-[10px] leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                Authenticated with a locally generated demonstration bearer token ({demoToken().slice(0, 8)}…). No real
                credential is used or accepted.
              </p>
            </div>
          </Panel>

          <Panel title="Documented contract" subtitle="Function endpoints behind the versioned envelope" dense>
            <ul className="divide-y divide-border/70">
              {CONTRACT.map((c) => (
                <li key={c.action} className="px-4 py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rgc-mono rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">{c.method}</span>
                    <span className="rgc-mono text-[10px] text-foreground">{c.path}</span>
                    <span className="ml-auto text-[9px] uppercase tracking-wide text-muted-foreground">{c.who}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{c.desc}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Last response envelope" subtitle="Exactly what the caller receives" actions={<FileJson className="h-3.5 w-3.5 text-muted-foreground" />}>
            {response ? (
              <pre className="rgc-scroll max-h-[240px] overflow-auto rounded-md bg-[#070d16] p-2.5 text-[10px] leading-relaxed text-muted-foreground">
{JSON.stringify(response, null, 2)}
              </pre>
            ) : (
              <p className="text-[11px] text-muted-foreground">Send or decide a request to see the response envelope.</p>
            )}
            {error ? <p className="mt-2 text-[10px] text-tone-danger">{error}</p> : null}
          </Panel>
        </div>

        <Panel title="Request queue" subtitle="Investigator review is required before anything is released" dense>
          {board.requests.length === 0 ? (
            <p className="px-4 py-6 text-[11px] text-muted-foreground">No requests in this session.</p>
          ) : (
            <ul className="rgc-scroll max-h-[760px] divide-y divide-border/70 overflow-y-auto">
              {board.requests.map((r) => {
                const status = meta(REQUEST_STATUS, r.status);
                return (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="rgc-mono text-[11px] font-medium text-foreground">{r.request_id}</span>
                      <StatusPill tone={status.tone} label={status.label} />
                    </div>
                    <p className="rgc-mono mt-0.5 text-[10px] text-primary">{r.tracking_number}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{r.scope}</p>
                    <p className="mt-0.5 text-[10px] italic leading-relaxed text-muted-foreground">{r.justification}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Truck className="h-2.5 w-2.5" /> {r.requester_system}</span>
                      <span>{formatDateTime(r.requested_at)}</span>
                      <span className="rgc-mono">{r.api_version}</span>
                    </p>

                    {r.status === 'pending' ? (
                      <div className="mt-1.5 flex gap-1.5">
                        <button
                          onClick={() => call('decide', { request_id: r.request_id, decision: 'approve', redaction_level: 'faces_blurred_and_audio_removed' })}
                          disabled={Boolean(busy)}
                          className="inline-flex items-center gap-1 rounded bg-tone-ok/15 px-2 py-1 text-[10px] font-semibold text-tone-ok ring-1 ring-inset ring-tone-ok/30 disabled:opacity-50"
                        >
                          {busy === 'decide' ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5" />} Approve redacted
                        </button>
                        <button
                          onClick={() => call('decide', { request_id: r.request_id, decision: 'reject' })}
                          disabled={Boolean(busy)}
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          <X className="h-2.5 w-2.5" /> Decline
                        </button>
                      </div>
                    ) : null}

                    {r.status === 'approved' ? (
                      <button
                        onClick={() => call('deliver', { request_id: r.request_id })}
                        disabled={Boolean(busy)}
                        className="mt-1.5 inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        {busy === 'deliver' ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <ArrowLeftRight className="h-2.5 w-2.5" />} Release evidence
                      </button>
                    ) : null}

                    {r.decision_note ? (
                      <p className="mt-1.5 rounded border border-border bg-muted/25 p-1.5 text-[10px] leading-relaxed text-muted-foreground">
                        {r.decision_note}
                        {r.redaction_level ? <span className="rgc-mono block text-foreground">redaction: {r.redaction_level}</span> : null}
                      </p>
                    ) : null}
                    {r.response_summary ? (
                      <p className="mt-1 text-[10px] text-tone-ok">{r.response_summary}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          This is a demonstration contract, not a production integration. Package P.I. and Ring Guardian are separate
          submissions and have not been certified against each other. No real customer data exists on either side, and
          nothing is released without an explicit investigator decision.
        </p>
      </div>
    </div>
  );
}