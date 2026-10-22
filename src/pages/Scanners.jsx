import React, { useCallback, useEffect, useState } from 'react';
import { ScanLine, Loader2, AlertTriangle, Check, Info } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import ScannerCard from '@/components/scanners/ScannerCard';
import { loadBoard } from '@/lib/board';
import { ops } from '@/lib/demo';
import { SYNC_STATUS, meta } from '@/lib/status';
import { formatDateTime } from '@/lib/format';

const FAULTS = [
  { key: 'decode_failure', label: 'Scan fails to decode', hint: 'The label cannot be read, so no package is identified.' },
  { key: 'connection_drop', label: 'Connection drops', hint: 'Events are buffered and synchronized later.' },
  { key: 'wrong_scanner', label: 'Scanner not assigned', hint: 'Scans cannot be tied to a work session or camera.' },
  { key: 'unavailable_footage', label: 'Footage unavailable', hint: 'A valid scan with no capture window covering it.' }
];

export default function Scanners() {
  const [board, setBoard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const b = await loadBoard();
    setBoard(b);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(payload) {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      let res;
      if (payload.control === 'testScan') {
        res = await ops({ action: 'testScan', scanner_id: payload.scanner_id, tracking_number: payload.tracking_number });
      } else if (payload.control === 'scannerControl' || ['connect', 'disconnect', 'check', 'pair'].includes(payload.control)) {
        res = await ops({ action: 'scannerControl', scanner_id: payload.scanner_id, control: payload.control, camera_id: payload.camera_id });
      } else {
        res = await ops({ action: 'scanFault', scanner_id: payload.scanner_id, fault: payload.control, tracking_number: payload.tracking_number });
      }
      if (res?.ok === false) {
        setError(res.error || 'The scanner operation was rejected.');
      } else {
        setResult({ ...res, kind: payload.control });
      }
      await load();
    } catch (err) {
      setError(err?.message || 'The operation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function runFault(fault) {
    const scanner = board?.scanners.find((s) => s.connection_status === 'connected') || board?.scanners[0];
    if (!scanner) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await ops({
        action: 'scanFault',
        scanner_id: scanner.device_id,
        fault,
        tracking_number: board.shipments[0]?.tracking_number
      });
      if (res?.ok === false) setError(res.error);
      else setResult({ ...res, kind: fault });
      await load();
    } catch (err) {
      setError(err?.message || 'The fault simulation failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!board) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted/40" />;
  }

  const latest = board.events
    .slice()
    .sort((a, b) => new Date(b.created_date || b.occurred_at).getTime() - new Date(a.created_date || a.occurred_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Scanner connections</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Scanners remain the authoritative record. The Guardian camera only supplies the perspective that explains what
          happened around a scan. Everything on this page is a simulated device session.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {board.scanners.map((scanner) => (
          <ScannerCard
            key={scanner.id}
            scanner={scanner}
            employee={board.employees.find((e) => e.employee_id === scanner.assigned_employee_id)}
            camera={board.cameras.find((c) => c.device_id === scanner.paired_camera_id)}
            cameras={board.cameras}
            packages={board.shipments}
            busy={busy}
            onAct={act}
          />
        ))}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-tone-danger/40 bg-tone-danger/10 p-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tone-danger" />
          <p className="text-[11px] leading-relaxed text-foreground">{error}</p>
        </div>
      ) : null}

      {result ? (
        <Panel title="Operation result" subtitle="What the simulated device and correlation engine returned">
          <div className="space-y-2">
            {result.diagnostics ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-4">
                {Object.entries(result.diagnostics).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.replace(/_/g, ' ')}</dt>
                    <dd className="truncate text-foreground">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {result.event ? (
              <div className="rounded-md border border-border bg-muted/25 p-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rgc-mono text-[11px] text-foreground">{result.event.tracking_number}</span>
                  {result.event.sync_status ? (
                    <StatusPill tone={meta(SYNC_STATUS, result.event.sync_status).tone} label={meta(SYNC_STATUS, result.event.sync_status).label} />
                  ) : null}
                  <span className="text-[10px] text-muted-foreground">{formatDateTime(result.event.occurred_at)}</span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-foreground">{result.event.event_label}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{result.event.sync_note || result.event.note}</p>
              </div>
            ) : null}

            {result.outcome ? (
              <p className="inline-flex items-center gap-1 text-[11px] text-tone-ok">
                <Check className="h-3 w-3" /> {String(result.outcome).replace(/_/g, ' ')}
              </p>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Failure modes"
        subtitle="Reproduce the operating conditions that make evidence unreliable"
        actions={<StatusPill tone="warn" label="Simulated faults" />}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {FAULTS.map((f) => (
            <button
              key={f.key}
              onClick={() => runFault(f.key)}
              disabled={busy}
              className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2 text-left hover:border-primary/50 disabled:opacity-50"
            >
              <span className="mt-0.5">
                {busy ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : <ScanLine className="h-3 w-3 text-muted-foreground" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-foreground">{f.label}</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{f.hint}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Each failure writes a real event to the demonstration database, so you can open the affected package and see
          exactly how the record looks when the device misbehaves.
        </p>
      </Panel>

      <Panel title="Latest events" subtitle="Newest records in this session" dense>
        <ul className="divide-y divide-border/70">
          {latest.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-2 px-4 py-2">
              <div className="min-w-0">
                <p className="rgc-mono text-[10px] text-muted-foreground">{formatDateTime(e.occurred_at)}</p>
                <p className="truncate text-[11px] text-foreground">{e.event_label}</p>
              </div>
              <StatusPill tone={meta(SYNC_STATUS, e.sync_status).tone} label={meta(SYNC_STATUS, e.sync_status).label} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}