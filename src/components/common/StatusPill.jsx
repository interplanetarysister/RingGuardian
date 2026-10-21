import React from 'react';
import { TONE, meta } from '@/lib/status';

export default function StatusPill({ tone, label, dot = true, className = '' }) {
  const t = TONE[tone] || TONE.muted;
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap ' +
        t.pill +
        ' ' +
        className
      }
    >
      {dot ? <span className={'h-1.5 w-1.5 rounded-full ' + t.dot} /> : null}
      {label}
    </span>
  );
}

/** Renders a status from one of the vocabulary maps in lib/status.js. */
export function StatusFrom({ map, value, dot = true }) {
  const m = meta(map, value);
  return <StatusPill tone={m.tone} label={m.label} dot={dot} />;
}