import React, { useState } from 'react';
import { Link2, Unlink, ScanLine, Activity, ChevronDown, Loader2 } from 'lucide-react';
import StatusPill from '@/components/common/StatusPill';
import { DEVICE_STATUS, meta } from '@/lib/status';
import { formatDateTime } from '@/lib/format';

export default function ScannerCard({ scanner, employee, camera, cameras, packages, busy, onAct }) {
  const [pairTarget, setPairTarget] = useState(cameras.filter((c) => c.assigned_employee_id)[0]?.device_id || '');
  const [testPackage, setTestPackage] = useState(packages[0]?.tracking_number || '');
  const [open, setOpen] = useState(false);

  const status = meta(DEVICE_STATUS, scanner.connection_status);
  const connected = scanner.connection_status === 'connected';

  return (
    <div className="rgc-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rgc-mono text-xs font-semibold text-foreground">{scanner.device_id}</span>
            <StatusPill tone={status.tone} label={status.label} />
            {scanner.assignment_mismatch ? <StatusPill tone="danger" label="Unassigned" /> : null}
          </div>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{scanner.model}</p>
        </div>
        <div className="text-right">
          <p className="rgc-mono text-[10px] text-muted-foreground">{scanner.facility}</p>
          <p className="rgc-mono text-[10px] text-muted-foreground">{scanner.battery_pct}%</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-2.5">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Assigned to</dt>
          <dd className="truncate text-[11px] text-foreground">{employee ? employee.full_name : 'Unassigned'}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Paired camera</dt>
          <dd className="rgc-mono truncate text-[11px] text-foreground">{scanner.paired_camera_id || 'none'}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Work session</dt>
          <dd className="truncate text-[11px] capitalize text-foreground">{scanner.session_status}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Last scan</dt>
          <dd className="rgc-mono truncate text-[11px] text-foreground">{formatDateTime(scanner.last_scan_at)}</dd>
        </div>
      </dl>

      {camera ? (
        <p className="mt-2 truncate text-[10px] text-muted-foreground">
          Camera {camera.device_id} · {camera.status} · battery {camera.battery_pct}%
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {connected ? (
          <button
            onClick={() => onAct({ control: 'disconnect', scanner_id: scanner.device_id })}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Unlink className="h-2.5 w-2.5" /> Disconnect
          </button>
        ) : (
          <button
            onClick={() => onAct({ control: 'connect', scanner_id: scanner.device_id })}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:border-primary/60 disabled:opacity-50"
          >
            <Link2 className="h-2.5 w-2.5" /> Connect
          </button>
        )}
        <button
          onClick={() => onAct({ control: 'check', scanner_id: scanner.device_id })}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Activity className="h-2.5 w-2.5" /> Check
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={'h-2.5 w-2.5 transition-transform ' + (open ? 'rotate-180' : '')} /> More
        </button>
      </div>

      {open ? (
        <div className="mt-2.5 space-y-2 rounded-md border border-border bg-muted/25 p-2.5">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Pair a camera</label>
            <div className="mt-1 flex gap-1.5">
              <select
                value={pairTarget}
                onChange={(e) => setPairTarget(e.target.value)}
                className="min-w-0 flex-1 rounded border border-input bg-background px-1.5 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.device_id}>
                    {c.device_id} — {c.assigned_employee_id ? 'assigned' : 'unassigned'}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onAct({ control: 'pair', scanner_id: scanner.device_id, camera_id: pairTarget })}
                disabled={busy}
                className="rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                Pair
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Test scan against</label>
            <div className="mt-1 flex gap-1.5">
              <select
                value={testPackage}
                onChange={(e) => setTestPackage(e.target.value)}
                className="min-w-0 flex-1 rounded border border-input bg-background px-1.5 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.tracking_number}>
                    {p.tracking_number}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onAct({ control: 'testScan', scanner_id: scanner.device_id, tracking_number: testPackage })}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <ScanLine className="h-2.5 w-2.5" />} Test scan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {scanner.diagnostic_note ? (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{scanner.diagnostic_note}</p>
      ) : null}
    </div>
  );
}