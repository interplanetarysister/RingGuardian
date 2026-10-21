// Ring Guardian Cam — Ring developer integration adapter.
//
// This is the Ring-track eligible surface: real code that calls documented Ring
// endpoints. Two modes are supported.
//
//   live      — Ring developer credentials are present. The function performs the
//               documented OAuth 2.0 refresh-token exchange, device discovery against
//               the Ring API base, and a WHEP live-video session request, all with the
//               caller's own Ring developer account.
//
//   simulated — no credentials are present. The same response shapes are produced by a
//               local simulator so the integration can be demonstrated end to end. Every
//               simulated payload is labelled as simulated; it is never presented as a
//               live Ring response.
//
// Documented endpoints used (Ring API Development Guide and Ring API documentation):
//   POST https://oauth.ring.com/oauth/token                        refresh-token exchange
//   GET  {apiBase}/v1/devices?include=capabilities,location,status  device discovery
//   POST {apiBase}/v1/devices/{deviceId}/media/streaming/whep/sessions  live video session
//   webhook — motion / device-add / device-remove events, HMAC signed, request_id deduped
//
// Credentials are read from environment secrets and never returned to a caller.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { writeStore, recordActivity } from '../../shared/access.ts';
import { verifyHmac } from '../../shared/hmac.ts';

const DEFAULT_API_BASE = 'https://api.amazonvision.com';
const TOKEN_URL = 'https://oauth.ring.com/oauth/token';

function readSecret(name) {
  try {
    const value = secrets.get(name);
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  } catch (err) {
    return '';
  }
}

function credentials() {
  return {
    clientId: readSecret('RING_CLIENT_ID'),
    clientSecret: readSecret('RING_CLIENT_SECRET'),
    refreshToken: readSecret('RING_REFRESH_TOKEN'),
    hmacKey: readSecret('RING_HMAC_KEY'),
    apiBase: readSecret('RING_API_BASE') || DEFAULT_API_BASE
  };
}

async function exchangeRefreshToken(creds) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: creds.refreshToken,
    client_id: creds.clientId,
    client_secret: creds.clientSecret
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(12000)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (err) { json = null; }
  if (!res.ok) {
    throw new Error('Ring token exchange failed with status ' + res.status + (json && json.error ? ' (' + json.error + ')' : ''));
  }
  return json || {};
}

async function ringGet(creds, path, accessToken) {
  const res = await fetch(creds.apiBase + path, {
    headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/vnd.api+json' },
    signal: AbortSignal.timeout(12000)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (err) { json = { raw: text.slice(0, 2000) }; }
  if (!res.ok) throw new Error('Ring API ' + path + ' returned ' + res.status);
  return json;
}

// ------------------------------------------------------------------ simulated payloads
// Shapes follow the JSON:API structure the documented Ring API returns, so the interface
// code is identical in both modes. Every payload carries source: "ring_api_simulator".

function simulatedDevices() {
  return {
    data: [
      {
        type: 'devices',
        id: 'ring-dev-88213',
        attributes: {
          name: 'Front Porch Doorbell (developer sandbox)',
          device_type: 'doorbell',
          firmware_version: 'sandbox-1.4.2',
          battery_life: 96,
          status: 'online'
        },
        relationships: {
          capabilities: { data: [{ type: 'capabilities', id: 'ring-dev-88213:video' }, { type: 'capabilities', id: 'ring-dev-88213:motion' }] },
          location: { data: { type: 'locations', id: 'loc-sandbox-01' } }
        }
      },
      {
        type: 'devices',
        id: 'ring-dev-88240',
        attributes: {
          name: 'Loading Dock Camera (developer sandbox)',
          device_type: 'camera',
          firmware_version: 'sandbox-1.4.2',
          battery_life: null,
          status: 'online'
        },
        relationships: {
          capabilities: { data: [{ type: 'capabilities', id: 'ring-dev-88240:video' }] },
          location: { data: { type: 'locations', id: 'loc-sandbox-02' } }
        }
      }
    ],
    included: [
      { type: 'capabilities', id: 'ring-dev-88213:video', attributes: { name: 'live_video', supported: true, transports: ['webrtc', 'whep'] } },
      { type: 'capabilities', id: 'ring-dev-88213:motion', attributes: { name: 'motion_detection', supported: true, webhook: true } },
      { type: 'capabilities', id: 'ring-dev-88240:video', attributes: { name: 'live_video', supported: true, transports: ['webrtc', 'whep'] } },
      { type: 'locations', id: 'loc-sandbox-01', attributes: { name: 'Sandbox location A', timezone: 'America/Los_Angeles' } },
      { type: 'locations', id: 'loc-sandbox-02', attributes: { name: 'Sandbox location B', timezone: 'America/Los_Angeles' } }
    ],
    meta: {
      source: 'ring_api_simulator',
      note: 'Simulated device inventory. These are not live Ring customer devices, and no Ring account is connected in this mode.',
      generated_at: new Date().toISOString()
    }
  };
}

function simulatedEvents() {
  const t = Date.now();
  return {
    data: [
      {
        type: 'events',
        id: 'evt-sim-4001',
        attributes: {
          event_type: 'motion',
          request_id: 'req-sim-4001',
          created_at: new Date(t - 120000).toISOString(),
          classification: { human: 0.94, animal: 0.02, vehicle: 0.01 },
          device_id: 'ring-dev-88213'
        }
      },
      {
        type: 'events',
        id: 'evt-sim-4002',
        attributes: {
          event_type: 'motion',
          request_id: 'req-sim-4002',
          created_at: new Date(t - 540000).toISOString(),
          classification: { human: 0.31, animal: 0.06, vehicle: 0.88 },
          device_id: 'ring-dev-88240'
        }
      },
      {
        type: 'events',
        id: 'evt-sim-4003',
        attributes: {
          event_type: 'device_added',
          request_id: 'req-sim-4003',
          created_at: new Date(t - 3600000).toISOString(),
          device_id: 'ring-dev-88240'
        }
      }
    ],
    meta: {
      source: 'ring_api_simulator',
      note: 'Simulated webhook payloads in the documented event shape. No Ring customer account or real recording is involved.',
      generated_at: new Date().toISOString()
    }
  };
}

function simulatedWhepSession(deviceId) {
  return {
    data: {
      type: 'streaming_sessions',
      id: 'whep-sim-' + Math.random().toString(36).slice(2, 8),
      attributes: {
        device_id: deviceId,
        transport: 'webrtc',
        protocol: 'whep',
        answer_sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=RingGuardianSimulatedSession\r\nt=0 0\r\na=inactive\r\n',
        expires_in: 300,
        audio: false
      }
    },
    meta: {
      source: 'ring_api_simulator',
      note: 'Simulated session descriptor. In live mode this call creates a real WHEP session and returns the negotiated SDP answer.',
      generated_at: new Date().toISOString()
    }
  };
}

// ---------------------------------------------------------------------- HMAC webhooks

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const creds = credentials();
    const live = Boolean(creds.clientId && creds.clientSecret && creds.refreshToken);
    const mode = live ? 'live' : 'simulated';

    // ---------------------------------------------------------------- webhook receiver
    // Ring posts motion / device events here. Anyone can reach this endpoint, so
    // authenticity is established before anything is recorded.
    if (payload.action === 'webhook') {
      const raw = JSON.stringify(payload.body || {});
      const signature =
        req.headers.get('x-ring-signature') ||
        req.headers.get('ring-signature') ||
        req.headers.get('x-amz-signature') ||
        '';
      const sharedSecret = payload.shared_secret || '';

      const hmacOk = await verifyHmac(creds.hmacKey, raw, signature);
      const secretOk = Boolean(creds.hmacKey) && sharedSecret === creds.hmacKey;

      if (!hmacOk && !secretOk) {
        return Response.json({ accepted: false, error: 'Webhook authenticity could not be verified.' }, { status: 401 });
      }

      const requestId = (payload.body && payload.body.request_id) || '';
      if (requestId) {
        const existing = await base44.asServiceRole.entities.ActivityLog.filter({ entity_ref: requestId }, { limit: 1 });
        const rows = Array.isArray(existing) ? existing : (existing && existing.items) || [];
        if (rows.length > 0) return Response.json({ accepted: true, deduplicated: true, request_id: requestId });
      }

      await recordActivity(base44, {
        demo_session_id: payload.demo_session_id || '',
        actor: 'ring_webhook',
        action: 'Ring event received',
        entity_type: 'RingEvent',
        entity_ref: requestId || 'unsigned-event',
        detail: 'Verified ' + (hmacOk ? 'HMAC signature' : 'shared secret') + '. Event recorded for demonstration only.',
        severity: 'info',
        category: 'ring'
      });

      return Response.json({ accepted: true, mode, request_id: requestId, stored: true });
    }

    const action = payload.action || 'status';

    if (action === 'status') {
      return Response.json({
        ok: true,
        mode,
        credentials_configured: live,
        endpoints: {
          token_url: TOKEN_URL,
          api_base: creds.apiBase,
          device_discovery: '/v1/devices?include=capabilities,location,status',
          live_video_session: '/v1/devices/{deviceId}/media/streaming/whep/sessions',
          webhook_events: ['motion', 'device_added', 'device_removed']
        },
        capabilities: ['device discovery (JSON:API)', 'device capabilities and status', 'live video via WebRTC / WHEP', 'HMAC-signed motion webhooks with request_id idempotency'],
        rate_limit_rps: 100,
        note: live
          ? 'Live mode. Calls are made against your Ring developer account.'
          : 'Simulated mode. No Ring developer credentials are configured, so documented response shapes are produced locally and labelled as simulated. Add RING_CLIENT_ID, RING_CLIENT_SECRET and RING_REFRESH_TOKEN to enable live calls.'
      });
    }

    if (action === 'devices') {
      if (!live) {
        return Response.json({ ok: true, mode: 'simulated', payload: simulatedDevices() });
      }
      const token = await exchangeRefreshToken(creds);
      const data = await ringGet(creds, '/v1/devices?include=capabilities,location,status', token.access_token);
      return Response.json({ ok: true, mode: 'live', payload: data, expires_in: token.expires_in });
    }

    if (action === 'events') {
      if (!live) {
        return Response.json({ ok: true, mode: 'simulated', payload: simulatedEvents() });
      }
      const token = await exchangeRefreshToken(creds);
      const deviceId = payload.device_id;
      if (!deviceId) return Response.json({ ok: false, error: 'A device id is required for live event history.' }, { status: 400 });
      const data = await ringGet(creds, '/v1/devices/' + encodeURIComponent(deviceId) + '/events', token.access_token);
      return Response.json({ ok: true, mode: 'live', payload: data });
    }

    if (action === 'whepSession') {
      const deviceId = payload.device_id || 'ring-dev-88213';
      if (!live) {
        return Response.json({ ok: true, mode: 'simulated', payload: simulatedWhepSession(deviceId) });
      }
      const token = await exchangeRefreshToken(creds);
      const res = await fetch(creds.apiBase + '/v1/devices/' + encodeURIComponent(deviceId) + '/media/streaming/whep/sessions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token.access_token,
          'Content-Type': 'application/sdp',
          Accept: 'application/sdp, application/json'
        },
        body: String(payload.offer_sdp || 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=RingGuardian\r\nt=0 0\r\na=recvonly\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n'),
        signal: AbortSignal.timeout(15000)
      });
      const text = await res.text();
      if (!res.ok) return Response.json({ ok: false, mode: 'live', error: 'Ring returned ' + res.status }, { status: 502 });
      return Response.json({ ok: true, mode: 'live', answer_sdp: text, audio: false });
    }

    return Response.json({ ok: false, error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}