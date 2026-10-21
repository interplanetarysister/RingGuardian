import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search, Save, Loader2, ArrowUpDown, X, Info } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import { loadBoard, clipByKey, caseFor } from '@/lib/board';
import { ops } from '@/lib/demo';
import { SYNC_STATUS, CASE_STATUS, meta } from '@/lib/status';
import { formatDateTime, formatTime } from '@/lib/format';

const COLUMNS = [
  { key: 'tracking_number', label: 'Package ID' },
  { key: 'event_label', label: 'Scan event' },
  { key: 'scanner_id', label: 'Scanner' },
  { key: 'employee_id', label: 'Worker session' },
  { key: 'camera_id', label: 'Camera' },
  { key: 'facility', label: 'Facility' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'occurred_at', label: 'Scan time' },
  { key: 'playback_position_seconds', label: 'Video offset' },
  { key: 'video_clip_key', label: 'Video ref' },
  { key: 'evidence_source', label: 'Evidence source' },
  { key: 'investigation_status', label: 'Investigation' }
];

export default function Logistics() {
  const [board, setBoard] = useState(null);
  const [query, setQuery] = useState('');
  const [facility, setFacility] = useState('all');
  const [sync, setSync] = useState('all');
  const [sort, setSort] = useState({ key: 'occurred_at', dir: 'desc' });
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ event_label: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function load() {
    const b = await loadBoard();
    setBoard(b);
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    if (!board) return [];
    const q = query.trim().toLowerCase();
    const filtered = board.events
      .map((e) => {
        const shipment = board.shipments.find((s) => s.tracking_number === e.tracking_number);
        const clip = clipByKey(board, e.video_clip_key);
        return {
          ...e,
          investigation_status: caseFor(board, e.tracking_number)?.status || 'none',
          video_time: clip ? formatTime(clip.recorded_start) : '—',
          shipment
        };
      })
      .filter((e) => {
        const matchQ =
          !q ||
          e.tracking_number.toLowerCase().includes(q) ||
          (e.event_label || '').toLowerCase().includes(q) ||
          (e.scanner_id || '').toLowerCase().includes(q) ||
          (e.vehicle || '').toLowerCase().includes(q);
        const matchFacility = facility === 'all' || e.facility === facility;
        const matchSync = sync === 'all' || e.sync_status === sync;
        return matchQ && matchFacility && matchSync;
      });

    return filtered.sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [board, query, facility, sync, sort]);

  function exportCsv() {
    const headers = ['tracking_number', 'event', 'scanner', 'employee', 'camera', 'facility', 'vehicle', 'scan_time_pt', 'video_offset_s', 'video_ref', 'evidence_source', 'investigation'];
    const lines = rows.map((r) =>
      [
        r.tracking_number,
        r.event_label,
        r.scanner_id || '',
        r.employee_id || '',
        r.camera_id || '',
        r.facility || '',
        r.vehicle || '',
        r.occurred_at,
        r.playback_position_seconds ?? '',
        r.video_clip_key || '',
        r.evidence_source || '',
        r.investigation_status
      ]
        .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ring-guardian-logistics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveRecord() {
    if (!editing) return;
    setBusy(true);
    setNotice('');
    try {
      const res = await ops({ action: 'updateRecord', event_id: editing.id, event_label: draft.event_label, note: draft.note });
      if (res?.ok === false) throw new Error(res.error);
      setNotice('Record saved to the demonstration database.');
      setEditing(null);
      await load();
    } catch (err) {
      setNotice(err?.message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!board) return <div className="h-40 animate-pulse rounded-lg bg-muted/40" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Logistics grid</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Every scan event joined to its scanner, work session, camera and evidence reference. Reads and writes go to
            the demonstration database, so an edit survives a refresh.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50"
        >
          <Download className="h-3 w-3" /> Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by tracking number, event, scanner or vehicle"
            className="w-full rounded-md border border-input bg-card py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={facility}
          onChange={(e) => setFacility(e.target.value)}
          className="rounded-md border border-input bg-card px-2 py-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All facilities</option>
          {[...new Set(board.events.map((e) => e.facility))].filter(Boolean).map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select
          value={sync}
          onChange={(e) => setSync(e.target.value)}
          className="rounded-md border border-input bg-card px-2 py-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All sync states</option>
          {Object.keys(SYNC_STATUS).map((k) => (
            <option key={k} value={k}>{SYNC_STATUS[k].label}</option>
          ))}
        </select>
        <span className="rgc-mono text-[10px] text-muted-foreground">{rows.length} rows</span>
      </div>

      {notice ? <p className="text-[11px] text-tone-ok">{notice}</p> : null}

      <Panel dense>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2 font-medium">
                    <button
                      onClick={() => setSort((s) => ({ key: col.key, dir: s.key === col.key && s.dir === 'asc' ? 'desc' : 'asc' }))}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.label}
                      <ArrowUpDown className={'h-2.5 w-2.5 ' + (sort.key === col.key ? 'text-primary' : 'opacity-40')} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => {
                const syncMeta = meta(SYNC_STATUS, r.sync_status);
                const caseMeta = meta(CASE_STATUS, r.investigation_status);
                return (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setEditing(r);
                      setDraft({ event_label: r.event_label || '', note: r.note || '' });
                    }}
                    className={'cursor-pointer hover:bg-accent/25 ' + (editing?.id === r.id ? 'bg-accent/40' : '')}
                  >
                    <td className="whitespace-nowrap px-3 py-2">
                      <Link
                        to={`/packages/${r.tracking_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rgc-mono text-[10px] text-primary hover:underline"
                      >
                        {r.tracking_number}
                      </Link>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-[10px] text-foreground">{r.event_label}</td>
                    <td className="whitespace-nowrap px-3 py-2"><span className="rgc-mono text-[10px] text-muted-foreground">{r.scanner_id || '—'}</span></td>
                    <td className="whitespace-nowrap px-3 py-2"><span className="rgc-mono text-[10px] text-muted-foreground">{r.employee_id || '—'}</span></td>
                    <td className="whitespace-nowrap px-3 py-2"><span className="rgc-mono text-[10px] text-muted-foreground">{r.camera_id || '—'}</span></td>
                    <td className="whitespace-nowrap px-3 py-2"><span className="rgc-mono text-[10px] text-muted-foreground">{r.facility}</span></td>
                    <td className="whitespace-nowrap px-3 py-2"><span className="rgc-mono text-[10px] text-muted-foreground">{r.vehicle || '—'}</span></td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="rgc-mono text-[10px] text-foreground">{formatTime(r.occurred_at)}</span>
                      <StatusPill tone={syncMeta.tone} label={syncMeta.label} className="ml-1.5" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="rgc-mono text-[10px] text-foreground">
                        {r.video_clip_key ? '+' + (r.playback_position_seconds || 0) + 's' : '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2"><span className="rgc-mono text-[10px] text-muted-foreground">{r.video_clip_key || '—'}</span></td>
                    <td className="max-w-[180px] truncate px-3 py-2 text-[10px] text-muted-foreground">{r.evidence_source || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {r.investigation_status === 'none' ? (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      ) : (
                        <StatusPill tone={caseMeta.tone} label={caseMeta.label} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing ? (
        <Panel
          title="Edit record"
          subtitle={editing.tracking_number + ' · ' + formatDateTime(editing.occurred_at)}
          actions={
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close editor">
              <X className="h-3.5 w-3.5" />
            </button>
          }
        >
          <div className="space-y-2">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Event label</label>
              <input
                value={draft.event_label}
                onChange={(e) => setDraft((d) => ({ ...d, event_label: e.target.value }))}
                className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Investigator note</label>
              <textarea
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                rows={3}
                className="mt-1 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              onClick={saveRecord}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save record
            </button>
            <p className="flex items-start gap-1 text-[10px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-2.5 w-2.5 shrink-0" />
              Edits are written to the database and appear wherever this record is shown. Use Reset demo to restore the
              original fixtures.
            </p>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}