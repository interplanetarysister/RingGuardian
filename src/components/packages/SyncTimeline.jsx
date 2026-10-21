import React from 'react';
import { ChevronRight, Video, VideoOff, ShieldAlert } from 'lucide-react';
import StatusPill from '@/components/common/StatusPill';
import { SYNC_STATUS, SCAN_STATUS, EVENT_TYPE, meta } from '@/lib/status';
import { formatTime, formatDate } from '@/lib/format';

export default function SyncTimeline({ events, selectedId, onSelect }) {
  const grouped = events.reduce((acc, event) => {
    const day = formatDate(event.occurred_at);
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  return (
    <div className="rgc-scroll max-h-[520px] overflow-y-auto">
      <ol className="divide-y divide-border/70">
        {Object.keys(grouped).map((day) => (
          <li key={day}>
            <p className="sticky top-0 z-10 border-b border-border/70 bg-card px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {day}
            </p>
            <ul>
              {grouped[day].map((event) => {
                const sync = meta(SYNC_STATUS, event.sync_status);
                const scan = meta(SCAN_STATUS, event.scan_status);
                const selected = event.id === selectedId;
                const hasCapture = Boolean(event.video_clip_key);
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(event)}
                      className={
                        'group flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ' +
                        (selected ? 'bg-accent/60' : 'hover:bg-accent/30')
                      }
                    >
                      <span className="rgc-mono w-[62px] shrink-0 pt-0.5 text-[11px] text-foreground">
                        {formatTime(event.occurred_at)}
                      </span>

                      <span className="mt-1 shrink-0">
                        {hasCapture ? (
                          <Video className="h-3.5 w-3.5 text-tone-info" />
                        ) : (
                          <VideoOff className="h-3.5 w-3.5 text-muted-foreground/60" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {EVENT_TYPE[event.event_type] || event.event_type}
                          </span>
                          {event.scan_status !== 'confirmed' ? <StatusPill tone={scan.tone} label={scan.label} /> : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-foreground">{event.event_label}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <StatusPill tone={sync.tone} label={sync.label} />
                          {event.scanner_id ? (
                            <span className="rgc-mono text-[10px] text-muted-foreground">{event.scanner_id}</span>
                          ) : null}
                          {event.camera_id ? (
                            <span className="rgc-mono text-[10px] text-muted-foreground">{event.camera_id}</span>
                          ) : null}
                          {event.vehicle ? (
                            <span className="rgc-mono text-[10px] text-muted-foreground">{event.vehicle}</span>
                          ) : null}
                        </span>
                        {event.sync_status !== 'matched' ? (
                          <span className="mt-1 flex items-start gap-1 text-[10px] leading-relaxed text-muted-foreground">
                            <ShieldAlert className="mt-0.5 h-2.5 w-2.5 shrink-0 text-tone-warn" />
                            <span className="line-clamp-2">{event.sync_note}</span>
                          </span>
                        ) : null}
                      </span>

                      <ChevronRight
                        className={
                          'mt-1 h-3.5 w-3.5 shrink-0 transition-transform ' +
                          (selected ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-muted-foreground')
                        }
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}