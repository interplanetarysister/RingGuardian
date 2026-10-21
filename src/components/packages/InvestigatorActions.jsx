import React, { useState } from 'react';
import { Flag, Search, Wrench, CheckCircle2, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { ops } from '@/lib/demo';

const ACTIONS = [
  {
    key: 'flag',
    label: 'Flag discrepancy',
    icon: Flag,
    hint: 'Records a mismatch between the logistics record and the evidence, and opens a case.',
    tone: 'danger'
  },
  {
    key: 'verify',
    label: 'Request physical verification',
    icon: Search,
    hint: 'Asks an associate to locate the parcel and re-scan it.',
    tone: 'info'
  },
  {
    key: 'correct',
    label: 'Locate and re-scan parcel',
    icon: Wrench,
    hint: 'Performs the corrective scan and updates the logistics record.',
    tone: 'warn'
  },
  {
    key: 'resolve',
    label: 'Resolve investigation',
    icon: CheckCircle2,
    hint: 'Closes the case with the recorded outcome.',
    tone: 'ok'
  }
];

export default function InvestigatorActions({ shipment, caseRecord, onDone }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState('');

  const isRecovery = shipment.scenario_key === 'wrong_delivery_truck';
  const isScanException = shipment.scenario_key === 'missing_hub_scan';
  const resolved = caseRecord && (caseRecord.status === 'resolved' || caseRecord.status === 'closed');

  async function run(key) {
    setBusy(key);
    setError('');
    try {
      let result = null;
      if (key === 'flag') {
        result = await ops({
          action: 'flagDiscrepancy',
          tracking_number: shipment.tracking_number,
          reason: note.trim() || 'Investigator flagged a discrepancy between the logistics record and the available evidence.',
          priority: shipment.status === 'missing' || shipment.status === 'delivered_no_receipt' ? 'high' : 'medium'
        });
      } else if (key === 'verify') {
        if (!caseRecord) throw new Error('Flag the discrepancy first to open a case.');
        result = await ops({ action: 'requestVerification', case_number: caseRecord.case_number });
      } else if (key === 'correct') {
        result = await ops({
          action: isRecovery ? 'correctiveRecovery' : 'correctiveScan',
          tracking_number: shipment.tracking_number
        });
      } else if (key === 'resolve') {
        if (!caseRecord) throw new Error('There is no case to resolve.');
        result = await ops({
          action: 'resolveCase',
          case_number: caseRecord.case_number,
          resolution: note.trim() || 'Resolved after review of the recorded evidence and the corrected logistics record.'
        });
      }
      if (!result) throw new Error('The action returned no result.');
      if (result.ok === false) throw new Error(result.error || 'The action was rejected.');
      setNote('');
      setShowNote('');
      if (onDone) onDone(result);
    } catch (err) {
      setError(err?.message || 'The action failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-2.5">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        const disabledByCase = (action.key === 'verify' || action.key === 'resolve') && (!caseRecord || resolved);
        const disabledByFlow = action.key === 'correct' && !(isRecovery || isScanException);
        const disabled = Boolean(busy) || disabledByCase || disabledByFlow || (action.key === 'flag' && resolved);
        return (
          <div key={action.key}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (action.key === 'flag' || action.key === 'resolve') {
                  setShowNote(action.key);
                  if (action.key === 'resolve' && caseRecord) run('resolve');
                  else setShowNote('flag');
                } else {
                  run(action.key);
                }
              }}
              className="flex w-full items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left transition-colors hover:border-primary/50 hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="mt-0.5">
                {busy === action.key ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-foreground">{action.label}</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{action.hint}</span>
              </span>
            </button>
          </div>
        );
      })}

      {showNote ? (
        <div className="rounded-md border border-border bg-muted/30 p-2.5">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Investigator note (recorded in the audit log)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="What did the evidence show?"
            className="mt-1 w-full resize-none rounded border border-input bg-background px-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => run(showNote)}
            disabled={Boolean(busy)}
            className="mt-1.5 inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
            Confirm {showNote === 'flag' ? 'flag' : 'resolution'}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="inline-flex items-start gap-1 text-[10px] leading-relaxed text-tone-danger">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {error}
        </p>
      ) : null}

      <p className="flex items-start gap-1 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-2.5 w-2.5 shrink-0" />
        Every action writes to the demonstration database and is recorded in the case audit trail.
      </p>
    </div>
  );
}