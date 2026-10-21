import React from 'react';
import { Play, Volume2 } from 'lucide-react';
import { TONE } from '@/lib/status';
import StatusPill from '@/components/common/StatusPill';

export default function AnnouncementRow({ item, active, speaking, disabled, onPlay }) {
  const tone = TONE[item.tone] || TONE.muted;

  return (
    <li
      className={
        'flex items-start gap-2.5 px-4 py-3 transition-colors ' +
        (active ? 'bg-primary/5' : 'hover:bg-muted/25')
      }
    >
      <span className={'mt-1 h-9 w-[3px] shrink-0 rounded-full ' + tone.bar} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">{item.title}</span>
          <StatusPill tone={item.tone} label={item.statusLabel} dot={false} />
          <span className="rgc-mono ml-auto text-[10px] text-muted-foreground">{item.tracking}</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.spoken}</p>
        {item.caseNumber ? (
          <p className="rgc-mono mt-0.5 text-[10px] text-muted-foreground">Case {item.caseNumber}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onPlay(item)}
        disabled={disabled}
        className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:border-primary/50 disabled:opacity-40"
        aria-label={'Play announcement for ' + item.tracking}
      >
        {active && speaking ? <Volume2 className="h-3 w-3 text-primary" /> : <Play className="h-3 w-3" />}
        Play
      </button>
    </li>
  );
}