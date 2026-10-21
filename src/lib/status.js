// Presentation vocabulary. Every label here is deliberately cautious: the product shows
// what the evidence does and does not contain, and never asserts cause.

export const TONE = {
  ok: {
    pill: 'bg-tone-ok/10 text-tone-ok ring-1 ring-inset ring-tone-ok/30',
    dot: 'bg-tone-ok',
    text: 'text-tone-ok',
    bar: 'bg-tone-ok'
  },
  warn: {
    pill: 'bg-tone-warn/10 text-tone-warn ring-1 ring-inset ring-tone-warn/30',
    dot: 'bg-tone-warn',
    text: 'text-tone-warn',
    bar: 'bg-tone-warn'
  },
  danger: {
    pill: 'bg-tone-danger/10 text-tone-danger ring-1 ring-inset ring-tone-danger/30',
    dot: 'bg-tone-danger',
    text: 'text-tone-danger',
    bar: 'bg-tone-danger'
  },
  info: {
    pill: 'bg-tone-info/10 text-tone-info ring-1 ring-inset ring-tone-info/30',
    dot: 'bg-tone-info',
    text: 'text-tone-info',
    bar: 'bg-tone-info'
  },
  muted: {
    pill: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    bar: 'bg-muted-foreground'
  }
};

export const SHIPMENT_STATUS = {
  in_transit: { label: 'In transit', tone: 'info' },
  out_for_delivery: { label: 'Out for delivery', tone: 'info' },
  delivered_received: { label: 'Delivered and received', tone: 'ok' },
  delivered_no_receipt: { label: 'Delivered, not received', tone: 'danger' },
  misrouted: { label: 'Misrouted', tone: 'warn' },
  missing: { label: 'Missing', tone: 'danger' },
  recovered: { label: 'Recovered', tone: 'ok' },
  scan_exception: { label: 'Unconfirmed handling', tone: 'warn' }
};

export const SYNC_STATUS = {
  matched: { label: 'Matched', tone: 'ok' },
  missing_footage: { label: 'Missing footage', tone: 'danger' },
  ambiguous: { label: 'Ambiguous match', tone: 'warn' },
  incorrect_camera: { label: 'Incorrect camera', tone: 'danger' },
  delayed: { label: 'Delayed sync', tone: 'warn' },
  pending: { label: 'Pending', tone: 'muted' },
  rejected: { label: 'Match rejected', tone: 'warn' }
};

export const SCAN_STATUS = {
  confirmed: { label: 'Confirmed scan', tone: 'ok' },
  unconfirmed: { label: 'Unconfirmed', tone: 'warn' },
  failed: { label: 'Failed', tone: 'danger' },
  delayed: { label: 'Delayed', tone: 'warn' },
  missed: { label: 'Not received', tone: 'danger' }
};

export const CASE_STATUS = {
  open: { label: 'Open', tone: 'warn' },
  investigating: { label: 'Investigating', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'ok' },
  closed: { label: 'Closed', tone: 'muted' },
  none: { label: 'No case', tone: 'muted' }
};

export const PRIORITY = {
  low: { label: 'Low', tone: 'muted' },
  medium: { label: 'Medium', tone: 'info' },
  high: { label: 'High', tone: 'warn' },
  critical: { label: 'Critical', tone: 'danger' }
};

export const EVIDENCE = {
  available: { label: 'Evidence available', tone: 'ok' },
  partial: { label: 'Partial evidence', tone: 'warn' },
  missing: { label: 'No evidence', tone: 'danger' },
  not_applicable: { label: 'Not applicable', tone: 'muted' }
};

export const REQUEST_STATUS = {
  pending: { label: 'Awaiting review', tone: 'warn' },
  approved: { label: 'Approved', tone: 'ok' },
  rejected: { label: 'Declined', tone: 'danger' },
  delivered: { label: 'Released', tone: 'info' }
};

export const DEVICE_STATUS = {
  online: { label: 'Online', tone: 'ok' },
  offline: { label: 'Offline', tone: 'muted' },
  degraded: { label: 'Degraded', tone: 'warn' },
  unassigned: { label: 'Unassigned', tone: 'muted' },
  connected: { label: 'Connected', tone: 'ok' },
  disconnected: { label: 'Disconnected', tone: 'muted' },
  error: { label: 'Error', tone: 'danger' },
  pairing: { label: 'Pairing', tone: 'info' }
};

export const AI_STATE = {
  RED: { label: 'Unscanned', tone: 'danger', description: 'Visible with no matching verified scan.' },
  YELLOW: { label: 'Being held', tone: 'warn', description: 'Currently handled by an associate.' },
  GREEN: { label: 'Scanned', tone: 'ok', description: 'Associated with a confirmed scan event.' }
};

export const EVENT_TYPE = {
  receiving: 'Receiving',
  sorting: 'Sortation',
  loading: 'Loading',
  departure: 'Departure',
  arrival: 'Arrival',
  delivery: 'Delivery',
  handling: 'Handling',
  verification: 'Verification',
  corrective: 'Corrective scan',
  exception: 'Exception'
};

export function meta(map, key) {
  return map[key] || { label: key ? String(key).replace(/_/g, ' ') : 'Unknown', tone: 'muted' };
}