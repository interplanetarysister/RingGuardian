// Ring Guardian Cam — Amazon Selling Partner API adapter.
//
// This is the Amazon-side integration surface: the same custody events the console
// records, exchanged with Amazon systems.
//
//   live      — Selling Partner API credentials are present. The function performs the
//               documented Login with Amazon (LWA) refresh-token exchange and retrieves
//               orders from the regional SP-API host using the caller's own credentials.
//
//   simulated — no credentials are present. Response shapes follow the documented SP-API
//               schema so the interface code is identical in both modes. Every simulated
//               payload is labelled and never presented as a live Amazon response.
//
// Documented endpoints used:
//   POST https://api.amazon.com/auth/o2/token              LWA refresh-token exchange
//   GET  {region host}/orders/v0/orders                    orders for a marketplace
//   webhook — order-change notifications, HMAC signed, NotificationId deduped
//
// Credentials are read from environment secrets and never returned to a caller.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { writeStore, recordActivity } from '../../shared/access.ts';
import { verifyHmac } from '../../shared/hmac.ts';

const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
const REGION_HOSTS = {
  na: 'https://sellingpartnerapi-na.amazon.com',
  eu: 'https://sellingpartnerapi-eu.amazon.com',
  fe: 'https://sellingpartnerapi-fe.amazon.com',
};
const DEFAULT_MARKETPLACE = 'ATVPDKIKX0DER';

function readSecret(name) {
  try {
    const value = secrets.get(name);
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  } catch (err) {
    return '';
  }
}

function credentials() {
  const region = (readSecret('AMAZON_REGION') || 'na').toLowerCase();
  return {
    clientId: readSecret('AMAZON_LWA_CLIENT_ID'),
    clientSecret: readSecret('AMAZON_LWA_CLIENT_SECRET'),
    refreshToken: readSecret('AMAZON_REFRESH_TOKEN'),
    hmacKey: readSecret('AMAZON_HMAC_KEY'),
    marketplaceId: readSecret('AMAZON_MARKETPLACE_ID') || DEFAULT_MARKETPLACE,
    region: REGION_HOSTS[region] ? region : 'na',
    host: REGION_HOSTS[region] || REGION_HOSTS.na,
  };
}

async function exchangeLwaToken(creds) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: creds.refreshToken,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  });
  const res = await fetch(LWA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(12000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (err) {
    json = null;
  }
  if (!res.ok) {
    throw new Error(
      'Amazon LWA token exchange failed with status ' + res.status + (json && json.error ? ' (' + json.error + ')' : '')
    );
  }
  return json || {};
}

async function spGet(creds, path, accessToken) {
  const res = await fetch(creds.host + path, {
    headers: {
      'x-amz-access-token': accessToken,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (err) {
    json = { raw: text.slice(0, 2000) };
  }
  if (!res.ok) throw new Error('Amazon SP-API ' + path + ' returned ' + res.status);
  return json;
}

// ------------------------------------------------------------------ simulated payloads
// Shapes follow the documented Selling Partner API orders response.

function simulatedOrders(creds) {
  const now = Date.now();
  const order = (id, minutesAgo, status, city, state, amount, channel) => ({
    AmazonOrderId: id,
    PurchaseDate: new Date(now - minutesAgo * 60000).toISOString(),
    LastUpdateDate: new Date(now - (minutesAgo - 30) * 60000).toISOString(),
    OrderStatus: status,
    FulfillmentChannel: channel,
    ShipServiceLevel: 'Std US Dom',
    MarketplaceId: creds.marketplaceId,
    OrderTotal: { CurrencyCode: 'USD', Amount: amount },
    ShippingAddress: { City: city, StateOrRegion: state, PostalCode: '98101', CountryCode: 'US' },
  });

  return {
    Orders: [
      order('112-4471930-7781042', 95, 'Shipped', 'Cedar Park', 'TX', '84.20', 'MFN'),
      order('112-9938201-4410277', 210, 'Shipped', 'Portland', 'OR', '212.00', 'AFN'),
      order('113-5561029-3388115', 45, 'Unshipped', 'Bend', 'OR', '39.95', 'MFN'),
    ],
    meta: {
      source: 'sp_api_simulator',
      marketplace_id: creds.marketplaceId,
      note: 'Simulated orders in the documented orders-response shape. No Amazon seller account is connected in this mode.',
      generated_at: new Date().toISOString(),
    },
  };
}

function sampleNotification() {
  const now = Date.now();
  return {
    NotificationVersion: '1.0',
    NotificationType: 'ORDER_CHANGE',
    PayloadVersion: '1.0',
    NotificationMetadata: {
      ApplicationId: 'amzn1.sp.solution.simulated',
      SubscriptionId: 'sim-sub-orders-01',
      PublishTime: new Date(now - 90000).toISOString(),
      NotificationId: 'sim-notify-' + Math.random().toString(36).slice(2, 10),
    },
    Payload: {
      AmazonOrderId: '112-4471930-7781042',
      MarketplaceId: 'ATVPDKIKX0DER',
      OrderChangeTrigger: {
        OrderChangeType: 'DeliveryDateUpdated',
        FulfillmentChannel: 'MFN',
      },
      Summary: {
        TrackingNumber: 'TBA304711885000',
        ShipmentStatus: 'DELIVERED',
      },
    },
    meta: {
      source: 'sp_api_simulator',
      note: 'Sample order-change notification envelope. SNS topic subscription is not configured in this mode.',
      generated_at: new Date().toISOString(),
    },
  };
}

function trackingRequest(creds, body) {
  return {
    method: 'POST',
    url: creds.host + '/mfn/v0/shipments/{shipmentId}',
    headers: {
      'x-amz-access-token': '<redacted — supplied at request time>',
      'content-type': 'application/json',
    },
    body: {
      TrackingNumber: body.tracking_number,
      FulfillmentStatus: body.fulfillment_status || 'DELIVERED',
      FacilityCode: body.facility || '',
      ScannerId: body.scanner_id || '',
      CapturedAt: body.captured_at || new Date().toISOString(),
      EvidenceReference: body.evidence_reference || '',
    },
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const creds = credentials();
    const live = Boolean(creds.clientId && creds.clientSecret && creds.refreshToken);
    const mode = live ? 'live' : 'simulated';

    // ---------------------------------------------------------------- notification receiver
    // Amazon notifications arrive here. The endpoint is publicly reachable, so authenticity
    // is established before anything is recorded.
    if (payload.action === 'webhook') {
      const raw = JSON.stringify(payload.body || {});
      const signature = req.headers.get('x-amz-sns-signature') || req.headers.get('x-amazon-signature') || '';
      const sharedSecret = payload.shared_secret || '';

      const hmacOk = await verifyHmac(creds.hmacKey, raw, signature);
      const secretOk = Boolean(creds.hmacKey) && sharedSecret === creds.hmacKey;

      if (!hmacOk && !secretOk) {
        return Response.json({ accepted: false, error: 'Notification authenticity could not be verified.' }, { status: 401 });
      }

      const meta = (payload.body && payload.body.NotificationMetadata) || {};
      const notificationId = meta.NotificationId || '';
      if (notificationId) {
        const existing = await base44.asServiceRole.entities.ActivityLog.filter({ entity_ref: notificationId }, { limit: 1 });
        const rows = Array.isArray(existing) ? existing : (existing && existing.items) || [];
        if (rows.length > 0) return Response.json({ accepted: true, deduplicated: true, notification_id: notificationId });
      }

      await recordActivity(base44, {
        demo_session_id: payload.demo_session_id || '',
        actor: 'amazon_notification',
        action: 'Amazon notification received',
        entity_type: 'AmazonNotification',
        entity_ref: notificationId || 'unsigned-notification',
        detail: 'Verified ' + (hmacOk ? 'HMAC signature' : 'shared secret') + '. Notification recorded for demonstration only.',
        severity: 'info',
        category: 'amazon',
      });

      return Response.json({ accepted: true, mode, notification_id: notificationId, stored: true });
    }

    const action = payload.action || 'status';

    if (action === 'status') {
      return Response.json({
        ok: true,
        mode,
        credentials_configured: live,
        endpoints: {
          lwa_token_url: LWA_TOKEN_URL,
          api_host: creds.host,
          marketplace_id: creds.marketplaceId,
          region: creds.region,
          orders: '/orders/v0/orders?MarketplaceIds={marketplaceId}&CreatedAfter={iso}',
          tracking_update: '/mfn/v0/shipments/{shipmentId}',
        },
        capabilities: [
          'Login with Amazon refresh-token exchange',
          'Order retrieval for a marketplace',
          'Tracking-update payload construction',
          'HMAC-signed order-change notifications with NotificationId idempotency',
        ],
        rate_limit_rps: 0.0166,
        note: live
          ? 'Live mode. Calls are made against your Selling Partner API credentials.'
          : 'Simulated mode. No Selling Partner API credentials are configured, so documented response shapes are produced locally and labelled as simulated. Add AMAZON_LWA_CLIENT_ID, AMAZON_LWA_CLIENT_SECRET and AMAZON_REFRESH_TOKEN to enable live calls.',
      });
    }

    if (action === 'orders') {
      if (!live) {
        return Response.json({ ok: true, mode: 'simulated', payload: simulatedOrders(creds) });
      }
      const token = await exchangeLwaToken(creds);
      const createdAfter = new Date(Date.now() - 7 * 86400000).toISOString();
      const path =
        '/orders/v0/orders?MarketplaceIds=' +
        encodeURIComponent(creds.marketplaceId) +
        '&CreatedAfter=' +
        encodeURIComponent(createdAfter) +
        '&MaxResults=20';
      const data = await spGet(creds, path, token.access_token);
      return Response.json({ ok: true, mode: 'live', payload: data, expires_in: token.expires_in });
    }

    if (action === 'trackingUpdate') {
      const trackingNumber = String(payload.tracking_number || '').trim();
      if (!/^[A-Za-z0-9-]{6,40}$/.test(trackingNumber)) {
        return Response.json({ ok: false, error: 'A valid tracking number is required.' }, { status: 400 });
      }
      return Response.json({
        ok: true,
        mode,
        dry_run: true,
        request: trackingRequest(creds, {
          tracking_number: trackingNumber,
          fulfillment_status: payload.fulfillment_status,
          facility: payload.facility,
          scanner_id: payload.scanner_id,
          captured_at: payload.captured_at,
          evidence_reference: payload.evidence_reference,
        }),
        note: 'Dry run. The adapter validates the update and shows the exact request it would send. Nothing is transmitted to Amazon.',
      });
    }

    if (action === 'notifications') {
      return Response.json({ ok: true, mode, payload: sampleNotification() });
    }

    return Response.json({ ok: false, error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}