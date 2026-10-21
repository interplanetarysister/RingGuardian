import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderSearch, ArrowRight, Search } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import EmptyState from '@/components/common/EmptyState';
import { loadBoard } from '@/lib/board';
import { CASE_STATUS, PRIORITY, meta } from '@/lib/status';
import { formatDateTime } from '@/lib/format';

const FILTERS = [
  { key: 'all', label: 'All cases' },
  { key: 'open', label: 'Open' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved', label: 'Resolved' }
];

export default function Investigations() {
  const [board, setBoard] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    loadBoard().then((b) => alive && setBoard(b));
    return () => {
      alive = false;
    };
  }, []);

  const cases = useMemo(() => {
    if (!board) return [];
    const q = query.trim().toLowerCase();
    return board.cases.filter((c) => {
      const matchFilter = filter === 'all' ? true : c.status === filter;
      const matchQuery =
        !q ||
        c.case_number.toLowerCase().includes(q) ||
        c.tracking_number.toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [board, filter, query]);

  if (!board) return <div className="h-40 animate-pulse rounded-lg bg-muted/40" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Investigations</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Cases opened when the logistics record and the recorded evidence disagree. Findings state what the evidence
          shows; they never assert cause or identify a person.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search case number or tracking number"
            className="w-full rounded-md border border-input bg-card py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                'rounded-md px-2 py-1 text-[11px] font-medium transition-colors ' +
                (filter === f.key ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {cases.length === 0 ? (
        <Panel>
          <EmptyState icon={FolderSearch} title="No cases match" hint="Adjust the search or filter." />
        </Panel>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {cases.map((c) => {
            const status = meta(CASE_STATUS, c.status);
            const priority = meta(PRIORITY, c.priority);
            return (
              <Link key={c.id} to={`/investigations/${c.case_number}`} className="rgc-panel group p-4 transition-colors hover:border-primary/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="rgc-mono text-[11px] font-semibold text-foreground">{c.case_number}</span>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.category}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill tone={status.tone} label={status.label} />
                    <StatusPill tone={priority.tone} label={priority.label} dot={false} />
                  </div>
                </div>

                <p className="mt-2 text-xs font-medium text-foreground">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{c.summary}</p>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2">
                  <span className="rgc-mono text-[10px] text-primary">{c.tracking_number}</span>
                  <span className="text-[10px] text-muted-foreground">opened {formatDateTime(c.opened_at)}</span>
                  <span className="text-[10px] text-muted-foreground">{c.assigned_to}</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/50 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}