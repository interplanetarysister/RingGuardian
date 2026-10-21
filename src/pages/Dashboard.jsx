import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Camera, ScanLine, FolderSearch, TriangleAlert, Clapperboard,
  ArrowRight, RefreshCw, Video, VideoOff
} from 'lucide-react';
import Metric from '@/components/common/Metric';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import EmptyState from '@/components/common/EmptyState';
import { loadBoard } from '@/lib/board';
import { SHIPMENT_STATUS, SYNC_STATUS, DEVICE_STATUS, meta } from '@/lib/status';
import { formatTime, formatDate, relativeTo } from '@/lib/format';

export default function Dashboard() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadBoard()
      .then((b) => alive && setBoard(b))
      .catch((e) => alive && setError(e?.message || 'Could not load the demonstration dataset.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!board) return null;
    const openCases = board.cases.filter((c) => c.status === 'open' || c.status === 'investigating').length;
    const flagged = board.shipments.filter((s) => s.discrepancy_flag).length;
    const gaps = board.events.filter((e) => e.sync_status !== 'matched').length;
    const pending = board.requests.filter((r) => r.status === 'pending').length;
    return {
      tracked: board.shipments.length,
      onlineCameras: board.cameras.filter((c) => c.status === 'online').length,
      cameras: board.cameras.length,
      connectedScanners: board.scanners.filter((s) => s.connection_status === 'connected').length,
      scanners: board.scanners.length,
      openCases,
      flagged,
      gaps,
      pending
    };
  }, [board]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-52 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="rgc-panel h-[86px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rgc-panel border-tone-danger/40 p-5">
        <p className="text-sm font-medium text-foreground">The operations board could not be loaded</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <RefreshCw className="h-3 w-3" /> Reload
        </button>
      </div>
    );
  }

  const attention = board.shipments.filter((s) => s.discrepancy_flag);
  const gaps = board.events
    .filter((e) => e.sync_status !== 'matched')
    .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at))
    .slice(0, 6);
  const recent = board.events
    .slice()
    .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at))
    .slice(0, 7);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Operations overview</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Five active scenarios in this demonstration session · all times US Pacific
          </p>
        </div>
        <Link
          to="/guided-demo"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50"
        >
          Start the 3-minute walkthrough <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Packages tracked" value={metrics.tracked} hint="fictional records" icon={Package} tone="info" />
        <Metric
          label="Cameras online"
          value={metrics.onlineCameras + ' / ' + metrics.cameras}
          hint="proposed vest hardware"
          icon={Camera}
          tone="ok"
        />
        <Metric
          label="Scanners connected"
          value={metrics.connectedScanners + ' / ' + metrics.scanners}
          hint="simulated work sessions"
          icon={ScanLine}
          tone="ok"
        />
        <Metric label="Open investigations" value={metrics.openCases} hint="cases awaiting outcome" icon={FolderSearch} tone="warn" />
        <Metric label="Flagged packages" value={metrics.flagged} hint="discrepancy recorded" icon={TriangleAlert} tone="danger" />
        <Metric label="Evidence gaps" value={metrics.gaps} hint="events without a clean match" icon={Clapperboard} tone="warn" />
        <Metric label="Footage requests" value={metrics.pending} hint="awaiting investigator review" icon={Video} tone="info" />
        <Metric label="Recovered" value={board.shipments.filter((s) => s.status === 'recovered').length} hint="after corrective scan" icon={Package} tone="ok" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Panel
          title="Needs attention"
          subtitle="Packages where the record and the evidence disagree"
          dense
        >
          {attention.length === 0 ? (
            <EmptyState icon={TriangleAlert} title="No discrepancies recorded" hint="Every package in this session reconciles." />
          ) : (
            <ul className="divide-y divide-border/70">
              {attention.map((s) => {
                const status = meta(SHIPMENT_STATUS, s.status);
                return (
                  <li key={s.id}>
                    <Link to={`/packages/${s.tracking_number}`} className="group flex items-start gap-3 px-4 py-3 hover:bg-accent/30">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rgc-mono text-[11px] text-foreground">{s.tracking_number}</span>
                          <StatusPill tone={status.tone} label={status.label} />
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{s.discrepancy_reason}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/80">
                          {s.current_facility} · last scan {formatTime(s.last_verified_scan_at)}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Evidence gaps" subtitle="Events the correlation engine could not resolve cleanly" dense>
          {gaps.length === 0 ? (
            <EmptyState icon={Clapperboard} title="Every event matched" hint="No unresolved capture associations." />
          ) : (
            <ul className="divide-y divide-border/70">
              {gaps.map((e) => {
                const sync = meta(SYNC_STATUS, e.sync_status);
                return (
                  <li key={e.id} className="flex items-start gap-2.5 px-4 py-2.5">
                    <span className="mt-0.5 shrink-0">
                      {e.video_clip_key ? (
                        <Video className="h-3.5 w-3.5 text-tone-info" />
                      ) : (
                        <VideoOff className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rgc-mono text-[10px] text-muted-foreground">{formatTime(e.occurred_at)}</span>
                        <StatusPill tone={sync.tone} label={sync.label} />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-foreground">{e.event_label}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{e.tracking_number} · {e.facility}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent scanner events" subtitle="The authoritative scan record, newest first" dense>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Package</th>
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Scanner</th>
                <th className="px-4 py-2 font-medium">Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recent.map((e) => {
                const sync = meta(SYNC_STATUS, e.sync_status);
                return (
                  <tr key={e.id} className="hover:bg-accent/20">
                    <td className="whitespace-nowrap px-4 py-2">
                      <span className="rgc-mono text-[11px] text-foreground">{formatTime(e.occurred_at)}</span>
                      <span className="ml-1.5 text-[10px] text-muted-foreground">{formatDate(e.occurred_at)}</span>
                    </td>
                    <td className="px-4 py-2">
                      <Link to={`/packages/${e.tracking_number}`} className="rgc-mono text-[11px] text-primary hover:underline">
                        {e.tracking_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-foreground">{e.event_label}</td>
                    <td className="px-4 py-2">
                      <span className="rgc-mono text-[10px] text-muted-foreground">{e.scanner_id || '—'}</span>
                    </td>
                    <td className="px-4 py-2">
                      <StatusPill tone={sync.tone} label={sync.label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Device health" subtitle="Guardian cameras and paired scanners" dense>
          <ul className="divide-y divide-border/70">
            {board.cameras.slice(0, 4).map((c) => {
              const status = meta(DEVICE_STATUS, c.status);
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2">
                  <div className="min-w-0">
                    <p className="rgc-mono text-[11px] text-foreground">{c.device_id}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{c.facility} · battery {c.battery_pct}%</p>
                  </div>
                  <StatusPill tone={status.tone} label={status.label} />
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Audit trail" subtitle="Every demonstration action is recorded" dense>
          <ul className="rgc-scroll max-h-[220px] divide-y divide-border/70 overflow-y-auto">
            {board.activity.slice(0, 8).map((a) => (
              <li key={a.id} className="px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-medium text-foreground">{a.action}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTo(a.occurred_at)}</span>
                </div>
                <p className="truncate text-[10px] text-muted-foreground">{a.actor} · {a.entity_ref}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}