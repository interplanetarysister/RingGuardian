import React, { useCallback, useEffect, useState } from 'react';
import {
  ShoppingCart, RefreshCw, Loader2, Check, KeyRound, ServerCog, Bell, Truck, AlertTriangle, Webhook
} from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import { amazon } from '@/lib/demo';
import { formatDateTime } from '@/lib/format';

export default function AmazonIntegration() {
  const [status, setStatus] = useState(null);
  const [orders, setOrders] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [notification, setNotification] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('TBA304711915063');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const res = await amazon({ action: 'status' });
      setStatus(res);
    } catch (err) {
      setError(err?.message || 'The Amazon adapter did not respond.');
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function call(kind) {
    setBusy(kind);
    setError('');
    try {
      if (kind === 'orders') setOrders(await amazon({ action: 'orders' }));
      else if (kind === 'tracking') setTracking(await amazon({ action: 'trackingUpdate', tracking_number: trackingNumber }));
      else if (kind === 'notification') setNotification(await amazon({ action: 'notifications' }));
    } catch (err) {
      setError(err?.message || 'The Amazon call failed.');
    } finally {
      setBusy('');
    }
  }

  const live = status?.mode === 'live';
  const orderRows = orders?.payload?.Orders || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Amazon system integration</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            The custody events the console records, exchanged with Amazon systems through the Selling Partner API. When
            credentials are present the adapter performs a real Login with Amazon exchange and order retrieval; otherwise
            it reproduces the documented response shapes locally and labels them as simulated.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {status ? (
            <StatusPill tone={live ? 'ok' : 'warn'} label={live ? 'Live credentials' : 'Simulated mode'} />
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

      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <Panel
            title="Adapter state"
            subtitle={live ? 'Calls are made against your Selling Partner API credentials' : 'Documented response shapes produced locally'}
          >
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
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">LWA token endpoint</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">{status.endpoints.lwa_token_url}</dd>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">API host</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">{status.endpoints.api_host}</dd>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Marketplace</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">
                      {status.endpoints.marketplace_id} · {status.endpoints.region}
                    </dd>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Orders</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">{status.endpoints.orders}</dd>
                  </div>
                  <div className="rounded-md border border-border bg-muted/25 px-2.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Tracking update</dt>
                    <dd className="rgc-mono break-all text-[10px] text-foreground">{status.endpoints.tracking_update}</dd>
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
                    Requests are paced for the documented order-reporting limit
                  </span>
                </li>
              ) : null}
            </ul>
          </Panel>

          <Panel title="Call the adapter" subtitle="Each button exercises one documented capability">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => call('orders')}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy === 'orders' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3" />} Pull orders
              </button>
              <button
                onClick={() => call('tracking')}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50 disabled:opacity-50"
              >
                {busy === 'tracking' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />} Preview tracking update
              </button>
              <button
                onClick={() => call('notification')}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50 disabled:opacity-50"
              >
                {busy === 'notification' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />} Sample notification
              </button>
            </div>

            <div className="mt-2.5">
              <label htmlFor="amazon-tracking" className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Tracking number for the update preview
              </label>
              <input
                id="amazon-tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="rgc-mono mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-[11px] text-foreground"
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel
            title="Orders"
            subtitle={orders ? (orders.mode === 'live' ? 'Returned by the Selling Partner API' : 'Simulated payload') : 'Pull orders to load'}
            actions={orders ? <StatusPill tone={orders.mode === 'live' ? 'ok' : 'warn'} label={orders.mode} /> : null}
            dense
          >
            {!orders ? (
              <p className="px-4 py-6 text-[11px] text-muted-foreground">No order payload loaded yet.</p>
            ) : (
              <ul className="divide-y divide-border/70">
                {orderRows.map((o) => (
                  <li key={o.AmazonOrderId} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rgc-mono text-[10px] text-foreground">{o.AmazonOrderId}</span>
                      <StatusPill tone={o.OrderStatus === 'Shipped' ? 'info' : 'muted'} label={o.OrderStatus} dot={false} />
                      <span className="rgc-mono ml-auto text-[10px] text-muted-foreground">{o.FulfillmentChannel}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {o.ShippingAddress?.City}, {o.ShippingAddress?.StateOrRegion} ·{' '}
                      {o.OrderTotal ? o.OrderTotal.Amount + ' ' + o.OrderTotal.CurrencyCode : '—'} ·{' '}
                      {o.PurchaseDate ? formatDateTime(o.PurchaseDate) : '—'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {orders?.payload?.meta?.note ? (
              <p className="border-t border-border px-4 py-2 text-[10px] leading-relaxed text-muted-foreground">
                {orders.payload.meta.note}
              </p>
            ) : null}
          </Panel>

          <Panel
            title="Tracking update"
            subtitle={tracking ? 'Dry run — nothing is transmitted to Amazon' : 'Preview the request the adapter would send'}
            actions={tracking ? <StatusPill tone="info" label="Dry run" /> : null}
          >
            {!tracking ? (
              <p className="text-[11px] text-muted-foreground">No update preview generated yet.</p>
            ) : (
              <div>
                <p className="rgc-mono text-[10px] text-foreground">
                  {tracking.request?.method} {tracking.request?.url}
                </p>
                <pre className="rgc-scroll mt-1.5 max-h-[190px] overflow-auto rounded bg-[#070d16] p-2 text-[9px] leading-relaxed text-muted-foreground">
{JSON.stringify(tracking.request?.body || {}, null, 2)}
                </pre>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{tracking.note}</p>
              </div>
            )}
          </Panel>

          <Panel
            title="Order-change notification"
            subtitle={notification ? 'Documented notification envelope' : 'Load a sample notification'}
            actions={notification ? <StatusPill tone="warn" label="Sample" /> : null}
          >
            {!notification ? (
              <p className="text-[11px] text-muted-foreground">No notification loaded yet.</p>
            ) : (
              <div>
                <pre className="rgc-scroll max-h-[210px] overflow-auto rounded bg-[#070d16] p-2 text-[9px] leading-relaxed text-muted-foreground">
{JSON.stringify(notification.payload || {}, null, 2)}
                </pre>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{notification.payload?.meta?.note}</p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Notification receiver" subtitle="How Amazon notifications would reach this application">
        <ul className="space-y-2">
          {[
            'Amazon posts order-change notifications to the adapter endpoint.',
            'Every payload is verified with an HMAC SHA-256 signature before anything is recorded.',
            'Duplicate deliveries are discarded using the NotificationId as an idempotency key.',
            'The endpoint records an audit entry and never changes package state on its own.'
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <Webhook className="mt-0.5 h-3 w-3 shrink-0 text-tone-info" />
              {t}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="flex items-start gap-2 rounded-md border border-tone-warn/30 bg-tone-warn/10 p-3">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-tone-warn" />
        <p className="text-[10px] leading-relaxed text-foreground/90">
          <span className="font-semibold">Stated plainly.</span> The adapter is real code against documented Selling
          Partner API endpoints. What is not claimed: an Amazon seller account is connected in this session, the
          application has passed Amazon's app review, or any tracking update has been transmitted. Adding
          AMAZON_LWA_CLIENT_ID, AMAZON_LWA_CLIENT_SECRET and AMAZON_REFRESH_TOKEN switches order retrieval to your own
          credentials.
        </p>
      </div>
    </div>
  );
}