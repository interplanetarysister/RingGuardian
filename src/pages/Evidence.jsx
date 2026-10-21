import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clapperboard, RefreshCw, Loader2, ShieldX, Film, Info } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import EmptyState from '@/components/common/EmptyState';
import EvidencePlayer from '@/components/evidence/EvidencePlayer';
import UploadFootage from '@/components/evidence/UploadFootage';
import { loadBoard, markersForClip } from '@/lib/board';
import { ops } from '@/lib/demo';
import { SYNC_STATUS, meta } from '@/lib/status';
import { formatDateTime, formatTime } from '@/lib/format';

export default function Evidence() {
  const [board, setBoard] = useState(null);
  const [selectedClipKey, setSelectedClipKey] = useState('');
  const [labEventId, setLabEventId] = useState('');
  const [labResult, setLabResult] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const b = await loadBoard();
    setBoard(b);
    if (!selectedClipKey && b.clips.length > 0) setSelectedClipKey(b.clips[0].clip_key);
    if (!labEventId && b.events.length > 0) {
      const interesting = b.events.find((e) => e.sync_status === 'ambiguous') || b.events[0];
      setLabEventId(interesting.id);
    }
  }, [selectedClipKey, labEventId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clip = useMemo(() => (board ? board.clips.find((c) => c.clip_key === selectedClipKey) : null), [board, selectedClipKey]);
  const markers = useMemo(() => (board && clip ? markersForClip(board, null, clip) : []), [board, clip]);
  const labEvent = useMemo(() => (board ? board.events.find((e) => e.id === labEventId) : null), [board, labEventId]);

  async function runSync() {
    if (!labEvent) return;
    setBusy('sync');
    setError('');
    try {
      const res = await ops({ action: 'runSync', event_id: labEvent.id });
      if (!res?.ok) throw new Error(res?.error || 'Correlation failed.');
      setLabResult(res);
      await load();
    } catch (err) {
      setError(err?.message || 'Correlation failed.');
    } finally {
      setBusy('');
    }
  }

  async function rejectMatch() {
    if (!labEvent) return;
    setBusy('reject');
    setError('');
    try {
      const res = await ops({ action: 'rejectMatch', event_id: labEvent.id, reason: 'The proposed recording does not show the package identified by this scan.' });
      if (!res?.ok) throw new Error(res?.error || 'The match could not be rejected.');
      setLabResult({ sync: { sync_status: 'rejected', sync_note: 'Investigator rejected the proposed match. No recording is associated with this event.' } });
      await load();
    } catch (err) {
      setError(err?.message || 'The match could not be rejected.');
    } finally {
      setBusy('');
    }
  }

  if (!board) return <div className="h-40 animate-pulse rounded-lg bg-muted/40" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Evidence library</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Eighteen capture windows across the five scenarios. Each window is tied to a camera, a facility and a
          timestamp, so a scan event can be located inside it precisely.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Panel title="Recordings" subtitle="Select a window to inspect it" dense>
          <ul className="rgc-scroll max-h-[560px] divide-y divide-border/70 overflow-y-auto">
            {board.clips.map((c) => {
              const active = c.clip_key === selectedClipKey;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedClipKey(c.clip_key)}
                    className={'flex w-full items-start gap-2 px-3 py-2.5 text-left ' + (active ? 'bg-accent/60' : 'hover:bg-accent/25')}
                  >
                    <Film className={'mt-0.5 h-3.5 w-3.5 shrink-0 ' + (active ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-foreground">{c.title}</span>
                      <span className="rgc-mono mt-0.5 block truncate text-[10px] text-muted-foreground">
                        {c.clip_key} · {c.camera_id}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {formatDateTime(c.recorded_start)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel
            title={clip ? clip.title : 'Recording'}
            subtitle={clip ? clip.description : 'Choose a recording'}
            actions={clip ? <StatusPill tone="warn" label="Reconstruction" /> : null}
          >
            <EvidencePlayer
              clip={clip}
              markers={markers}
              initialPosition={0}
              trackingNumber={markers.length > 0 ? 'see markers' : '—'}
              cameraId={clip?.camera_id}
              eventTime={clip?.recorded_start}
              height="lg"
            />
            <div className="mt-3">
              <UploadFootage
                onUploaded={() => load()}
                cameraId={clip?.camera_id}
                facility={clip?.facility}
              />
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Synchronization lab"
        subtitle="Run the correlation engine against any event and watch it accept or refuse a match"
        actions={
          labEvent ? <StatusPill tone={meta(SYNC_STATUS, labEvent.sync_status).tone} label={meta(SYNC_STATUS, labEvent.sync_status).label} /> : null
        }
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Select a scan event</label>
            <select
              value={labEventId}
              onChange={(e) => {
                setLabEventId(e.target.value);
                setLabResult(null);
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {board.events
                .slice()
                .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {formatTime(e.occurred_at)} · {e.tracking_number.slice(-6)} · {e.event_type}
                  </option>
                ))}
            </select>

            {labEvent ? (
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-md border border-border bg-muted/25 p-2.5">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Scanner</dt>
                  <dd className="rgc-mono text-[10px] text-foreground">{labEvent.scanner_id || 'none'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Camera</dt>
                  <dd className="rgc-mono text-[10px] text-foreground">{labEvent.camera_id || 'none'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Scan state</dt>
                  <dd className="text-[10px] capitalize text-foreground">{labEvent.scan_status}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Timestamp</dt>
                  <dd className="rgc-mono text-[10px] text-foreground">{formatDateTime(labEvent.occurred_at)}</dd>
                </div>
              </dl>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={runSync}
                disabled={Boolean(busy) || !labEvent}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy === 'sync' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Run correlation
              </button>
              <button
                onClick={rejectMatch}
                disabled={Boolean(busy) || !labEvent}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {busy === 'reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldX className="h-3 w-3" />}
                Reject proposed match
              </button>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Engine verdict</p>
            {error ? (
              <p className="mt-1 text-[11px] text-tone-danger">{error}</p>
            ) : labResult?.sync ? (
              <div className="mt-1 space-y-1.5">
                <StatusPill tone={meta(SYNC_STATUS, labResult.sync.sync_status).tone} label={meta(SYNC_STATUS, labResult.sync.sync_status).label} />
                <p className="text-[11px] leading-relaxed text-foreground/90">{labResult.sync.sync_note}</p>
                {labResult.rejected && labResult.rejected.length > 0 ? (
                  <div className="border-t border-border pt-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Rejected candidates</p>
                    {labResult.rejected.map((r) => (
                      <p key={r.clip_key} className="rgc-mono text-[10px] text-tone-warn">
                        {r.clip_key} — {r.reason}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : labEvent ? (
              <div className="mt-1 space-y-1.5">
                <p className="text-[11px] leading-relaxed text-muted-foreground">{labEvent.sync_note}</p>
                <p className="text-[10px] text-muted-foreground">
                  Run the correlation again to see the engine re-evaluate from scratch.
                </p>
              </div>
            ) : (
              <EmptyState icon={Clapperboard} title="No event selected" />
            )}
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-2.5 text-[10px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          The engine only accepts a candidate whose camera matches the event and whose capture window contains the
          timestamp. Anything else is reported as ambiguous, missing or mis-attributed rather than guessed.
        </p>
      </Panel>
    </div>
  );
}