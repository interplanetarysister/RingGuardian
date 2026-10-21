// Ring Guardian Cam — shared access helpers for backend functions.
//
// Access model, stated plainly:
//   * This application is a public hackathon demonstration with no sign-in.
//   * Reads are attempted with the caller's app-scoped token first (so normal
//     entity access rules apply) and fall back to the service role only when no
//     caller context exists — a public app serving anonymous judges has none.
//   * Writes are restricted to the fictional demo dataset through the service role,
//     because the demo dataset is intentionally shared, disposable and contains no
//     customer, employee or operational data of any kind.
//   * Nothing in this application reads, writes or proxies real logistics data.

export function readStore(base44) {
  return {
    async run(fn) {
      try {
        return await fn(base44.entities);
      } catch (err) {
        return await fn(base44.asServiceRole.entities);
      }
    }
  };
}

export function writeStore(base44) {
  return base44.asServiceRole.entities;
}

export async function listAll(store, entityName, query, sort, limit) {
  const res = await store[entityName].filter(query || {}, sort ? { sort, limit: limit || 200 } : { limit: limit || 200 });
  return Array.isArray(res) ? res : (res && res.items) || [];
}

export async function recordActivity(base44, entry) {
  try {
    const store = writeStore(base44);
    await store.ActivityLog.create({
      demo_session_id: entry.demo_session_id || "",
      actor: entry.actor || "demo_operator",
      action: entry.action,
      entity_type: entry.entity_type || "",
      entity_ref: entry.entity_ref || "",
      detail: entry.detail || "",
      occurred_at: new Date().toISOString(),
      severity: entry.severity || "info",
      category: entry.category || "general"
    });
  } catch (err) {
    // Activity logging must never break a demonstration action.
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function badRequest(message, status) {
  return Response.json({ ok: false, error: message }, { status: status || 400 });
}