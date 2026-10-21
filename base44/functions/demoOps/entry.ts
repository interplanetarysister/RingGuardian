// Ring Guardian Cam — interactive demonstration operations.
//
// Every control a judge can press lands here. Each action performs a real write to the
// fictional demo dataset and returns the resulting records, so the interface can show
// the consequence rather than a decorative acknowledgement.
//
// Nothing in this function touches real logistics data, real employees or real cameras.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { synchronizeEvent, SYNC_STATUS } from '../../shared/syncEngine.ts';
import { readStore, writeStore, recordActivity, listAll, badRequest, nowIso } from '../../shared/access.ts';

import { LIVE_SCENARIOS, evidenceReport } from '../../shared/liveScenarios.ts';

const SCENES = {
  conveyor: 'Inbound induction line',
  sortline: 'On the sortation lane',
  dock: 'Trailer loading at the dock',
  dock_misroute: 'Load position check at the dock',
  trailer: 'Recovery inside a parked trailer',
  porch: 'Courier approach at the delivery address',
  porch_theft: 'Front porch after delivery',
  pallet: 'Staged pallet overhead view',
  pallet_scan: 'Pallet pick and scan',
  live_handling: 'Live handling capture (demo test scan)'
};

function validSession(id) {
  return typeof id === 'string' && id.length >= 6 && id.length <= 80 && /^[A-Za-z0-9_-]+$/.test(id);
}

// A judge-triggered scan happens now, so it needs media that covers now. The engine is
// unchanged — we simply give it a capture window that contains the event, exactly as a
// live Guardian capture would.
async function createLiveCapture(store, demoSessionId, cameraId, facility, scene, label) {
  const startMs = Date.now() - 9000;
  const clipKey = 'CLIP-LIVE-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const clip = await store.VideoClip.create({
    demo_session_id: demoSessionId,
    clip_key: clipKey,
    title: label || SCENES[scene] || 'Live capture',
    scene: scene || 'live_handling',
    camera_id: cameraId,
    facility,
    source_label: 'Generated scene reconstruction — not device footage',
    device_attribution: cameraId,
    evidence_kind: 'scene_reconstruction',
    recorded_start: new Date(startMs).toISOString(),
    recorded_end: new Date(startMs + 14000).toISOString(),
    duration_seconds: 14,
    description: 'Capture window created for a scan performed inside the demonstration.',
    generated_sample: true,
    uploaded: false,
    hue: 198
  });
  return clip;
}

async function loadContext(base44, demoSessionId) {
  const reader = readStore(base44);
  const [shipments, events, clips, scanners, cameras, cases] = await Promise.all([
    reader.run((s) => listAll(s, 'Shipment', { demo_session_id: demoSessionId }, null, 100)),
    reader.run((s) => listAll(s, 'ScanEvent', { demo_session_id: demoSessionId }, '-occurred_at', 400)),
    reader.run((s) => listAll(s, 'VideoClip', { demo_session_id: demoSessionId }, null, 200)),
    reader.run((s) => listAll(s, 'Scanner', { demo_session_id: demoSessionId }, null, 100)),
    reader.run((s) => listAll(s, 'GuardianCamera', { demo_session_id: demoSessionId }, null, 100)),
    reader.run((s) => listAll(s, 'Investigation', { demo_session_id: demoSessionId }, null, 100))
  ]);
  return { shipments, events, clips, scanners, cameras, cases };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const demoSessionId = payload.demo_session_id;
    const action = payload.action;

    if (!validSession(demoSessionId)) return badRequest('A valid demo session identifier is required.');
    if (typeof action !== 'string' || !action) return badRequest('An action is required.');

    const store = writeStore(base44);
    const ctx = await loadContext(base44, demoSessionId);
    const findEvent = (id) => ctx.events.find((e) => e.id === id);
    const findShipment = (tn) => ctx.shipments.find((s) => s.tracking_number === tn);

    if (action === 'saveLiveScenario') {
      const scenario = LIVE_SCENARIOS.find(s => s.key === payload.scenario_key);
      if (!scenario) return badRequest('Unknown live scenario.');
      if (typeof payload.run_id !== 'string' || !/^[a-f0-9-]{36}$/i.test(payload.run_id)) return badRequest('A valid run identifier is required.');
      const started = Date.parse(payload.started_at);
      if (!Number.isFinite(started) || started > Date.now() || started < Date.now() - 86400000) return badRequest('Start or replay this event before saving it.');
      if (Date.now() < started + scenario.duration * 1000 - 500 && payload.completed !== true) return badRequest('Wait for the simulated event to finish.');
      const shipment = findShipment(scenario.tracking);
      if (!shipment) return badRequest('The demo package is missing. Reset the demo and try again.');
      const clipKey = 'LIVE-' + payload.run_id;
      let clip = ctx.clips.find(c => c.clip_key === clipKey);
      if (!clip) clip = await store.VideoClip.create({
        demo_session_id: demoSessionId, clip_key: clipKey, title: scenario.title,
        scenario_key: scenario.key, scene: scenario.scene, evidence_kind: 'scene_reconstruction',
        source_label: 'Simulated live event — scripted scene, not Ring footage',
        camera_id: scenario.scene.startsWith('porch') ? 'SIM-PORCH-01' : 'SIM-VEST-01',
        facility: shipment.current_facility, recorded_start: payload.started_at,
        recorded_end: new Date(started + scenario.duration * 1000).toISOString(),
        duration_seconds: scenario.duration, generated_sample: true, uploaded: false,
        description: scenario.finding
      });
      let event = ctx.events.find(e => e.video_clip_key === clipKey);
      if (!event) event = await store.ScanEvent.create({
        demo_session_id: demoSessionId, tracking_number: scenario.tracking, scenario_key: scenario.key,
        sequence: 1000, event_type: 'handling', event_label: 'Simulated live event: ' + scenario.title,
        occurred_at: new Date(started + 8000).toISOString(), scanner_id: 'SIM-SCANNER-01',
        camera_id: clip.camera_id, employee_id: 'SIM-WORKER-01', facility: shipment.current_facility,
        scan_status: scenario.key === 'missing_scan' ? 'failed' : 'confirmed',
        sync_status: scenario.key === 'missing_scan' ? 'pending' : 'matched',
        sync_note: 'Explicit association within one synthetic simulation run; not a verified Ring recording.',
        video_clip_key: clipKey, playback_position_seconds: 8,
        evidence_source: 'Local synthetic simulation', note: scenario.finding
      });
      let caseRecord = ctx.cases.find(c => c.tracking_number === scenario.tracking);
      const report = evidenceReport(scenario,{id:payload.run_id,started_at:payload.started_at});
      if (scenario.issue) {
        const patch = {status:'investigating',findings:scenario.finding,evidence_summary:JSON.stringify(report),
          recommended_actions:['Review the matching simulated interval','Verify the physical parcel location and truck assignment','Keep the evidence bundle with the report','Use official carrier support for real shipment issues']};
        if (caseRecord) {
          await store.Investigation.update(caseRecord.id,patch);
        } else caseRecord = await store.Investigation.create({...patch,demo_session_id:demoSessionId,
          case_number:'CASE-LIVE-'+payload.run_id.slice(0,8).toUpperCase(),tracking_number:scenario.tracking,
          scenario_key:scenario.key,title:scenario.title,priority:'medium',opened_at:nowIso(),opened_by:'demo_operator',summary:scenario.finding});
      }
      await store.Shipment.update(shipment.id,{status:scenario.status,discrepancy_flag:scenario.issue,
        discrepancy_reason:scenario.issue?scenario.finding:'',investigation_status:scenario.issue?'investigating':'none'});
      const verified = await store.ScanEvent.get(event.id);
      const savedClip = await store.VideoClip.get(clip.id);
      if (verified.video_clip_key !== clipKey || savedClip.recorded_start !== payload.started_at) throw new Error('Saved evidence did not pass read-back verification.');
      await recordActivity(base44,{demo_session_id:demoSessionId,actor:'live_simulator',action:'Live simulation evidence saved and verified',
        entity_type:'Shipment',entity_ref:scenario.tracking,detail:scenario.title+' · '+clipKey,severity:scenario.issue?'notice':'info',category:'evidence'});
      return Response.json({ok:true,verified:true,tracking_number:scenario.tracking,event_id:event.id,
        clip_key:clipKey,case_number:caseRecord?.case_number||'',report});
    }

    // ---------------------------------------------------------------- scanner controls

    if (action === 'testScan') {
      const scanner = ctx.scanners.find((s) => s.device_id === payload.scanner_id);
      if (!scanner) return badRequest('Unknown scanner.');

      if (scanner.connection_status !== 'connected') {
        return Response.json({
          ok: false,
          outcome: 'no_session',
          error: 'Scanner ' + scanner.device_id + ' is ' + scanner.connection_status + '. Connect it before running a test scan.'
        });
      }
      if (!scanner.paired_camera_id) {
        return Response.json({
          ok: false,
          outcome: 'unpaired',
          error: 'Scanner ' + scanner.device_id + ' has no paired Guardian camera, so a scan cannot be attributed to a recording. Pair a camera first.'
        });
      }

      const tracking = payload.tracking_number || (ctx.shipments[0] && ctx.shipments[0].tracking_number) || '';
      const shipment = findShipment(tracking);
      const clip = await createLiveCapture(store, demoSessionId, scanner.paired_camera_id, scanner.facility, 'live_handling', 'Test scan capture — ' + scanner.device_id);

      const candidate = {
        tracking_number: tracking,
        scenario_key: shipment ? shipment.scenario_key : 'successful_delivery',
        sequence: 900 + Math.floor(Math.random() * 90),
        event_type: 'handling',
        event_label: 'Simulated test scan — ' + scanner.device_id,
        occurred_at: new Date(Date.now() - 4000).toISOString(),
        scanner_id: scanner.device_id,
        camera_id: scanner.paired_camera_id,
        employee_id: scanner.assigned_employee_id,
        facility: scanner.facility,
        vehicle: '',
        scan_status: 'confirmed',
        note: 'Generated by the Test Scan control. No real package was handled.'
      };

      const sync = synchronizeEvent(candidate, [clip, ...ctx.clips], ctx.scanners, ctx.cameras);
      const event = await store.ScanEvent.create({
        ...candidate,
        demo_session_id: demoSessionId,
        sync_status: sync.sync_status,
        sync_note: sync.sync_note,
        video_clip_key: sync.video_clip_key,
        playback_position_seconds: sync.playback_position_seconds,
        evidence_source: sync.evidence_source
      });

      await store.Scanner.update(scanner.id, { last_scan_at: candidate.occurred_at, session_status: 'active' });
      await recordActivity(base44, {
        demo_session_id: demoSessionId,
        actor: 'scanner_simulator',
        action: 'Test scan generated',
        entity_type: 'ScanEvent',
        entity_ref: tracking,
        detail: 'Scanner ' + scanner.device_id + ' produced a confirmed synthetic scan event and ' + sync.sync_status + ' a recording.',
        severity: 'info',
        category: 'scan'
      });

      return Response.json({ ok: true, outcome: 'scan_recorded', event, sync, clip });
    }

    if (action === 'scanFault') {
      const fault = payload.fault;
      const scanner = ctx.scanners.find((s) => s.device_id === payload.scanner_id);
      if (!scanner) return badRequest('Unknown scanner.');
      const tracking = payload.tracking_number || (ctx.shipments[0] && ctx.shipments[0].tracking_number) || '';
      const at = nowIso();

      if (fault === 'decode_failure') {
        const event = await store.ScanEvent.create({
          demo_session_id: demoSessionId,
          tracking_number: tracking,
          scenario_key: '',
          sequence: 950,
          event_type: 'exception',
          event_label: 'Scan attempt failed — no label decoded',
          occurred_at: at,
          scanner_id: scanner.device_id,
          camera_id: scanner.paired_camera_id || '',
          employee_id: scanner.assigned_employee_id,
          facility: scanner.facility,
          vehicle: '',
          scan_status: 'failed',
          sync_status: SYNC_STATUS.PENDING,
          sync_note: 'No package identity was read, so no recording association was attempted. Retry the scan or key the identifier manually.',
          evidence_source: 'Not applicable — no package identified',
          note: 'Simulated decode failure. The camera recorded the attempt, but a failed read establishes no package.'
        });
        await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'scanner_simulator', action: 'Scan failure simulated', entity_type: 'ScanEvent', entity_ref: scanner.device_id, detail: 'Decode failure — no label read.', severity: 'warning', category: 'scan' });
        return Response.json({ ok: true, outcome: 'decode_failure', event });
      }

      if (fault === 'connection_drop') {
        await store.Scanner.update(scanner.id, {
          connection_status: 'disconnected',
          session_status: 'ended',
          diagnostic_note: 'Connection dropped during the work session. Store-and-forward queue is holding unsent events.'
        });
        const event = await store.ScanEvent.create({
          demo_session_id: demoSessionId,
          tracking_number: tracking,
          scenario_key: '',
          sequence: 951,
          event_type: 'handling',
          event_label: 'Scan buffered — device offline',
          occurred_at: at,
          scanner_id: scanner.device_id,
          camera_id: scanner.paired_camera_id || '',
          employee_id: scanner.assigned_employee_id,
          facility: scanner.facility,
          vehicle: '',
          scan_status: 'delayed',
          sync_status: SYNC_STATUS.DELAYED,
          sync_note: 'The device was offline when the event was produced. The association is queued and completes when the device reconciles its session log.',
          evidence_source: 'Queued — device reconciliation pending',
          note: 'Simulated connection drop.'
        });
        await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'scanner_simulator', action: 'Connection drop simulated', entity_type: 'Scanner', entity_ref: scanner.device_id, detail: 'Device reported disconnected; events are buffered.', severity: 'warning', category: 'device' });
        return Response.json({ ok: true, outcome: 'connection_drop', event });
      }

      if (fault === 'wrong_scanner') {
        await store.Scanner.update(scanner.id, {
          assigned_employee_id: '',
          paired_camera_id: '',
          assignment_mismatch: true,
          connection_status: 'error',
          diagnostic_note: 'Not bound to any work session. Pair a camera and assign an employee before scanning.'
        });
        await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'scanner_simulator', action: 'Scanner unassigned', entity_type: 'Scanner', entity_ref: scanner.device_id, detail: 'Scanner detached from its work session and camera pairing.', severity: 'critical', category: 'device' });
        return Response.json({ ok: true, outcome: 'wrong_scanner' });
      }

      if (fault === 'unavailable_footage') {
        const event = await store.ScanEvent.create({
          demo_session_id: demoSessionId,
          tracking_number: tracking,
          scenario_key: '',
          sequence: 952,
          event_type: 'handling',
          event_label: 'Scan with no available capture',
          occurred_at: at,
          scanner_id: scanner.device_id,
          camera_id: scanner.paired_camera_id || 'CAM-2203',
          employee_id: scanner.assigned_employee_id,
          facility: scanner.facility,
          vehicle: '',
          scan_status: 'confirmed',
          sync_status: SYNC_STATUS.MISSING,
          sync_note: 'No recording covers this timestamp on ' + (scanner.paired_camera_id || 'CAM-2203') + '. The scan is valid; the media is not available.',
          evidence_source: 'No capture available',
          note: 'Simulated media gap — the scan is trustworthy, the evidence is not present.'
        });
        await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'scanner_simulator', action: 'Media gap simulated', entity_type: 'ScanEvent', entity_ref: tracking, detail: 'Confirmed scan with no matching capture window.', severity: 'warning', category: 'sync' });
        return Response.json({ ok: true, outcome: 'unavailable_footage', event });
      }

      return badRequest('Unknown fault.');
    }

    if (action === 'scannerControl') {
      const scanner = ctx.scanners.find((s) => s.device_id === payload.scanner_id);
      if (!scanner) return badRequest('Unknown scanner.');
      const control = payload.control;

      if (control === 'connect') {
        await store.Scanner.update(scanner.id, { connection_status: 'connected', session_status: 'active', diagnostic_note: 'Link established. Session log synchronized.' });
        await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'demo_operator', action: 'Scanner connected', entity_type: 'Scanner', entity_ref: scanner.device_id, detail: 'Work session started.', severity: 'info', category: 'device' });
        return Response.json({ ok: true, outcome: 'connected' });
      }
      if (control === 'disconnect') {
        await store.Scanner.update(scanner.id, { connection_status: 'disconnected', session_status: 'ended', diagnostic_note: 'Work session closed by operator.' });
        await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'demo_operator', action: 'Scanner disconnected', entity_type: 'Scanner', entity_ref: scanner.device_id, detail: 'Work session closed.', severity: 'info', category: 'device' });
        return Response.json({ ok: true, outcome: 'disconnected' });
      }
      if (control === 'check') {
        const paired = ctx.cameras.find((c) => c.device_id === scanner.paired_camera_id);
        return Response.json({
          ok: true,
          outcome: 'diagnostics',
          diagnostics: {
            scanner_id: scanner.device_id,
            link: scanner.connection_status,
            transport: scanner.connection_type,
            battery_pct: scanner.battery_pct,
            session: scanner.session_status,
            paired_camera: scanner.paired_camera_id || 'none',
            camera_state: paired ? paired.status : 'no camera paired',
            camera_battery_pct: paired ? paired.battery_pct : null,
            camera_firmware: paired ? paired.firmware : null,
            last_scan_at: scanner.last_scan_at,
            assessment: scanner.assignment_mismatch
              ? 'Not usable: the scanner is not bound to a work session.'
              : scanner.connection_status === 'connected'
                ? 'Healthy. Scans will be attributed to ' + (scanner.paired_camera_id || 'no camera') + '.'
                : 'Degraded: scans will be queued until the link is restored.'
          }
        });
      }
      if (control === 'pair') {
        const camera = ctx.cameras.find((c) => c.device_id === payload.camera_id);
        if (!camera) return badRequest('Unknown camera.');
        if (camera.status === 'unassigned' && !camera.assigned_employee_id) {
          return Response.json({ ok: false, outcome: 'pair_rejected', error: camera.device_id + ' is not assigned to an employee, so it cannot be paired to a work session.' });
        }
        await store.Scanner.update(scanner.id, { paired_camera_id: camera.device_id, assignment_mismatch: false, diagnostic_note: 'Paired to ' + camera.device_id + '.' });
        await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'demo_operator', action: 'Camera paired', entity_type: 'Scanner', entity_ref: scanner.device_id, detail: 'Paired to ' + camera.device_id + '.', severity: 'info', category: 'device' });
        return Response.json({ ok: true, outcome: 'paired', camera_id: camera.device_id });
      }
      return badRequest('Unknown scanner control.');
    }

    // ------------------------------------------------------------ synchronization engine

    if (action === 'runSync') {
      const event = findEvent(payload.event_id);
      if (!event) return badRequest('Unknown scan event.');
      const sync = synchronizeEvent(event, ctx.clips, ctx.scanners, ctx.cameras);
      await store.ScanEvent.update(event.id, {
        sync_status: sync.sync_status,
        sync_note: sync.sync_note,
        video_clip_key: sync.video_clip_key,
        playback_position_seconds: sync.playback_position_seconds,
        evidence_source: sync.evidence_source
      });
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'sync_engine', action: 'Synchronization re-evaluated', entity_type: 'ScanEvent', entity_ref: event.tracking_number, detail: 'Result: ' + sync.sync_status + '. ' + sync.sync_note, severity: sync.sync_status === 'matched' ? 'info' : 'warning', category: 'sync' });
      return Response.json({ ok: true, outcome: 'sync', sync, rejected: sync.rejected });
    }

    if (action === 'rejectMatch') {
      const event = findEvent(payload.event_id);
      if (!event) return badRequest('Unknown scan event.');
      await store.ScanEvent.update(event.id, {
        sync_status: SYNC_STATUS.REJECTED,
        sync_note: 'Investigator rejected the proposed match. ' + (payload.reason || 'The recording does not show the package identified by this scan.'),
        video_clip_key: ''
      });
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: payload.actor || 'Jordan Alvarez (EMP-6733)', action: 'Proposed match rejected', entity_type: 'ScanEvent', entity_ref: event.tracking_number, detail: payload.reason || 'Recording does not show the scanned package.', severity: 'warning', category: 'sync' });
      return Response.json({ ok: true, outcome: 'rejected' });
    }

    // ------------------------------------------------------------------ case workflows

    if (action === 'flagDiscrepancy') {
      const shipment = findShipment(payload.tracking_number);
      if (!shipment) return badRequest('Unknown tracking number.');
      const reason = payload.reason || 'Investigator flagged a discrepancy between the logistics record and the available evidence.';
      await store.Shipment.update(shipment.id, { discrepancy_flag: true, discrepancy_reason: reason });

      let caseNumber = '';
      const existingCase = ctx.cases.find((c) => c.tracking_number === shipment.tracking_number);
      if (existingCase) {
        caseNumber = existingCase.case_number;
        await store.Shipment.update(shipment.id, { investigation_status: existingCase.status === 'resolved' || existingCase.status === 'closed' ? existingCase.status : 'investigating' });
      } else {
        const nextNumber = 'CASE-2026-' + String(420 + ctx.cases.length + 1).padStart(4, '0');
        const created = await store.Investigation.create({
          demo_session_id: demoSessionId,
          case_number: nextNumber,
          tracking_number: shipment.tracking_number,
          scenario_key: shipment.scenario_key,
          title: 'Discrepancy flagged on ' + shipment.tracking_number,
          category: payload.category || 'Flagged discrepancy',
          priority: payload.priority || 'medium',
          status: 'open',
          opened_at: nowIso(),
          opened_by: payload.actor || 'demo_operator',
          assigned_to: 'Jordan Alvarez (EMP-6733)',
          summary: reason,
          findings: '',
          recommended_actions: [
            'Review the scan timeline for this package',
            'Request physical verification at the last known location',
            'Record the outcome without asserting cause'
          ],
          resolution: '',
          resolved_at: '',
          evidence_summary: 'Under review.',
          physical_verification_requested: false
        });
        caseNumber = nextNumber;
        await store.Shipment.update(shipment.id, { investigation_status: 'open' });
        await recordActivity(base44, { demo_session_id: demoSessionId, actor: payload.actor || 'demo_operator', action: 'Investigation opened', entity_type: 'Investigation', entity_ref: nextNumber, detail: reason, severity: 'notice', category: 'case' });
        return Response.json({ ok: true, outcome: 'case_opened', case_number: caseNumber, investigation: created });
      }

      await recordActivity(base44, { demo_session_id: demoSessionId, actor: payload.actor || 'demo_operator', action: 'Discrepancy flagged', entity_type: 'Shipment', entity_ref: shipment.tracking_number, detail: reason, severity: 'notice', category: 'case' });
      return Response.json({ ok: true, outcome: 'flagged', case_number: caseNumber });
    }

    if (action === 'requestVerification') {
      const found = ctx.cases.find((c) => c.case_number === payload.case_number);
      if (!found) return badRequest('Unknown case.');
      await store.Investigation.update(found.id, {
        physical_verification_requested: true,
        status: 'investigating',
        recommended_actions: [
          'Physical verification requested for ' + found.tracking_number,
          ...(Array.isArray(found.recommended_actions) ? found.recommended_actions : [])
        ]
      });
      const shipment = findShipment(found.tracking_number);
      if (shipment) await store.Shipment.update(shipment.id, { investigation_status: 'investigating' });
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: payload.actor || 'Jordan Alvarez (EMP-6733)', action: 'Physical verification requested', entity_type: 'Investigation', entity_ref: found.case_number, detail: 'A warehouse associate will be asked to locate and re-scan the parcel.', severity: 'notice', category: 'case' });
      return Response.json({ ok: true, outcome: 'verification_requested' });
    }

    if (action === 'updateCase') {
      const found = ctx.cases.find((c) => c.case_number === payload.case_number);
      if (!found) return badRequest('Unknown case.');
      const patch = {};
      if (typeof payload.findings === 'string') patch.findings = payload.findings;
      if (typeof payload.resolution === 'string') patch.resolution = payload.resolution;
      if (typeof payload.status === 'string') patch.status = payload.status;
      if (Object.keys(patch).length === 0) return badRequest('Nothing to update.');
      await store.Investigation.update(found.id, patch);
      const shipment = findShipment(found.tracking_number);
      if (shipment && patch.status) await store.Shipment.update(shipment.id, { investigation_status: patch.status });
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: payload.actor || 'Jordan Alvarez (EMP-6733)', action: 'Case updated', entity_type: 'Investigation', entity_ref: found.case_number, detail: patch.status ? 'Status set to ' + patch.status + '.' : 'Case record amended.', severity: 'info', category: 'case' });
      return Response.json({ ok: true, outcome: 'case_updated' });
    }

    if (action === 'resolveCase') {
      const found = ctx.cases.find((c) => c.case_number === payload.case_number);
      if (!found) return badRequest('Unknown case.');
      const resolution = payload.resolution || 'Resolved after review of the recorded evidence and the corrected logistics record.';
      await store.Investigation.update(found.id, { status: 'resolved', resolution, resolved_at: nowIso() });
      const shipment = findShipment(found.tracking_number);
      if (shipment) await store.Shipment.update(shipment.id, { investigation_status: 'resolved' });
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: payload.actor || 'Jordan Alvarez (EMP-6733)', action: 'Investigation resolved', entity_type: 'Investigation', entity_ref: found.case_number, detail: resolution, severity: 'info', category: 'case' });
      return Response.json({ ok: true, outcome: 'case_resolved', resolution });
    }

    if (action === 'closeCase') {
      const found = ctx.cases.find((c) => c.case_number === payload.case_number);
      if (!found) return badRequest('Unknown case.');
      await store.Investigation.update(found.id, { status: 'closed' });
      const shipment = findShipment(found.tracking_number);
      if (shipment) await store.Shipment.update(shipment.id, { investigation_status: 'closed' });
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: payload.actor || 'Jordan Alvarez (EMP-6733)', action: 'Investigation closed', entity_type: 'Investigation', entity_ref: found.case_number, detail: 'Case closed and archived.', severity: 'info', category: 'case' });
      return Response.json({ ok: true, outcome: 'case_closed' });
    }

    // ------------------------------------------------------------------ recovery flows

    if (action === 'correctiveRecovery') {
      const shipment = findShipment(payload.tracking_number);
      if (!shipment) return badRequest('Unknown tracking number.');
      const clip = await createLiveCapture(store, demoSessionId, 'CAM-2201', 'SEA3', 'trailer', 'Corrective recovery scan');
      const candidate = {
        tracking_number: shipment.tracking_number,
        scenario_key: shipment.scenario_key,
        sequence: 700,
        event_type: 'corrective',
        event_label: 'Corrective scan — parcel located and re-scanned',
        occurred_at: new Date(Date.now() - 4000).toISOString(),
        scanner_id: 'SC-4471',
        camera_id: 'CAM-2201',
        employee_id: 'EMP-1042',
        facility: 'SEA3',
        vehicle: '',
        scan_status: 'confirmed',
        note: 'Parcel located on a hand cart beside trailer TRL-3388 and re-scanned into the correct route.'
      };
      const sync = synchronizeEvent(candidate, [clip, ...ctx.clips], ctx.scanners, ctx.cameras);
      const event = await store.ScanEvent.create({
        ...candidate,
        demo_session_id: demoSessionId,
        sync_status: sync.sync_status,
        sync_note: sync.sync_note,
        video_clip_key: sync.video_clip_key,
        playback_position_seconds: sync.playback_position_seconds,
        evidence_source: sync.evidence_source
      });

      const openCase = ctx.cases.find((c) => c.tracking_number === shipment.tracking_number);

      await store.Shipment.update(shipment.id, {
        status: 'recovered',
        current_facility: 'SEA3',
        last_known_location: 'Recovered at dock 2, Puget Sound Fulfillment Center',
        last_verified_scan_at: candidate.occurred_at,
        investigation_status: openCase ? 'resolved' : shipment.investigation_status,
        discrepancy_reason: 'Misroute corrected. The parcel was located beside trailer TRL-3388, re-scanned into the correct route and the logistics record updated.'
      });

      let caseNumber = '';
      if (openCase) {
        caseNumber = openCase.case_number;
        await store.Investigation.update(openCase.id, {
          status: 'resolved',
          resolved_at: nowIso(),
          resolution: 'Parcel located beside trailer TRL-3388, re-scanned into the correct route and the logistics record reconciled. No further action required.',
          evidence_summary: 'Available — loading capture and recovery capture both matched to their timestamps.'
        });
      }
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'Dana Whitfield (EMP-1042)', action: 'Package recovered and re-scanned', entity_type: 'Shipment', entity_ref: shipment.tracking_number, detail: 'Logistics record updated to the recovered location.', severity: 'info', category: 'recovery' });
      return Response.json({ ok: true, outcome: 'recovered', event, sync, case_number: caseNumber });
    }

    if (action === 'correctiveScan') {
      const shipment = findShipment(payload.tracking_number);
      if (!shipment) return badRequest('Unknown tracking number.');
      const clip = await createLiveCapture(store, demoSessionId, 'CAM-3310', 'PDX1', 'pallet_scan', 'Corrective pallet scan');
      const candidate = {
        tracking_number: shipment.tracking_number,
        scenario_key: shipment.scenario_key,
        sequence: 710,
        event_type: 'corrective',
        event_label: 'Corrective scan — missing sortation event reconciled',
        occurred_at: new Date(Date.now() - 4000).toISOString(),
        scanner_id: 'SC-5612',
        camera_id: 'CAM-3310',
        employee_id: 'EMP-6733',
        facility: 'PDX1',
        vehicle: '',
        scan_status: 'confirmed',
        note: 'Supervisor re-scanned the parcel and reconciled the missing sortation event.'
      };
      const sync = synchronizeEvent(candidate, [clip, ...ctx.clips], ctx.scanners, ctx.cameras);
      const event = await store.ScanEvent.create({
        ...candidate,
        demo_session_id: demoSessionId,
        sync_status: sync.sync_status,
        sync_note: sync.sync_note,
        video_clip_key: sync.video_clip_key,
        playback_position_seconds: sync.playback_position_seconds,
        evidence_source: sync.evidence_source
      });

      const openCase = ctx.cases.find((c) => c.tracking_number === shipment.tracking_number);

      await store.Shipment.update(shipment.id, {
        status: 'in_transit',
        last_verified_scan_at: candidate.occurred_at,
        last_known_location: 'Sortation lane 3, Columbia Sort Center',
        investigation_status: openCase ? 'resolved' : shipment.investigation_status,
        discrepancy_reason: 'Missing sortation scan reconciled. The parcel was re-scanned and returned to the outbound flow.',
        evidence_status: 'available'
      });

      let caseNumber = '';
      if (openCase) {
        caseNumber = openCase.case_number;
        await store.Investigation.update(openCase.id, {
          status: 'resolved',
          resolved_at: nowIso(),
          resolution: 'Handling capture reviewed and a corrective scan was performed. The logistics record now reconciles with the physical handling event. Scanner reliability follow-up logged.',
          evidence_summary: 'Available — handling capture matched, corrective scan matched.'
        });
      }
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'Jordan Alvarez (EMP-6733)', action: 'Missing scan reconciled', entity_type: 'Shipment', entity_ref: shipment.tracking_number, detail: 'Corrective scan performed and record reconciled.', severity: 'info', category: 'recovery' });
      return Response.json({ ok: true, outcome: 'reconciled', event, sync, case_number: caseNumber });
    }

    // ------------------------------------------------------------------- logistics grid

    if (action === 'updateRecord') {
      const event = findEvent(payload.event_id);
      if (!event) return badRequest('Unknown scan event.');
      const patch = {};
      if (typeof payload.note === 'string') patch.note = payload.note.slice(0, 600);
      if (typeof payload.event_label === 'string') patch.event_label = payload.event_label.slice(0, 200);
      if (Object.keys(patch).length === 0) return badRequest('Nothing to update.');
      const updated = await store.ScanEvent.update(event.id, patch);
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'demo_operator', action: 'Logistics record amended', entity_type: 'ScanEvent', entity_ref: event.tracking_number, detail: 'Record edited from the logistics grid.', severity: 'info', category: 'record' });
      return Response.json({ ok: true, outcome: 'record_updated', event: updated });
    }

    // -------------------------------------------------------- hands-free scan preview

    if (action === 'runAiTracking') {
      const runId = 'AIRUN-' + Date.now().toString(36).toUpperCase();
      const base = Date.now();
      const slots = [
        { slot: 'A1', tn: 'TBA304711885000' },
        { slot: 'A2', tn: 'TBA304711902417' },
        { slot: 'A3', tn: 'TBA304711915063' },
        { slot: 'B1', tn: 'TBA304711927744' },
        { slot: 'B2', tn: payload.tracking_number || 'TBA304711933190' },
        { slot: 'B3', tn: 'TBA304711944002' }
      ];
      const rows = [];

      slots.forEach((s, i) => {
        rows.push({
          demo_session_id: demoSessionId,
          run_id: runId,
          tracking_number: s.tn,
          object_id: 'OBJ-' + s.slot,
          pallet_slot: s.slot,
          state: 'RED',
          confidence: Number((0.91 + (i % 6) * 0.011).toFixed(3)),
          observed_at: new Date(base).toISOString(),
          elapsed_ms: 0,
          barcode_read: '',
          barcode_confidence: 0,
          camera_id: 'CAM-3310',
          note: 'Visible on the pallet with no matching verified scan.',
          stage: 'pallet_scan'
        });
      });

      rows.push({
        demo_session_id: demoSessionId, run_id: runId, tracking_number: 'TBA304711933190', object_id: 'OBJ-B2', pallet_slot: 'B2',
        state: 'RED', confidence: 0.94, observed_at: new Date(base + 900).toISOString(), elapsed_ms: 900,
        barcode_read: 'TBA304711933190', barcode_confidence: 0.88, camera_id: 'CAM-3310',
        note: 'Barcode recognized. This suggests a package identity only — it does not create an official scan.',
        stage: 'barcode_read'
      });
      rows.push({
        demo_session_id: demoSessionId, run_id: runId, tracking_number: 'TBA304711933190', object_id: 'OBJ-B2', pallet_slot: 'B2',
        state: 'YELLOW', confidence: 0.93, observed_at: new Date(base + 1800).toISOString(), elapsed_ms: 1800,
        barcode_read: '', barcode_confidence: 0, camera_id: 'CAM-3310',
        note: 'Object lifted from the pallet and currently being held by the associate.',
        stage: 'held'
      });
      rows.push({
        demo_session_id: demoSessionId, run_id: runId, tracking_number: 'TBA304711933190', object_id: 'OBJ-B2', pallet_slot: 'B2',
        state: 'GREEN', confidence: 0.95, observed_at: new Date(base + 2700).toISOString(), elapsed_ms: 2700,
        barcode_read: '', barcode_confidence: 0, camera_id: 'CAM-3310',
        note: 'Official scanner confirmation received from SC-5120. The state promotes to confirmed because an authoritative scan exists.',
        stage: 'scan_confirmed'
      });
      rows.push({
        demo_session_id: demoSessionId, run_id: runId, tracking_number: 'TBA304711933190', object_id: 'OBJ-B2', pallet_slot: 'B2',
        state: 'GREEN', confidence: 0.95, observed_at: new Date(base + 3600).toISOString(), elapsed_ms: 3600,
        barcode_read: '', barcode_confidence: 0, camera_id: 'CAM-3310',
        note: 'Handling event closed. Status is retained for this handling event and returns to red on the next unconfirmed observation.',
        stage: 'handling_closed'
      });

      const created = await store.AiObservation.bulkCreate(rows);
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'ai_preview', action: 'Hands-free tracking preview executed', entity_type: 'AiObservation', entity_ref: runId, detail: 'Six objects evaluated; one transitioned red to yellow to green. Five remained red.', severity: 'info', category: 'ai' });

      return Response.json({
        ok: true,
        outcome: 'ai_run',
        run_id: runId,
        rows: created,
        disclosure: 'Scripted object-state demonstration. No computer-vision model is trained or run in this preview.'
      });
    }

    if (action === 'registerFootage') {
      const clip = await store.VideoClip.create({
        demo_session_id: demoSessionId,
        clip_key: 'CLIP-UPLOAD-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        title: payload.title || 'Operator-uploaded recording',
        clip_url: payload.file_uri,
        evidence_kind: 'video_file',
        scene: 'uploaded',
        source_label: 'Operator-uploaded sample recording',
        device_attribution: 'Uploaded by the demo operator',
        camera_id: payload.camera_id || 'CAM-2201',
        facility: payload.facility || 'SEA3',
        recorded_start: payload.recorded_start || nowIso(),
        recorded_end: payload.recorded_end || new Date(Date.now() + 60000).toISOString(),
        duration_seconds: payload.duration_seconds || 60,
        description: payload.description || 'Recording supplied by the demonstration operator. Not device footage from this scenario.',
        generated_sample: false,
        uploaded: true,
        hue: 160
      });
      await recordActivity(base44, { demo_session_id: demoSessionId, actor: 'demo_operator', action: 'Recording attached', entity_type: 'VideoClip', entity_ref: clip.clip_key, detail: 'Operator-supplied recording made available to the evidence player.', severity: 'info', category: 'evidence' });
      return Response.json({ ok: true, outcome: 'footage_registered', clip });
    }

    return badRequest('Unknown action: ' + action);
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}