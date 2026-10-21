import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit, Play, Loader2, Info, ScanBarcode, Hand, BadgeCheck, RotateCcw } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import PalletStage from '@/components/ai/PalletStage';
import { loadBoard } from '@/lib/board';
import {tourEvent} from '@/lib/tour';
import { ops } from '@/lib/demo';
import { AI_STATE } from '@/lib/status';
import { percent, formatTime } from '@/lib/format';

const STAGES = [
  { key: 'pallet_scan', label: 'Pallet scanned', icon: BrainCircuit, note: 'Six objects detected. None has a matching verified scan.' },
  { key: 'barcode_read', label: 'Barcode recognized', icon: ScanBarcode, note: 'A read suggests an identity. It does not create an official scan.' },
  { key: 'held', label: 'Object held', icon: Hand, note: 'The associate lifts the parcel from the pallet.' },
  { key: 'scan_confirmed', label: 'Official scan received', icon: BadgeCheck, note: 'The scanner confirms the package.' },
  { key: 'handling_closed', label: 'Handling closed', icon: RotateCcw, note: 'State persists for this handling event only.' }
];

export default function AiTracking() {
  const [board, setBoard] = useState(null);
  const [run, setRun] = useState(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timers = useRef([]);

  useEffect(() => {
    let alive = true;
    loadBoard().then((b) => alive && setBoard(b)).catch(e=>alive&&setError(e.message));
    return () => {
      alive = false;
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const objects = useMemo(() => {
    if (!run) return [];
    const rows = run.rows || [];
    const initial = rows.filter((r) => r.elapsed_ms === 0);
    return initial.sort((a, b) => a.pallet_slot.localeCompare(b.pallet_slot));
  }, [run]);

  const stagedRows = useMemo(() => {
    if (!run) return [];
    const rows = run.rows || [];
    return rows.filter((r) => r.elapsed_ms > 0).sort((a, b) => a.elapsed_ms - b.elapsed_ms);
  }, [run]);

  const revealed = useMemo(() => {
    const map = {};
    if (step === 0) return map;
    const target = stagedRows.filter((r) => r.stage !== 'pallet_scan');
    for (let i = 0; i < Math.min(step, target.length); i += 1) {
      const row = target[i];
      if (row.object_id === 'OBJ-B2') {
        map['B2'] = row.state;
        map['B2:confidence'] = row.confidence;
      }
    }
    return map;
  }, [step, stagedRows]);

  const currentTargetRow = useMemo(() => {
    const target = stagedRows.filter((r) => r.stage !== 'pallet_scan');
    return target[Math.min(step, target.length) - 1] || null;
  }, [step, stagedRows]);

  async function startRun() {
    setBusy(true);
    setError('');
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    try {
      const res = await ops({ action: 'runAiTracking', tracking_number: 'TBA304711933190' });
      if (!res?.ok) throw new Error(res?.error || 'The preview run failed.');
      setRun(res);
      setStep(0);
      [1, 2, 3, 4].forEach((s) => {
        timers.current.push(setTimeout(() => {setStep(s);if(s===4)tourEvent('operation',{action:'runAiTracking'});}, s * 2000));
      });
    } catch (err) {
      setError(err?.message || 'The preview run failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!board) return error ? <p role="alert">{error}</p> : <div className="h-40 animate-pulse rounded-lg bg-muted/40" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Hands-free scanning preview</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            A planned capability, demonstrated with scripted object states. No computer-vision model is trained or run
            here, and camera recognition never creates an official scan.
          </p>
        </div>
        <button
          data-tour="ai-start"
          onClick={startRun}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {run ? 'Run again' : 'Run AI tracking demo'}
        </button>
      </div>

      {error ? <p className="text-[11px] text-tone-danger">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Panel
          title="Pallet 6 · overhead camera"
          subtitle="CAM-3310, Columbia Sort Center"
          actions={run ? <StatusPill tone={step >= 4 ? 'ok' : 'info'} label={step >= 4 ? 'Run complete' : 'Running'} /> : null}
        >
          {run ? (
            <PalletStage
              objects={objects}
              revealedObjectState={revealed}
              heldSlot={revealed.B2 === 'YELLOW' ? 'B2' : null}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-14 text-center">
              <BrainCircuit className="h-6 w-6 text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">No run yet</p>
              <p className="max-w-xs text-[10px] leading-relaxed text-muted-foreground">
                Start the preview to watch one package move from unscanned, to held, to confirmed, while the others stay
                unconfirmed.
              </p>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Stage timeline" subtitle={run ? 'Run ' + run.run_id : 'Awaiting run'} dense>
            <ol className="divide-y divide-border/70">
              {STAGES.map((s, i) => {
                const reached = run ? step >= i : false;
                const Icon = s.icon;
                const row = i > 0 && stagedRows.length > 0 ? stagedRows[i - 1] : null;
                return (
                  <li key={s.key} className={'px-4 py-2.5 transition-opacity ' + (reached ? 'opacity-100' : 'opacity-45')}>
                    <div className="flex items-start gap-2">
                      <span
                        className={
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ' +
                          (reached ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground')
                        }
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[11px] font-medium text-foreground">{s.label}</p>
                          {row ? (
                            <span className="rgc-mono text-[10px] text-muted-foreground">
                              {formatTime(row.observed_at)}
                            </span>
                          ) : null}
                          {row && row.state ? (
                            <StatusPill tone={AI_STATE[row.state].tone} label={row.state} dot={false} />
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{row ? row.note : s.note}</p>
                        {row && row.barcode_read ? (
                          <p className="rgc-mono mt-1 text-[10px] text-tone-warn">
                            read {row.barcode_read} · {percent(row.barcode_confidence)} confidence
                          </p>
                        ) : null}
                        {row && row.confidence ? (
                          <p className="rgc-mono mt-0.5 text-[10px] text-muted-foreground">
                            object confidence {percent(row.confidence)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel title="What the states mean">
            <ul className="space-y-2">
              {Object.keys(AI_STATE).map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className={'mt-1 h-2.5 w-2.5 shrink-0 rounded-full ' + (key === 'RED' ? 'bg-tone-danger' : key === 'YELLOW' ? 'bg-tone-warn' : 'bg-tone-ok')} />
                  <div>
                    <p className="text-[11px] font-medium text-foreground">{key} — {AI_STATE[key].label}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{AI_STATE[key].description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              A barcode read is an identity suggestion. Only an authoritative scanner event promotes an object to GREEN.
              This is the boundary the proposed system must never cross.
            </p>
          </Panel>

          {run ? (
            <Panel title="Detected objects" dense>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-1.5 font-medium">Slot</th>
                    <th className="px-4 py-1.5 font-medium">Tracking</th>
                    <th className="px-4 py-1.5 font-medium">State</th>
                    <th className="px-4 py-1.5 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {objects.map((o) => {
                    const state = revealed[o.pallet_slot] || o.state;
                    return (
                      <tr key={o.id}>
                        <td className="px-4 py-1.5"><span className="rgc-mono text-[10px] text-foreground">{o.pallet_slot}</span></td>
                        <td className="px-4 py-1.5"><span className="rgc-mono text-[10px] text-muted-foreground">{o.tracking_number}</span></td>
                        <td className="px-4 py-1.5"><StatusPill tone={AI_STATE[state].tone} label={state} dot={false} /></td>
                        <td className="px-4 py-1.5"><span className="rgc-mono text-[10px] text-muted-foreground">{percent(revealed[o.pallet_slot + ':confidence'] ?? o.confidence)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          ) : null}
        </div>
      </div>

      <Panel title="Extensibility" subtitle="How a real pipeline would slot in">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: 'Detection', d: 'YOLO-family detector produces per-frame boxes and class scores.' },
            { t: 'Association', d: 'ByteTrack maintains an object identity across frames and occlusions.' },
            { t: 'Symbol reading', d: 'OpenCV + ZBar attempt a barcode read to suggest identity.' },
            { t: 'Authority', d: 'Only a confirmed scanner event promotes an object to GREEN.' }
          ].map((x) => (
            <div key={x.t} className="rounded-md border border-border bg-muted/20 p-2.5">
              <p className="text-[11px] font-medium text-foreground">{x.t}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}