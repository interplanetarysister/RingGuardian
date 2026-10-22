import React, { useCallback, useEffect, useState } from 'react';
import {
  Radio, RefreshCw, Loader2, Wifi, Monitor, Video, Webhook, AlertTriangle,
  Check, ServerCog, KeyRound
} from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import { ring } from '@/lib/demo';
import { percent } from '@/lib/format';

export default function RingIntegration() {
  const [status, setStatus] = useState(null);
  const [devices, setDevices] = useState(null);
  const [events, setEvents] = useState(null);
  const [session, setSession] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const res = await ring({ action: 'status' });
      setStatus(res);
    } catch (err) {
      setError(err?.message || 'The Ring adapter did not respond.');
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function load(kind) {
    setBusy(kind);
    setError('');
    try {
      if (kind === 'devices') {
        const res = await ring({ action: 'devices' });
        setDevices(res);
        const first = res?.payload?.data?.[0]?.id;
        setSelectedDeviceId((previous) => res?.payload?.data?.some((d) => d.id === previous) ? previous : (first || ''));
        setEvents(null);
        setSession(null);
      } else if (kind === 'events') {
        if (!selectedDeviceId) throw new Error('Discover a Ring device first.');
        const res = await ring({ action: 'events', device_id: selectedDeviceId });
        setEvents(res);
      } else if (kind === 'whep') {
        if (!selectedDeviceId) throw new Error('Discover a Ring device first.');
        const res = await ring({ action: 'whepSession', device_id: selectedDeviceId });
        setSession(res);
      }
    } catch (err) {
      setError(err?.message || 'The Ring call failed.');
    } finally {
      setBusy('');
    }
  }

  const live = status?.mode === 'live' || status?.mode === 'playground';
  const verifiedLive = live && (devices?.mode === 'live' || devices?.mode === 'playground');
  const deviceRows = devices?.payload?.data || [];
  const eventRows = events?.payload?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Ring developer integration</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            The Ring-track capability. This adapter calls documented Ring endpoints; when credentials are present it
            performs real OAuth and device calls, and otherwise reproduces the documented response shapes locally and
            labels them as simulated.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {status ? (
            <StatusPill tone={live ? 'ok' : 'warn'} label={status?.mode === 'playground' ? 'Official Playground API' : live ? 'Live credentials' : 'Local simulation'} />
          ) : (
            <StatusPill tone="muted" label="Checking" />
          )}
          <button
            onClick={loadStatus}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-tone-danger/40 bg-tone-danger/10 p-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tone-danger" />
          <p className="text-[11px] text-foreground">{error}</p>
        </div>
      ) : null}

      <div role="status" className="rounded-md border border-border bg-card p-3 text-xs leading-relaxed text-foreground"><strong>Ring Cameras — intended home-delivery monitoring integration.</strong> Currently implemented: a Ring API adapter and fictional camera/evidence demonstration. A verified customer Ring camera stream is not connected. This app is independent and is not an official Ring product.<p className="mt-2"/>
        <strong>Verification boundary:</strong> A simulated device list or a configured secret does not prove an official Ring connection.
        Live or Playground mode requires a successful authenticated device API call. Synthetic camera events and hypothetical wearables are demonstration assets, not real Ring hardware footage.
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <Panel title="Adapter state" subtitle={status?.mode === 'playground' ? 'Official Ring Developer Playground API token' : live ? 'Calls use authorized Ring OAuth credentials' : 'Local mock responses only — not official Playground'}>
            {!status ? (
              <div className="h-24 animate-pulse rounded bg-muted/50" />
            ) : (
              <div className="space-y-2.5">
                <dl className="grid grid-cols-1 gap-2">
                  <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Credentials</dt>
                      <dd className="text-[11px] text-foreground">
                        {status.credentials_configured ? 'Configured' : 'Not configured'}
                      </dd>
                    </div>
                    <KeyRound className={'h-3.5 w-3.5 ' + (status.credentials_configured ? 'text-tone-ok' : 'text-muted-foreground')} />
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Token endpoint</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">{status.endpoints.token_url}</dd>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">API base</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">{status.endpoints.api_base}</dd>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Device discovery</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">{status.endpoints.device_discovery}</dd>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Live video session</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">{status.endpoints.live_video_session}</dd>
                  </div>
                </dl>
                <p className="text-[10px] leading-relaxed text-muted-foreground">{status.note}</p>
              </div>
            )}
          </Panel>

          <Panel title="Capabilities exercised" dense>
            <ul className="divide-y divide-border/70">
              {(status?.capabilities || []).map((c) => (
                <li key={c} className="flex items-start gap-2 px-4 py-2">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-tone-ok" />
                  <span className="text-[11px] leading-relaxed text-foreground/90">{c}</span>
                </li>
              ))}
              {status ? (
                <li className="flex items-start gap-2 px-4 py-2">
                  <ServerCog className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="text-[11px] leading-relaxed text-foreground/90">
                    Rate limit honoured: {status.rate_limit_rps} requests per second
                  </span>
                </li>
              ) : null}
            </ul>
          </Panel>

          <Panel title="Call the adapter" subtitle="Discover an authorized device before requesting its events or live session">
            {devices && <label className="mb-3 block text-xs text-foreground">Selected device
              <select className="mt-1 w-full rounded border border-border bg-card p-2" value={selectedDeviceId} onChange={e => { setSelectedDeviceId(e.target.value); setEvents(null); setSession(null); }}>
                {!deviceRows.length && <option value="">No devices found</option>}
                {deviceRows.map(d => <option key={d.id} value={d.id}>{d.attributes?.name || 'Ring device'} ({d.id})</option>)}
              </select>
            </label>}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => load('devices')}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy === 'devices' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Monitor className="h-3 w-3" />} Discover devices
              </button>
              <button
                onClick={() => load('events')}
                disabled={Boolean(busy) || !selectedDeviceId}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50 disabled:opacity-50"
              >
                {busy === 'events' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Webhook className="h-3 w-3" />} Event history
              </button>
              <button
                onClick={() => load('whep')}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50 disabled:opacity-50"
              >
                {busy === 'whep' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Video className="h-3 w-3" />} Request live session
              </button>
            </div>

            {session ? (
              <div className="mt-2.5 rounded-md border border-border bg-muted/25 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">WHEP session</p>
                <p className="mt-1 text-[11px] text-foreground">
                  {session.mode === 'live' ? 'Live session negotiated.' : 'Simulated session descriptor returned.'}
                </p>
                <pre className="rgc-scroll mt-1 max-h-[120px] overflow-auto rounded bg-[#070d16] p-2 text-[9px] leading-relaxed text-muted-foreground">
{session.answer_sdp || JSON.stringify(session.payload?.data?.attributes || {}, null, 2)}
                </pre>
                <p className="mt-1 text-[10px] text-muted-foreground">Audio is never requested — Ring live video is video only.</p>
              </div>
            ) : null}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Devices"
            subtitle={devices ? (devices.mode === 'live' ? 'Returned by the Ring API' : 'Simulated payload') : 'Call device discovery to load'}
            actions={devices ? <StatusPill tone={devices.mode === 'live' ? 'ok' : 'warn'} label={devices.mode} /> : null}
            dense
          >
            {!devices ? (
              <p className="px-4 py-6 text-[11px] text-muted-foreground">No device payload loaded yet.</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {deviceRows.map((d) => (
                  <li key={d.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Wifi className="h-3 w-3 text-tone-ok" />
                      <span className="text-[11px] font-medium text-foreground">{d.attributes?.name}</span>
                      <span className="rgc-mono ml-auto text-[10px] text-muted-foreground">{d.id}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {d.attributes?.device_type} · {d.attributes?.status} · fw {d.attributes?.firmware_version}
                      {d.attributes?.battery_life ? ' · battery ' + d.attributes.battery_life + '%' : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {devices?.payload?.meta?.note ? (
              <p className="border-t border-border px-4 py-2 text-[10px] leading-relaxed text-muted-foreground">
                {devices.payload.meta.note}
              </p>
            ) : null}
          </Panel>

          <Panel
            title="Webhook events"
            subtitle={events ? (events.mode === 'live' ? 'Returned by the Ring API' : 'Simulated event payloads') : 'Call event history to load'}
            actions={events ? <StatusPill tone={events.mode === 'live' ? 'ok' : 'warn'} label={events.mode} /> : null}
            dense
          >
            {!events ? (
              <p className="px-4 py-6 text-[11px] text-muted-foreground">No event payload loaded yet.</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {eventRows.map((e) => (
                  <li key={e.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Radio className="h-3 w-3 text-tone-info" />
                      <span className="rgc-mono text-[10px] text-foreground">{e.attributes?.event_type}</span>
                      <span className="rgc-mono ml-auto text-[10px] text-muted-foreground">{e.attributes?.request_id}</span>
                    </div>
                    {e.attributes?.classification ? (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        human {percent(e.attributes.classification.human)} · animal {percent(e.attributes.classification.animal)} ·
                        vehicle {percent(e.attributes.classification.vehicle)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Webhook receiver" subtitle="How Ring events would reach this application">
            <ul className="space-y-2">
              {[
                'Ring posts motion, device-added and device-removed events to the adapter endpoint.',
                'Every payload is verified with an HMAC SHA-256 signature before anything is recorded.',
                'Duplicate deliveries are discarded using the request_id as an idempotency key.',
                'The endpoint answers within five seconds and records only an audit entry — never package state.'
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-tone-ok" />
                  {t}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-tone-warn/30 bg-tone-warn/10 p-3">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-tone-warn" />
        <p className="text-[10px] leading-relaxed text-foreground/90">
          <span className="font-semibold">Track eligibility, stated plainly.</span> {verifiedLive ? 'Device discovery returned a live API response, but a functioning Ring Playground video or physical-device demonstration must still be verified. ' : 'No verified live Ring-device result is shown on this page. The locally generated fixtures do not establish Ring-track eligibility. '} The adapter is real code against
          documented Ring endpoints, and an adapter must be tested against the actual authorized provider before claiming a live integration. What is not
          claimed: a Ring customer account is connected, a certification has been completed, or any Ring recording is
          shown. Adding RING_CLIENT_ID, RING_CLIENT_SECRET and RING_REFRESH_TOKEN switches every call above to your own
          Ring developer account.
        </p>
      </div>
    </div>
  );
}