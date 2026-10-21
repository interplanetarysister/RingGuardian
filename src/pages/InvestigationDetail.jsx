import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, CheckCircle2, Lock, ExternalLink, ListChecks } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import { loadBoard, eventsFor } from '@/lib/board';
import { ops } from '@/lib/demo';
import { CASE_STATUS, PRIORITY, SYNC_STATUS, meta } from '@/lib/status';
import { formatDateTime, formatTime, relativeTo } from '@/lib/format';

export default function InvestigationDetail() {
  const { caseNumber } = useParams();
  const [data, setData] = useState(null);
  const [findings, setFindings] = useState('');
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const board = await loadBoard();
    const record = board.cases.find((c) => c.case_number === caseNumber);
    if (!record) {
      setData({ missing: true });
      return;
    }
    const shipment = board.shipments.find((s) => s.tracking_number === record.tracking_number);
    setData({
      board,
      record,
      shipment,
      events: shipment ? eventsFor(board, shipment.tracking_number) : [],
      audit: board.activity.filter((a) => a.entity_ref === record.case_number || a.entity_ref === record.tracking_number)
    });
    setFindings(record.findings || '');
    setResolution(record.resolution || '');
  }, [caseNumber]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(kind) {
    if (!data?.record) return;
    setBusy(kind);
    setError('');
    setNotice('');
    try {
      let res;
      if (kind === 'save') {
        res = await ops({ action: 'updateCase', case_number: data.record.case_number, findings, resolution });
      } else if (kind === 'resolve') {
        res = await ops({ action: 'resolveCase', case_number: data.record.case_number, resolution });
      } else if (kind === 'close') {
        res = await ops({ action: 'closeCase', case_number: data.record.case_number });
      } else if (kind === 'verify') {
        res = await ops({ action: 'requestVerification', case_number: data.record.case_number });
      }
      if (res?.ok === false) throw new Error(res.error);
      setNotice(kind === 'save' ? 'Case record updated.' : kind === 'resolve' ? 'Case resolved.' : kind === 'close' ? 'Case closed.' : 'Physical verification requested.');
      await load();
    } catch (err) {
      setError(err?.message || 'The action failed.');
    } finally {
      setBusy('');
    }
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 py-16 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading the case…
      </div>
    );
  }

  if (data.missing) {
    return (
      <div className="rgc-panel p-5">
        <p className="text-sm font-medium text-foreground">Case not found</p>
        <p className="mt-1 text-xs text-muted-foreground">This case is not part of the current demonstration session.</p>
        <Link to="/investigations" className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
          <ArrowLeft className="h-3 w-3" /> Back to cases
        </Link>
      </div>
    );
  }

  const { record, shipment, events, audit } = data;
  const status = meta(CASE_STATUS, record.status);
  const priority = meta(PRIORITY, record.priority);
  const resolved = record.status === 'resolved' || record.status === 'closed';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/investigations" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-2.5 w-2.5" /> Cases
          </Link>
          <h1 className="rgc-mono mt-1 text-lg font-semibold tracking-tight text-foreground">{record.case_number}</h1>
          <p className="text-xs text-muted-foreground">{record.title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone={status.tone} label={status.label} />
          <StatusPill tone={priority.tone} label={priority.label} dot={false} />
          {record.physical_verification_requested ? <StatusPill tone="info" label="Verification requested" /> : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Panel title="Case summary">
            <p className="text-[11px] leading-relaxed text-foreground/90">{record.summary}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Category</dt>
                <dd className="text-[11px] text-foreground">{record.category}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Assigned to</dt>
                <dd className="text-[11px] text-foreground">{record.assigned_to}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Opened</dt>
                <dd className="rgc-mono text-[11px] text-foreground">{formatDateTime(record.opened_at)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Resolved</dt>
                <dd className="rgc-mono text-[11px] text-foreground">{record.resolved_at ? formatDateTime(record.resolved_at) : '—'}</dd>
              </div>
            </dl>

            {shipment ? (
              <Link
                to={`/packages/${shipment.tracking_number}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50"
              >
                Open package {shipment.tracking_number}
                <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
              </Link>
            ) : null}
          </Panel>

          <Panel title="Findings" subtitle="Editable. Recorded in the audit trail on save.">
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={4}
              placeholder="What does the evidence show, and what does it not show?"
              className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-2 text-[11px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => act('save')}
                disabled={Boolean(busy) || resolved}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy === 'save' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save findings
              </button>
              <button
                onClick={() => act('verify')}
                disabled={Boolean(busy) || resolved}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <ListChecks className="h-3 w-3" /> Request physical verification
              </button>
              {resolved ? <span className="text-[10px] text-muted-foreground">This case is closed to edits.</span> : null}
            </div>
            {error ? <p className="mt-2 text-[10px] text-tone-danger">{error}</p> : null}
            {notice ? <p className="mt-2 text-[10px] text-tone-ok">{notice}</p> : null}
          </Panel>

          <Panel title="Resolution" subtitle="What was done, and what the record now says">
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              placeholder="Describe the corrective action and the resulting state of the logistics record."
              className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-2 text-[11px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => act('resolve')}
                disabled={Boolean(busy) || resolved}
                className="inline-flex items-center gap-1.5 rounded-md bg-tone-ok/15 px-2.5 py-1.5 text-[11px] font-semibold text-tone-ok ring-1 ring-inset ring-tone-ok/30 disabled:opacity-50"
              >
                {busy === 'resolve' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Resolve case
              </button>
              <button
                onClick={() => act('close')}
                disabled={Boolean(busy) || !resolved || record.status === 'closed'}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Close and archive
              </button>
            </div>
            <p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 h-2.5 w-2.5 shrink-0" />
              Resolving a case marks the package record resolved and writes to the audit trail. Nothing is deleted.
            </p>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Recommended next actions" dense>
            <ul className="divide-y divide-border/70">
              {(record.recommended_actions || []).map((action, i) => (
                <li key={i} className="flex items-start gap-2 px-4 py-2">
                  <span className="rgc-mono mt-0.5 text-[10px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[11px] leading-relaxed text-foreground/90">{action}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Evidence position" subtitle={record.evidence_summary} />

          <Panel title="Linked events" subtitle={events.length + ' scan events on this package'} dense>
            <ul className="rgc-scroll max-h-[260px] divide-y divide-border/70 overflow-y-auto">
              {events.map((e) => {
                const sync = meta(SYNC_STATUS, e.sync_status);
                return (
                  <li key={e.id} className="px-4 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rgc-mono text-[10px] text-muted-foreground">{formatTime(e.occurred_at)}</span>
                      <StatusPill tone={sync.tone} label={sync.label} />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-foreground">{e.event_label}</p>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Audit trail" dense>
            <ul className="rgc-scroll max-h-[260px] divide-y divide-border/70 overflow-y-auto">
              {audit.map((a) => (
                <li key={a.id} className="px-4 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium text-foreground">{a.action}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTo(a.occurred_at)}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{a.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}