// Ring Guardian Cam — Package P.I. interoperability gateway.
//
// A versioned evidence-request contract used by the companion Package P.I. application,
// and by the investigator console inside this app when it reviews those requests.
//
// Authentication: a demonstration bearer token generated locally per session. It is a
// demo-scope credential only. No real customer credential, Ring credential or customer
// record is accepted or returned by this endpoint.
//
// This is NOT a claim of production integration. The two applications exchange requests
// through this documented contract; neither application has been certified against the
// other, and no real customer data is present on either side.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { readStore, writeStore, recordActivity, listAll, badRequest, nowIso } from '../../shared/access.ts';

const API_VERSION = '1.0.0';

function validSession(id) {
  return typeof id === 'string' && id.length >= 6 && id.length <= 80 && /^[A-Za-z0-9_-]+$/.test(id);
}

function readToken(req, payload) {
  const header = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return typeof payload.token === 'string' ? payload.token.trim() : '';
}

function tokenValid(token) {
  return typeof token === 'string' && token.length >= 32 && /^[A-Za-z0-9._-]+$/.test(token);
}

function envelope(ok, request, evidence, error, status) {
  return Response.json(
    {
      api_version: API_VERSION,
      ok,
      request: request || null,
      evidence: evidence || null,
      error: error || null,
      disclosure: 'Demonstration contract. Fictional logistics records and generated sample media only.'
    },
    { status: status || 200 }
  );
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const action = payload.action;
    const token = readToken(req, payload);

    if (!tokenValid(token)) {
      return envelope(false, null, null, 'A demonstration bearer token is required. Generate one inside the demo session before calling this contract.', 401);
    }

    const demoSessionId = payload.demo_session_id;
    if (!validSession(demoSessionId)) return badRequest('A valid demo session identifier is required.');

    const reader = readStore(base44);
    const store = writeStore(base44);
    const requests = await reader.run((s) => listAll(s, 'FootageRequest', { demo_session_id: demoSessionId }, '-created_date', 200));

    // -------------------------------------------------------------- GET /requests/:id

    if (action === 'get_request') {
      const found = requests.find((r) => r.request_id === payload.request_id);
      if (!found) return envelope(false, null, null, 'Request ' + payload.request_id + ' was not found for this session.', 404);
      return envelope(true, found, evidenceFor(found));
    }

    if (action === 'list_requests') {
      return Response.json({
        api_version: API_VERSION,
        ok: true,
        requests: requests.map((r) => ({ ...r, evidence: evidenceFor(r) })),
        disclosure: 'Demonstration contract. Fictional logistics records only.'
      });
    }

    // ------------------------------------------------- POST /requests  (Package P.I.)

    if (action === 'request_footage') {
      const shipments = await reader.run((s) => listAll(s, 'Shipment', { demo_session_id: demoSessionId, tracking_number: payload.tracking_number }, null, 1));
      if (shipments.length === 0) return envelope(false, null, null, 'Tracking number ' + payload.tracking_number + ' is not present in this demo session.', 404);

      const idempotency = payload.idempotency_key || '';
      if (idempotency) {
        const duplicate = requests.find((r) => r.idempotency_key === idempotency);
        if (duplicate) return envelope(true, duplicate, evidenceFor(duplicate));
      }

      const created = await store.FootageRequest.create({
        demo_session_id: demoSessionId,
        request_id: 'REQ-PPI-' + String(10023 + requests.length),
        requester_system: payload.requester_system || 'Package P.I. (companion application)',
        tracking_number: payload.tracking_number,
        status: 'pending',
        requested_at: nowIso(),
        reviewer: '',
        scope: (payload.scope || 'Requested window not specified').slice(0, 400),
        justification: (payload.justification || '').slice(0, 800),
        api_version: API_VERSION,
        idempotency_key: idempotency,
        redaction_level: '',
        response_summary: '',
        decision_note: '',
        delivered_clip_key: ''
      });

      await recordActivity(base44, {
        demo_session_id: demoSessionId,
        actor: created.requester_system,
        action: 'Footage request received',
        entity_type: 'FootageRequest',
        entity_ref: created.request_id,
        detail: 'Request for ' + created.tracking_number + ' entered the investigator review queue.',
        severity: 'notice',
        category: 'interop'
      });

      return envelope(true, created, null);
    }

    // ------------------------------------- POST /requests/:id/decision  (investigator)

    if (action === 'decide') {
      const found = requests.find((r) => r.request_id === payload.request_id);
      if (!found) return envelope(false, null, null, 'Request not found.', 404);
      if (found.status === 'rejected') return envelope(false, found, null, 'This request was already rejected and cannot be re-decided.', 409);

      const decision = payload.decision === 'approve' ? 'approved' : 'rejected';
      const note = (payload.note || '').slice(0, 600);

      if (decision === 'rejected') {
        const updated = await store.FootageRequest.update(found.id, {
          status: 'rejected',
          decided_at: nowIso(),
          reviewer: payload.reviewer || 'Jordan Alvarez (EMP-6733)',
          decision_note: note || 'Disclosure declined. The requested window does not contain evidence that may be released under the demonstration policy.',
          response_summary: 'No media released.'
        });
        await recordActivity(base44, {
          demo_session_id: demoSessionId,
          actor: updated.reviewer,
          action: 'Footage request rejected',
          entity_type: 'FootageRequest',
          entity_ref: updated.request_id,
          detail: updated.decision_note,
          severity: 'notice',
          category: 'interop'
        });
        return envelope(true, updated, null);
      }

      const updated = await store.FootageRequest.update(found.id, {
        status: 'approved',
        decided_at: nowIso(),
        reviewer: payload.reviewer || 'Jordan Alvarez (EMP-6733)',
        redaction_level: payload.redaction_level || 'faces_blurred_and_audio_removed',
        decision_note: note || 'Disclosure approved at the redaction level permitted for the demonstration.',
        response_summary: 'Approved for release as a redacted sample clip or an approved summary.'
      });
      await recordActivity(base44, {
        demo_session_id: demoSessionId,
        actor: updated.reviewer,
        action: 'Footage request approved',
        entity_type: 'FootageRequest',
        entity_ref: updated.request_id,
        detail: 'Redaction level: ' + updated.redaction_level + '.',
        severity: 'notice',
        category: 'interop'
      });
      return envelope(true, updated, evidenceFor(updated));
    }

    // ------------------------------------- POST /requests/:id/deliver  (investigator)

    if (action === 'deliver') {
      const found = requests.find((r) => r.request_id === payload.request_id);
      if (!found) return envelope(false, null, null, 'Request not found.', 404);
      if (found.status !== 'approved') return envelope(false, found, null, 'Only an approved request can be delivered.', 409);

      const events = await reader.run((s) => listAll(s, 'ScanEvent', { demo_session_id: demoSessionId, tracking_number: found.tracking_number }, '-occurred_at', 100));
      const matched = events.find((e) => e.video_clip_key && e.event_type === 'delivery') || events.find((e) => e.video_clip_key);

      const updated = await store.FootageRequest.update(found.id, {
        status: 'delivered',
        delivered_clip_key: matched ? matched.video_clip_key : '',
        response_summary: matched
          ? 'A redacted sample clip (' + matched.video_clip_key + ') was released with the recorded timestamp and source attribution.'
          : 'No releasable media exists for this request. An approved summary was returned instead.'
      });
      await recordActivity(base44, {
        demo_session_id: demoSessionId,
        actor: 'package_pi_gateway',
        action: 'Evidence released to requester',
        entity_type: 'FootageRequest',
        entity_ref: updated.request_id,
        detail: updated.response_summary,
        severity: 'info',
        category: 'interop'
      });
      return envelope(true, updated, evidenceFor(updated));
    }

    return badRequest('Unknown contract action: ' + action);
  } catch (error) {
    return Response.json({ api_version: API_VERSION, ok: false, error: error.message }, { status: 500 });
  }
}

function evidenceFor(request) {
  if (!request) return null;
  if (request.status !== 'approved' && request.status !== 'delivered') {
    return {
      released: false,
      reason: request.status === 'pending'
        ? 'Awaiting investigator review. No media is released before a decision.'
        : 'Disclosure declined.'
    };
  }
  return {
    released: true,
    clip_key: request.delivered_clip_key || null,
    redaction_level: request.redaction_level || 'faces_blurred_and_audio_removed',
    source_attribution: 'Generated scene reconstruction — not device footage',
    released_at_contract_version: API_VERSION,
    note: 'Media is a generated sample reconstruction, not a recording from a Ring device.'
  };
}