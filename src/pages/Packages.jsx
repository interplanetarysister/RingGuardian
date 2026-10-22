import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, ArrowRight, Filter } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import EmptyState from '@/components/common/EmptyState';
import { loadBoard } from '@/lib/board';
import { SHIPMENT_STATUS, EVIDENCE, CASE_STATUS, meta } from '@/lib/status';
import { formatTime, formatDate } from '@/lib/format';

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
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted/60" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No packages match"
            hint="Clear the search or choose a different filter."
            action={
              <button
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                }}
                className="rounded-md border border-border px-2.5 py-1 text-[11px] text-foreground"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Tracking</th>
                  <th className="px-4 py-2.5 font-medium">Scenario</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Evidence</th>
                  <th className="px-4 py-2.5 font-medium">Last verified scan</th>
                  <th className="px-4 py-2.5 font-medium">Case</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((s) => {
                  const status = meta(SHIPMENT_STATUS, s.status);
                  const evidence = meta(EVIDENCE, s.evidence_status);
                  const caseStatus = meta(CASE_STATUS, s.investigation_status);
                  return (
                    <tr key={s.id} className="group hover:bg-accent/20">
                      <td className="px-4 py-3">
                        <Link to={`/packages/${s.tracking_number}`} className="rgc-mono text-[11px] font-medium text-foreground hover:text-primary">
                          {s.tracking_number}
                        </Link>
                        {s.package_nickname&&<p className="mt-0.5 text-[11px] font-semibold text-primary">{s.package_nickname} (customer nickname)</p>}<p className="mt-0.5 text-[10px] text-muted-foreground">{s.recipient_name} · {s.destination_city}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-foreground">{s.scenario_title}</td>
                      <td className="px-4 py-3">
                        <StatusPill tone={status.tone} label={status.label} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={evidence.tone} label={evidence.label} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="rgc-mono text-[11px] text-foreground">{formatTime(s.last_verified_scan_at)}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{formatDate(s.last_verified_scan_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.investigation_status === 'none' ? (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        ) : (
                          <StatusPill tone={caseStatus.tone} label={caseStatus.label} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/packages/${s.tracking_number}`}
                          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary"
                        >
                          Open <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}