import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RingStreamPlayer from '@/components/ring/RingStreamPlayer';
import { loadBoard } from '@/lib/board';
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
  const [packages, setPackages] = useState([]);
  const [packageTracking, setPackageTracking] = useState('');
  const [packageError, setPackageError] = useState('');
  const [devices, setDevices] = useState(null);
  const [events, setEvents] = useState(null);

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
    let alive = true;
    loadBoard().then(b => {
      if (!alive) return;
      const shipments = b?.shipments || [];
      setPackages(shipments);
      const favorite = shipments.find(p => p.scenario_key === 'delivered_but_missing') || shipments[0];
      setPackageTracking(favorite?.tracking_number || '');
    }).catch(() => { if (alive) setPackageError('Demo package list is unavailable. Customer view still has its own sample data.'); });
    return () => { alive = false; };
  }, [loadStatus]);

  async function load(kind) {
    setBusy(kind);
    setError('');
    try {
      if (kind === 'devices') {
        const res = await ring({ action: 'devices' });
        if (!res?.ok) throw new Error(res?.error || 'Ring device discovery failed.');
        setDevices(res);
        const first = res?.payload?.data?.[0]?.id;
        setSelectedDeviceId((previous) => res?.payload?.data?.some((d) => d.id === previous) ? previous : (first || ''));
        setEvents(null);

      } else if (kind === 'events') {
        if (!selectedDeviceId) throw new Error('Discover a Ring device first.');
        const res = await ring({ action: 'events', device_id: selectedDeviceId });
        if (!res?.ok) throw new Error(res?.error || 'Ring event history failed.');
        setEvents(res);
      }
    } catch (err) {
      setError(err?.message || 'The Ring call failed.');
    } finally {
      setBusy('');
    }
  }

  const live = status?.mode === 'live' || status?.mode === 'playground';
  const verifiedLive = live && devices?.official_api_connection === true && (devices?.mode === 'live' || devices?.mode === 'playground');
  const deviceRows = devices?.payload?.data || [];
  const eventRows = events?.payload?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Ring developer integration</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            The Ring-track demo and live API surface. The adapter calls Ring endpoints; when credentials are present it
            performs real OAuth and device calls, and otherwise reproduces the documented response shapes locally and
            labels them as simulated.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {status ? (
            <StatusPill tone={verifiedLive ? 'ok' : 'warn'} label={verifiedLive ? 'Ring device API verified' : live ? 'Token configured — connection unverified' : 'Fictional replay mode'} />
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

      <div className="grid gap-3 rounded-xl border-[3px] border-yellow-400 bg-card p-4">
        <h2 className="text-lg font-black">1. Connect and select a package</h2>
        <p className="text-sm">Official Ring API: {verifiedLive ? 'Authenticated device discovery succeeded' : live ? 'A backend token is configured but the API has not been verified' : 'No official token configured; use the public replay'}.</p>
        <div className="flex flex-wrap gap-2 items-end">
          <button onClick={() => load('devices')} disabled={Boolean(busy)}
            className="rounded-lg bg-yellow-400 px-4 py-3 text-sm font-black text-black disabled:opacity-40">
            {busy === 'devices' ? 'Checking…' : live ? 'Test official Ring device discovery' : 'View fictional device fixtures'}
          </button>
          <span className="text-sm">{verifiedLive ? 'Verified at ' + new Date(devices.verified_at).toLocaleTimeString() : 'Not verified'}</span>
        </div>
        {packageError && <p className="text-xs text-orange-500">{packageError}</p>}
        {packages.length > 0 && <label className="text-sm font-bold">Associated fictional package
          <select value={packageTracking} onChange={e => setPackageTracking(e.target.value)}
            className="mt-1 block w-full rounded-lg border-2 border-yellow-400 bg-background p-3">
            {packages.map(p => <option key={p.tracking_number} value={p.tracking_number}>{p.package_nickname || p.scenario_title || 'Sample package'} · {p.tracking_number}</option>)}
          </select>
        </label>}
        <p className="text-xs text-muted-foreground">A Ring Playground device is not automatically associated with a real customer's package. This selector controls the fictional demo investigation.</p>
      </div>
      <RingStreamPlayer key={selectedDeviceId || 'replay'} deviceId={selectedDeviceId} verified={verifiedLive} trackingNumber={packageTracking}/>
      <div className="space-y-3 rounded-xl border-[3px] border-teal-500 bg-card p-4">
        <h2 className="text-lg font-black">3. Compare the delivery and submit an investigation</h2>
        <p className="text-sm">Continue in the existing customer workflow. The paired fictional Ring-style and carrier scenes stay consistent for the selected package; management receives the submitted simulated discrepancy.</p>
        <div className="flex flex-wrap gap-2">
          <Link to={'/view/customer' + (packageTracking ? '?tracking=' + encodeURIComponent(packageTracking) : '')}
            className="rounded-lg bg-teal-500 px-4 py-3 text-sm font-black text-black">Open this package investigation →</Link>
          <Link to="/view/management" className="rounded-lg border-2 border-teal-500 px-4 py-3 text-sm font-bold">Open management review →</Link>
        </div>
        <p className="text-xs text-muted-foreground">The official live stream is view-only and not filed as demo evidence. Package evidence in this workflow is clearly labelled synthetic.</p>
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

          <Panel title="Supported adapter capabilities (not all verified)" dense>
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

          <Panel title="API diagnostic tools" subtitle="Official device discovery needs administrator sign-in and an unexpired Ring token. Video starts in step 2 above.">
            {devices && <label className="mb-3 block text-xs text-foreground">Selected device
              <select className="mt-1 w-full rounded border border-border bg-card p-2" value={selectedDeviceId} onChange={e => { setSelectedDeviceId(e.target.value); setEvents(null); }}>
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
              
            </div>


          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Devices"
            subtitle={devices ? (devices.official_api_connection ? 'Verified response from the Ring API' : 'Fictional locally generated device list') : 'Call device discovery to load'}
            actions={devices ? <StatusPill tone={devices.official_api_connection ? 'ok' : 'warn'} label={devices.official_api_connection ? 'Authenticated' : 'Fictional'} /> : null}
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
            title="Device event history"
            subtitle={events ? (events.mode === 'live' || events.mode === 'playground' ? 'Returned by the Ring API' : 'Fictional event fixtures') : 'Call event history to load'}
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
          <span className="font-semibold">Track eligibility, stated plainly.</span> {verifiedLive ? 'Official API device discovery succeeded. For Ring track eligibility, demonstrate an actual Playground stream or other accepted Ring simulator interaction. ' : 'No verified official Ring API response has been shown. Fictional fixtures alone do not establish Ring-track eligibility. '} The adapter is real code against
          documented Ring endpoints, and an adapter must be tested against the actual authorized provider before claiming a live integration. What is not
          claimed: a Ring customer account is connected, a certification has been completed, or any Ring recording is
          shown. Adding RING_CLIENT_ID, RING_CLIENT_SECRET and RING_REFRESH_TOKEN switches every call above to your own
          Ring developer account.
        </p>
      </div>
    </div>
  );
}