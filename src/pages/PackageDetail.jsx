import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clapperboard, FolderSearch, History, ExternalLink, Loader2 } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import EvidencePlayer from '@/components/evidence/EvidencePlayer';
import SyncTimeline from '@/components/packages/SyncTimeline';
import PackageSummary from '@/components/packages/PackageSummary';
import InvestigatorActions from '@/components/packages/InvestigatorActions';
import { loadBoard, eventsFor, clipByKey, caseFor, primaryEvent, markersForClip } from '@/lib/board';
import { SYNC_STATUS, meta } from '@/lib/status';
import { formatDateTime, relativeTo } from '@/lib/format';
import { packageProfileBackPath } from '@/lib/packageLinks';

export default function PackageDetail() {
  const { trackingNumber } = useParams();
  const [searchParams] = useSearchParams();
  const requestedEvent = searchParams.get('event');
  const backTo = packageProfileBackPath(trackingNumber, searchParams);
  const backLabel = searchParams.get('from') === 'customer' ? 'Back to selected delivery' : 'Back to packages';
  const [state, setState] = useState({ loading: true, error: '', payload: null });
  const [selectedId, setSelectedId] = useState('');

  const load = useCallback(async () => {
    try {
      const board = await loadBoard();
      const shipment = board.shipments.find((s) => s.tracking_number === trackingNumber);
      if (!shipment) {
        setState({ loading: false, error: 'This package is not part of the current demonstration session.', payload: null });
        return;
      }
      const events = eventsFor(board, trackingNumber);
      const caseRecord = caseFor(board, trackingNumber);
      const camera = board.cameras.find((c) => c.device_id === (primaryEvent(events) || {}).camera_id) || null;
      const scanner = board.scanners.find((s) => s.device_id === (primaryEvent(events) || {}).scanner_id) || null;
      const audit = board.activity.filter((a) => a.entity_ref === trackingNumber);

      setState({ loading: false, error: '', payload: { board, shipment, events, caseRecord, camera, scanner, audit } });
      setSelectedId((prev) => events.some(e=>e.id===requestedEvent) ? requestedEvent : (events.some((e) => e.id === prev) ? prev : (primaryEvent(events) || {}).id || ''));
    } catch (err) {
      setState({ loading: false, error: err?.message || 'Could not load this package.', payload: null });
    }
  }, [trackingNumber, requestedEvent]);

  useEffect(() => {
    load();
  }, [load]);

  const payload = state.payload;
  const selected = useMemo(
    () => (payload ? payload.events.find((e) => e.id === selectedId) || null : null),
    [payload, selectedId]
  );
  const clip = useMemo(
    () => (payload && selected ? clipByKey(payload.board, selected.video_clip_key) : null),
    [payload, selected]
  );
  const markers = useMemo(
    () => (payload && clip ? markersForClip(payload.board, trackingNumber, clip) : []),
    [payload, clip, trackingNumber]
  );

  if (state.loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading the investigation record…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rgc-panel p-5">
        <p className="text-sm font-medium text-foreground">Package not available</p>
        <p className="mt-1 text-xs text-muted-foreground">{state.error}</p>
        <Link to={backTo} className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
          <ArrowLeft className="h-3 w-3" /> {backLabel}
        </Link>
      </div>
    );
  }

  const { shipment, events, caseRecord, camera, scanner, audit } = payload;
  const sync = selected ? meta(SYNC_STATUS, selected.sync_status) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Link to={backTo} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> {backLabel}
          </Link>
          <h1 className="mt-1 break-words text-xl font-black tracking-tight text-foreground">{shipment.package_nickname || shipment.scenario_title || 'Package profile'}</h1>
          <p className="rgc-mono mt-1 break-all text-xs text-muted-foreground">Tracking: {shipment.tracking_number}</p>
          {shipment.package_nickname && <p className="mt-1 text-xs text-muted-foreground">{shipment.scenario_title}</p>}
        </div>
        {caseRecord ? (
          <Link
            to={`/investigations/${caseRecord.case_number}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50"
          >
            <FolderSearch className="h-3 w-3" /> {caseRecord.case_number}
            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
          </Link>
        ) : null}
      </div>

      <Panel title="Package profile — current status and shipment details">
        <PackageSummary shipment={shipment} camera={camera} scanner={scanner} caseRecord={caseRecord} />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Panel
            title="Evidence playback"
            subtitle={selected ? selected.event_label : 'Select a scan event'}
            actions={
              selected ? (
                <StatusPill tone={sync.tone} label={sync.label} />
              ) : null
            }
          >
            {selected ? (
              <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Correlation result</p>
                <p className="text-[11px] leading-relaxed text-foreground/90">{selected.sync_note}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    Event <span className="rgc-mono text-foreground">{formatDateTime(selected.occurred_at)}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Offset <span className="rgc-mono text-foreground">+{selected.playback_position_seconds || 0}s</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Source <span className="text-foreground">{selected.evidence_source}</span>
                  </span>
                </div>
              </div>
            ) : null}
            <EvidencePlayer
              clip={clip}
              markers={markers}
              initialPosition={selected?.playback_position_seconds || 0}
              trackingNumber={shipment.tracking_number}
              cameraId={selected?.camera_id}
              eventTime={selected?.occurred_at}
              syncNote={selected?.sync_note}
              height="md"
            />

          </Panel>

          <Panel
            title="Custody timeline"
            subtitle="Every recorded scan and movement event, in sequence"
            actions={<span className="rgc-mono text-[10px] text-muted-foreground">{events.length} events</span>}
            dense
          >
            <SyncTimeline events={events} selectedId={selectedId} onSelect={(e) => setSelectedId(e.id)} />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Investigator actions" subtitle="Each action writes to the demonstration database">
            <InvestigatorActions shipment={shipment} caseRecord={caseRecord} onDone={load} />
          </Panel>

          {caseRecord ? (
            <Panel
              title="Case findings"
              subtitle={caseRecord.case_number}
              actions={<Link to={`/investigations/${caseRecord.case_number}`} className="text-[10px] text-primary hover:underline">Open case</Link>}
            >
              <p className="text-[11px] leading-relaxed text-muted-foreground">{caseRecord.summary}</p>
              {caseRecord.findings ? (
                <>
                  <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Findings</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground/90">{caseRecord.findings}</p>
                </>
              ) : null}
              {caseRecord.resolution ? (
                <>
                  <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-tone-ok">Resolution</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground/90">{caseRecord.resolution}</p>
                </>
              ) : null}
            </Panel>
          ) : null}

          <Panel title="Record activity" subtitle="Audit trail for this tracking number" dense>
            {audit.length === 0 ? (
              <p className="px-4 py-4 text-[11px] text-muted-foreground">No actions recorded against this package yet.</p>
            ) : (
              <ul className="rgc-scroll max-h-[220px] divide-y divide-border/70 overflow-y-auto">
                {audit.map((a) => (
                  <li key={a.id} className="px-4 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-medium text-foreground">{a.action}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTo(a.occurred_at)}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{a.detail}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">{a.actor}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3">
            <History className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Changes made here persist for your session and appear on every screen that reads this package. Use
              <span className="mx-1 font-medium text-foreground">Reset demo</span>
              to restore the five starting scenarios.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3">
            <Clapperboard className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Footage shown is a scene reconstruction generated for this demonstration, or a recording an operator
              attached deliberately. It is never presented as Ring device evidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}