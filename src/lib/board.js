import { base44 } from '@/api/base44Client';
import { ensureSeeded, sessionId } from '@/lib/demo';
import { readCache, readStale, writeCache, clearCache } from '@/lib/cache';

const TTL_MS = 60000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBoard() {
  await ensureSeeded();
  const res=await base44.functions.invoke('demoBoard',{demo_session_id:sessionId()});
  if(res?.data?.ok!==true||!res.data.board)throw Error(res?.data?.error||'Demo records unavailable');
  return res.data.board;
}

/**
 * Loads every dataset the investigation screens read from, for this demo session.
 *
 * Cached for a minute and invalidated by any write, so screen-to-screen navigation does
 * not re-issue the whole read set. A transient request-limit rejection is retried with
 * backoff, and if every attempt fails the last successful read is returned rather than
 * leaving a screen stuck on a skeleton.
 */
export async function loadBoard(options) {
  const fresh = Boolean(options && options.fresh);
  if (!fresh) {
    const cached = readCache(TTL_MS);
    if (cached) return cached;
  }

  let board = null;
  let lastError = null;

  for (let attempt = 0; attempt < 3 && !board; attempt += 1) {
    try {
      board = await fetchBoard();
    } catch (err) {
      lastError = err;
      if (attempt < 2) await wait(400 * (attempt + 1));
    }
  }

  if (!board) {
    const stale = readStale();
    if (stale) return stale;
    throw lastError || new Error('The demonstration dataset could not be loaded.');
  }

  writeCache(board);
  return board;
}

export { clearCache };

export function eventsFor(board, trackingNumber) {
  return board.events
    .filter((e) => e.tracking_number === trackingNumber)
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
}

export function clipByKey(board, key) {
  return board.clips.find((c) => c.clip_key === key) || null;
}

export function caseFor(board, trackingNumber) {
  return board.cases.find((c) => c.tracking_number === trackingNumber) || null;
}

const TYPE_PRIORITY = ['delivery', 'loading', 'handling', 'corrective', 'sorting', 'receiving', 'exception', 'verification', 'departure', 'arrival'];

/** Chooses the event a judge should see first: the most evidential, not simply the first. */
export function primaryEvent(events) {
  if (!events || events.length === 0) return null;
  const withCapture = events.filter((e) => e.video_clip_key);
  const pool = withCapture.length > 0 ? withCapture : events;
  const suspicious = pool.filter((e) => e.sync_status !== 'matched');
  const ranked = (suspicious.length > 0 ? suspicious : pool).slice().sort((a, b) => {
    const pa = TYPE_PRIORITY.indexOf(a.event_type);
    const pb = TYPE_PRIORITY.indexOf(b.event_type);
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
  });
  return ranked[0] || events[0];
}

/** Scan events that fall inside a clip's capture window, as timeline markers. */
export function markersForClip(board, trackingNumber, clip) {
  if (!clip) return [];
  const start = new Date(clip.recorded_start).getTime();
  const end = new Date(clip.recorded_end).getTime();
  return board.events
    .filter((e) => {
      const t = new Date(e.occurred_at).getTime();
      return e.tracking_number === trackingNumber && t >= start && t <= end;
    })
    .map((e) => ({
      key: e.id,
      seconds: Math.max(0, (new Date(e.occurred_at).getTime() - start) / 1000),
      label: e.event_type === 'delivery' ? 'Delivery scan' : e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1) + ' scan',
      tone: e.sync_status === 'matched' ? 'ok' : e.sync_status === 'ambiguous' ? 'warn' : 'danger'
    }));
}