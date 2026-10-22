// Ring Guardian Cam — demo session provisioning.
//
// Every visitor receives an isolated set of fictional package scenarios.
// Seeding is deterministic: the same session id always produces the same dataset.
// No AI, no external service and no paid resource is used to build the fixtures.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { FACILITIES, EMPLOYEES, CAMERAS, SCANNERS, VEHICLES, CLIPS, ACTIVITY_SEED, SOURCE_LABELS, ts, DAY1, DAY2, DAY3 } from '../../shared/fixtures.ts';
import { SCENARIOS, FOOTAGE_REQUEST_SEED } from '../../shared/scenarios.ts';
import { synchronizeEvent } from '../../shared/syncEngine.ts';
import { readStore, writeStore, listAll } from '../../shared/access.ts';

const ENTITIES = [
  'Shipment', 'ScanEvent', 'GuardianCamera', 'Scanner', 'Employee', 'Facility',
  'Vehicle', 'VideoClip', 'Investigation', 'FootageRequest', 'AiObservation', 'ActivityLog'
];

const CASE_NUMBERS = {
  delivered_but_missing: 'CASE-2026-0418',
  wrong_delivery_truck: 'CASE-2026-0419',
  stolen_after_delivery: 'CASE-2026-0420',
  missing_hub_scan: 'CASE-2026-0421'
};

const CASE_META = {
  delivered_but_missing: { opened_at: ts(DAY3, '08:20:00'), opened_by: 'Ellen Nakamura (EMP-5620)', assigned_to: 'Jordan Alvarez (EMP-6733)' },
  wrong_delivery_truck: { opened_at: ts(DAY2, '10:05:00'), opened_by: 'Ellen Nakamura (EMP-5620)', assigned_to: 'Jordan Alvarez (EMP-6733)' },
  stolen_after_delivery: { opened_at: ts(DAY2, '20:10:00'), opened_by: 'Ellen Nakamura (EMP-5620)', assigned_to: 'Ellen Nakamura (EMP-5620)' },
  missing_hub_scan: { opened_at: ts(DAY1, '14:25:00'), opened_by: 'Priya Raman (EMP-3311)', assigned_to: 'Jordan Alvarez (EMP-6733)' }
};

function validSession(id) {
  return typeof id === 'string' && id.length >= 6 && id.length <= 80 && /^[A-Za-z0-9_-]+$/.test(id);
}

async function clearSession(store, demoSessionId) {
  for (const name of ENTITIES) {
    try {
      await store[name].deleteMany({ demo_session_id: demoSessionId });
    } catch (err) {
      // An empty entity needs no clearing.
    }
  }
}

async function buildFixtures(store, demoSessionId) {
  const tag = demoSessionId;

  await store.Facility.bulkCreate(FACILITIES.map((f) => ({ ...f, demo_session_id: tag })));
  await store.Employee.bulkCreate(EMPLOYEES.map((e) => ({ ...e, demo_session_id: tag })));
  await store.GuardianCamera.bulkCreate(CAMERAS.map((c) => ({ ...c, demo_session_id: tag })));
  await store.Scanner.bulkCreate(SCANNERS.map((s) => ({ ...s, demo_session_id: tag })));
  await store.Vehicle.bulkCreate(VEHICLES.map((v) => ({ ...v, demo_session_id: tag })));

  await store.VideoClip.bulkCreate(
    CLIPS.map((c, i) => ({
      ...c,
      demo_session_id: tag,
      duration_seconds: 14,
      source_label: SOURCE_LABELS.scene,
      device_attribution: c.camera_id === 'CAM-9901' ? 'Ring developer sandbox device (simulated event payload)' : c.camera_id,
      evidence_kind: 'scene_reconstruction',
      generated_sample: true,
      uploaded: false,
      hue: (i * 37) % 360
    }))
  );

  const shipments = [];
  const events = [];
  const investigations = [];

  for (const scenario of SCENARIOS) {
    shipments.push({
      ...scenario.shipment,
      demo_session_id: tag,
      scenario_key: scenario.scenario_key,
      scenario_title: scenario.scenario_title
    });

    for (const ev of scenario.events) {
      const sync = synchronizeEvent(ev, CLIPS, SCANNERS, CAMERAS);
      events.push({
        ...ev,
        demo_session_id: tag,
        scenario_key: scenario.scenario_key,
        tracking_number: scenario.shipment.tracking_number,
        sync_status: sync.sync_status,
        sync_note: sync.sync_note,
        video_clip_key: sync.video_clip_key,
        playback_position_seconds: sync.playback_position_seconds,
        evidence_source: sync.evidence_source,
        case_number: scenario.case ? CASE_NUMBERS[scenario.scenario_key] : ''
      });
    }

    if (scenario.case) {
      investigations.push({
        ...scenario.case,
        demo_session_id: tag,
        case_number: CASE_NUMBERS[scenario.scenario_key],
        tracking_number: scenario.shipment.tracking_number,
        scenario_key: scenario.scenario_key,
        ...CASE_META[scenario.scenario_key],
        resolved_at: '',
        resolution: '',
        physical_verification_requested: false
      });
    }
  }

  await store.Shipment.bulkCreate(shipments);
  await store.ScanEvent.bulkCreate(events);
  await store.Investigation.bulkCreate(investigations);

  await store.FootageRequest.bulkCreate(
    FOOTAGE_REQUEST_SEED.map((r) => ({ ...r, demo_session_id: tag }))
  );

  await store.ActivityLog.bulkCreate(
    ACTIVITY_SEED.map((a) => ({
      demo_session_id: tag,
      actor: a.actor,
      action: a.action,
      entity_type: a.entity_type,
      entity_ref: a.entity_ref,
      detail: a.detail,
      occurred_at: a.at,
      severity: a.severity,
      category: a.category
    }))
  );

  return {
    shipments: shipments.length,
    scan_events: events.length,
    investigations: investigations.length,
    clips: CLIPS.length,
    cameras: CAMERAS.length,
    scanners: SCANNERS.length
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const configRows = await base44.asServiceRole.entities.AppSetting.filter({key:'global-mode'});
    const cfg = (Array.isArray(configRows) ? configRows : configRows?.items || [])[0];
    if (cfg?.mode === 'live') return Response.json({ok:false,error:'Simulation is disabled by the administrator.'},{status:403});
    const demoSessionId = payload.demo_session_id;
    const action = payload.action === 'reset' ? 'reset' : 'seed';

    if (!validSession(demoSessionId)) {
      return Response.json({ ok: false, error: 'A valid demo session identifier is required.' }, { status: 400 });
    }

    const store = writeStore(base44);
    const reader = readStore(base44);

    const existing = await reader.run((s) => listAll(s, 'Shipment', { demo_session_id: demoSessionId }, null, 100));

    if (action === 'reset') {
      await clearSession(store, demoSessionId);
      const counts = await buildFixtures(store, demoSessionId);
      return Response.json({ ok: true, action: 'reset', seeded: true, counts });
    }

    if (existing.length > 0) {
      // Evolve an existing session without deleting its reports, evidence or decisions.
      // New sample scenarios appear even for returning visitors.
      const present = new Set(existing.map(x => x.scenario_key));
      const added = [];
      for (const scenario of SCENARIOS) {
        if (present.has(scenario.scenario_key)) continue;
        const shipment = {
          ...scenario.shipment,
          demo_session_id: demoSessionId,
          scenario_key: scenario.scenario_key,
          scenario_title: scenario.scenario_title
        };
        const duplicate = await reader.run((r) => listAll(r, 'Shipment', {
          demo_session_id: demoSessionId, tracking_number: shipment.tracking_number
        }, null, 1));
        if (duplicate.length) continue;
        await store.Shipment.create(shipment);
        for (const ev of scenario.events) {
          const sync = synchronizeEvent(ev, CLIPS, SCANNERS, CAMERAS);
          await store.ScanEvent.create({
            ...ev,
            demo_session_id: demoSessionId,
            scenario_key: scenario.scenario_key,
            tracking_number: shipment.tracking_number,
            sync_status: sync.sync_status,
            sync_note: sync.sync_note,
            video_clip_key: sync.video_clip_key,
            playback_position_seconds: sync.playback_position_seconds,
            evidence_source: sync.evidence_source,
            case_number: ''
          });
        }
        added.push(scenario.scenario_key);
      }
      return Response.json({ ok: true, action:'seed', seeded: added.length > 0, existing:true, added_scenarios:added, shipment_count:existing.length+added.length });
    }

    const counts = await buildFixtures(store, demoSessionId);
    return Response.json({ ok: true, action: 'seed', seeded: true, counts });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}