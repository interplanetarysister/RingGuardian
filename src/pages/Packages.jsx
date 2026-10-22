import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, ArrowRight, Filter } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import EmptyState from '@/components/common/EmptyState';
import { loadBoard } from '@/lib/board';
import { SHIPMENT_STATUS, EVIDENCE, CASE_STATUS, meta } from '@/lib/status';
import { formatTime, formatDate } from '@/lib/format';
import { packageProfilePath } from '@/lib/packageLinks';

const FILTERS = [
  { key: 'all', label: 'All packages' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'delivered_received', label: 'Delivered' },
  { key: 'missing', label: 'Missing' },
  { key: 'misrouted', label: 'Misrouted' },
  { key: 'scan_exception', label: 'Scan exception' }
];

export default function Packages() {
  const [board, setBoard] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    loadBoard().then((b) => alive && setBoard(b));
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    if (!board) return [];
    const q = query.trim().toLowerCase();
    return board.shipments.filter((s) => {
      const matchesQuery =
        !q ||
        s.tracking_number.toLowerCase().includes(q) ||
        (s.recipient_name || '').toLowerCase().includes(q) ||
        (s.package_nickname || '').toLowerCase().includes(q) ||
        (s.destination_city || '').toLowerCase().includes(q) ||
        (s.scenario_title || '').toLowerCase().includes(q);
      const matchesFilter =
        filter === 'all' ? true : filter === 'flagged' ? s.discrepancy_flag : s.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [board, query, filter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Packages</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Open any package to see its custody timeline, the matching evidence and the investigator controls.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracking number, package nickname, recipient or city"
            className="w-full rounded-md border border-input bg-card py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="mr-1 h-3 w-3 shrink-0 text-muted-foreground" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                'shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ' +
                (filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Panel dense>
        {!board ? (
          <div className="space-y-2 p-4" aria-label="Loading packages">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted/60" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No packages match"
            hint="Clear the search or choose a different filter."
            action={
              <button
                type="button"
                onClick={() => { setQuery(''); setFilter('all'); }}
                className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <ul className="grid gap-3 p-3 md:grid-cols-2" aria-label="Package search results">
            {rows.map((s) => {
              const status = meta(SHIPMENT_STATUS, s.status);
              const evidence = meta(EVIDENCE, s.evidence_status);
              const caseStatus = meta(CASE_STATUS, s.investigation_status);
              return (
                <li key={s.id || s.tracking_number} className="min-w-0">
                  <Link
                    to={packageProfilePath(s.tracking_number)}
                    aria-label={`View package profile for ${s.package_nickname || s.scenario_title || s.tracking_number}, tracking ${s.tracking_number}`}
                    className="group flex h-full flex-col gap-3 rounded-xl border-2 border-border bg-card p-4 text-foreground transition-colors hover:border-primary hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold">
                          {s.package_nickname || s.scenario_title || 'Package'}
                        </p>
                        <p className="rgc-mono mt-1 break-all text-xs text-muted-foreground">{s.tracking_number}</p>
                      </div>
                      <ArrowRight aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                    {s.package_nickname && s.scenario_title && (
                      <p className="text-xs text-muted-foreground">{s.scenario_title}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={status.tone} label={status.label} />
                      <StatusPill tone={evidence.tone} label={evidence.label} />
                      {s.investigation_status !== 'none' && (
                        <StatusPill tone={caseStatus.tone} label={caseStatus.label} />
                      )}
                    </div>
                    <div className="mt-auto space-y-1 border-t border-border pt-3 text-xs">
                      <p><span className="text-muted-foreground">Recipient:</span> {s.recipient_name || '—'}</p>
                      <p><span className="text-muted-foreground">Destination:</span> {s.destination_city || '—'}</p>
                      <p>
                        <span className="text-muted-foreground">Last verified scan:</span>{' '}
                        {s.last_verified_scan_at ? `${formatTime(s.last_verified_scan_at)} · ${formatDate(s.last_verified_scan_at)}` : 'Not recorded'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary">View package profile →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}