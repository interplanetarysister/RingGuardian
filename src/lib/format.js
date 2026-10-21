// All recorded timestamps are displayed in the demonstration's facility time zone
// (US Pacific), so a fixture stamped 14:02:11 always renders as 14:02:11 regardless of
// where the judge is sitting.

export const DEMO_TZ = 'America/Los_Angeles';

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEMO_TZ,
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEMO_TZ,
  day: '2-digit',
  month: 'short'
});

const fullFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEMO_TZ,
  day: '2-digit',
  month: 'short',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatTime(iso) {
  const d = toDate(iso);
  return d ? timeFmt.format(d) : '—';
}

export function formatDate(iso) {
  const d = toDate(iso);
  return d ? dateFmt.format(d) : '—';
}

export function formatDateTime(iso) {
  const d = toDate(iso);
  return d ? fullFmt.format(d) : '—';
}

export function formatClock(iso, offsetSeconds) {
  const d = toDate(iso);
  if (!d) return '—';
  return timeFmt.format(new Date(d.getTime() + Math.max(0, offsetSeconds || 0) * 1000));
}

export function relativeTo(iso) {
  const d = toDate(iso);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return 'just now';
  if (Math.abs(mins) < 60) return mins + 'm ago';
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return hours + 'h ago';
  return Math.round(hours / 24) + 'd ago';
}

export function shortTracking(value) {
  if (!value) return '—';
  return value.length > 12 ? value.slice(0, 4) + '…' + value.slice(-6) : value;
}

export function money(value) {
  if (typeof value !== 'number') return '—';
  return '$' + value.toFixed(2);
}

export function percent(value, digits) {
  if (typeof value !== 'number') return '—';
  return (value * 100).toFixed(digits === undefined ? 0 : digits) + '%';
}

export function clockString(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return String(m).padStart(2, '0') + ':' + String(rest).padStart(2, '0');
}