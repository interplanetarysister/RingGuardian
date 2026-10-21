import React from 'react';
import { AI_STATE, TONE } from '@/lib/status';
import { percent } from '@/lib/format';

// The pallet view is a scripted object-state display. It is deliberately presented as a
// preview of a planned capability, not as a running computer-vision model.
export default function PalletStage({ objects, revealedObjectState = {}, heldSlot = null }) {
  const cells = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-[#0a1220] p-3">
      <div className="pointer-events-none absolute inset-0 rgc-grid-bg opacity-40" />
      <div className="relative">
        <div className="mb-2 flex items-center justify-between">
          <p className="rgc-mono text-[10px] uppercase tracking-wide text-muted-foreground">CAM-3310 · pallet 6 · overhead</p>
          <span className="rgc-mono text-[10px] text-muted-foreground">{objects.length} objects</span>
        </div>

        <div className="mb-4 flex items-center gap-4 rounded-lg border border-border p-3">
          <svg width="110" height="90" viewBox="0 0 110 90" role="img" aria-label="Worker entering loading bay with vest camera enabled"><g transform={`translate(${heldSlot?65:35} 0)`} style={{transition:'transform 1s'}}><circle cy="15" r="10" fill="#c49b78"/><rect x="-15" y="28" width="30" height="36" rx="6" fill="#d1db59"/><rect x="-13" y="64" width="9" height="24" fill="#64748b"/><rect x="4" y="64" width="9" height="24" fill="#64748b"/><rect x="-5" y="36" width="10" height="8" fill="#111827"/><circle cy="40" r="2" fill="#34d399"/></g></svg>
          <div><p className="text-sm font-semibold">Worker in loading bay · Camera on</p><p className="text-xs text-muted-foreground">Package destination → expected truck → scan → camera interval</p><p className="mt-1 text-xs text-tone-warn">Partial scans and unscanned loading are retained for investigator review.</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {cells.map((slot) => {
            const found = objects.find((o) => o.pallet_slot === slot);
            const state = (found && revealedObjectState[slot]) || (found ? found.state : 'RED');
            const tone = TONE[AI_STATE[state].tone];
            const lifted = heldSlot === slot;
            const confidence = found ? (revealedObjectState[slot + ':confidence'] ?? found.confidence) : null;

            return (
              <div
                key={slot}
                className={
                  'relative rounded-md border p-2 transition-all duration-500 ' +
                  tone.pill +
                  ' ' +
                  (lifted ? '-translate-y-1 shadow-lg' : '')
                }
              >
                <div className="flex items-start justify-between">
                  <span className="rgc-mono text-[10px] font-semibold opacity-80">{slot}</span>
                  <span className={'h-2 w-2 rounded-full ' + tone.dot} />
                </div>
                <div className={'mt-2 rounded border border-current/20 bg-background/40 px-1.5 py-2 transition-transform duration-500 ' + (lifted ? 'scale-[0.97]' : '')}>
                  <p className="rgc-mono truncate text-[9px] opacity-90">{found ? found.tracking_number.slice(-6) : '—'}</p>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-wide">{AI_STATE[state].label}</span>
                  <span className="rgc-mono text-[9px] opacity-80">{confidence !== null ? percent(confidence) : '—'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-2">
          {Object.keys(AI_STATE).map((key) => (
            <span key={key} className="inline-flex items-center gap-1">
              <span className={'h-2 w-2 rounded-full ' + TONE[AI_STATE[key].tone].dot} />
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{key} · {AI_STATE[key].label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}