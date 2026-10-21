import React from 'react';
import { MapPin, Truck, Scale, Package2, CalendarClock, CircleDollarSign } from 'lucide-react';
import StatusPill from '@/components/common/StatusPill';
import { SHIPMENT_STATUS, EVIDENCE, CASE_STATUS, meta } from '@/lib/status';
import { formatDateTime, money } from '@/lib/format';

function Field({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-2">
      {Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className={'break-words text-xs leading-relaxed text-foreground ' + (mono ? 'rgc-mono' : '')}>{value || '—'}</dd>
      </div>
    </div>
  );
}

export default function PackageSummary({ shipment, camera, scanner, caseRecord }) {
  const status = meta(SHIPMENT_STATUS, shipment.status);
  const evidence = meta(EVIDENCE, shipment.evidence_status);
  const caseStatus = meta(CASE_STATUS, shipment.investigation_status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusPill tone={status.tone} label={status.label} />
        <StatusPill tone={evidence.tone} label={evidence.label} />
        {shipment.investigation_status !== 'none' ? <StatusPill tone={caseStatus.tone} label={caseStatus.label} /> : null}
        {shipment.discrepancy_flag ? <StatusPill tone="danger" label="Discrepancy flagged" /> : null}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{shipment.scenario_summary}</p>

      <dl className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2">
        <Field icon={MapPin} label="Destination" value={shipment.expected_destination} />
        <Field icon={MapPin} label="Last known location" value={shipment.last_known_location} />
        <Field icon={Truck} label="Current facility" value={shipment.current_facility} mono />
        <Field label="Recipient" value={shipment.recipient_name} />
        <Field icon={Scale} label="Weight" value={shipment.weight_lb + ' lb'} />
        <Field icon={Package2} label="Dimensions" value={shipment.dimensions} />
        <Field icon={CalendarClock} label="Promised" value={shipment.promised_date} mono />
        <Field icon={CircleDollarSign} label="Declared value" value={money(shipment.declared_value_usd)} mono />
        <Field label="Last verified scan" value={formatDateTime(shipment.last_verified_scan_at)} mono />
        <Field label="Contents" value={shipment.contents_summary} />
        {scanner ? <Field label="Bound scanner" value={scanner.device_id + ' · ' + scanner.model} mono /> : null}
        {camera ? <Field label="Bound camera" value={camera.device_id + ' · ' + camera.model} mono /> : null}
      </dl>

      {shipment.discrepancy_reason ? (
        <div className="rounded-md border border-tone-danger/30 bg-tone-danger/10 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-tone-danger">Recorded discrepancy</p>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground/90">{shipment.discrepancy_reason}</p>
          <p className="mt-1.5 text-[10px] italic leading-relaxed text-muted-foreground">
            This states what the evidence does and does not show. It does not assert cause and does not identify any
            individual.
          </p>
        </div>
      ) : null}

      {caseRecord ? (
        <div className="rounded-md border border-border bg-muted/30 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="rgc-mono text-[11px] font-medium text-foreground">{caseRecord.case_number}</p>
            <StatusPill tone={meta(CASE_STATUS, caseRecord.status).tone} label={meta(CASE_STATUS, caseRecord.status).label} />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{caseRecord.title}</p>
        </div>
      ) : null}
    </div>
  );
}