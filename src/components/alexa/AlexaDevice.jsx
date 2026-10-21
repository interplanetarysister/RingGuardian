import React from 'react';
import { Volume2, Square } from 'lucide-react';

export default function AlexaDevice({ speaking, text, label, onStop }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {speaking ? <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" /> : null}
        <span
          className={
            'relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors ' +
            (speaking ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-muted/40 text-muted-foreground')
          }
        >
          <Volume2 className="h-6 w-6" />
        </span>
      </div>

      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label || 'Echo device'}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{speaking ? 'Speaking' : 'Idle'}</p>
      </div>

      <div className="min-h-[72px] w-full rounded-lg border border-border bg-background/60 p-3">
        <p className="text-center text-[11px] leading-relaxed text-foreground">
          {text || 'No announcement is playing.'}
        </p>
      </div>

      <button
        type="button"
        onClick={onStop}
        disabled={!speaking}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50 disabled:opacity-40"
      >
        <Square className="h-3 w-3" /> Stop
      </button>
    </div>
  );
}