import React from 'react';
import { TONE } from '@/lib/status';

export default function Metric({ label, value, hint, tone, icon: Icon }) {
  const t = TONE[tone] || TONE.muted;
  return (
    <div className="rgc-panel relative overflow-hidden px-4 py-3.5">
      <div className={'absolute inset-x-0 top-0 h-px ' + (tone ? t.bar + ' opacity-70' : 'bg-border')} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon ? <Icon className={'h-3.5 w-3.5 ' + (tone ? t.text : 'text-muted-foreground')} strokeWidth={2} /> : null}
      </div>
      <p className="mt-1.5 font-heading text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{hint}</p> : null}
    </div>
  );
}