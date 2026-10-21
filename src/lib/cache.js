// A tiny in-memory cache for the demonstration board.
//
// Every screen reads the same datasets. Without a cache, moving between screens re-issues
// every query and quickly exhausts the request budget. The cache is cleared by any write,
// so a mutation is always followed by a fresh read.

let entry = null;

export function readCache(ttlMs) {
  if (!entry) return null;
  if (Date.now() - entry.at > ttlMs) return null;
  return entry.data;
}

/** Last successful read, regardless of age. Used only as a fallback when a refresh fails. */
export function readStale() {
  return entry ? entry.data : null;
}

export function writeCache(data) {
  entry = { at: Date.now(), data };
}

export function clearCache() {
  entry = null;
}