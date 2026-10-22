import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../base44/shared/scenarios.ts';
import { doorbellChoices, makeCustomerDoorbellClip, makeDeliveryComparisonClip, doorbellIdentity } from '../base44/shared/customerDoorbellProfiles.js';

const shipmentFor = s => ({ ...s.shipment, scenario_key: s.scenario_key });

test('Every scenario with a doorstep illustration uses its own supported camera event', () => {
  for (const scenario of SCENARIOS) {
    const shipment = shipmentFor(scenario);
    const choices = doorbellChoices(shipment);
    const events = scenario.events.map(e => ({ ...e, tracking_number: shipment.tracking_number }));
    for (const choice of choices) {
      const clip = makeCustomerDoorbellClip(shipment, events, choice.eventKey);
      assert.ok(clip, 'Missing scene for '+scenario.scenario_key+': '+choice.eventKey);
      assert.equal(clip.scene, choice.scene);
      assert.equal(clip.tracking_number, shipment.tracking_number);
      assert.equal(clip.camera_view_role, 'customer_expected_doorway');
      assert.notEqual(clip.evidence_kind, 'video_file');
      assert.match(clip.source_label, /NOT an authenticated Ring video/);
    }
  }
});
test('Direct handoff shows recipient meeting courier and does not invent scan or doorstep placement', () => {
  const scenario = SCENARIOS.find(s => s.scenario_key === 'direct_handoff_no_scan');
  assert.ok(scenario);
  const events = scenario.events.map(e => ({ ...e, tracking_number: scenario.shipment.tracking_number }));
  const shipment = shipmentFor(scenario);
  const clip = makeCustomerDoorbellClip(shipment, events, 'handoff');
  assert.ok(clip);
  assert.equal(clip.scene, 'doorbell_handoff');
  assert.match(clip.description, /transfers directly into their hands/);
  assert.match(clip.description, /No package is placed/);
  assert.match(clip.description, /no delivery scan is shown/);
  assert.equal(scenario.events.at(-1).scan_status, 'missing');
  assert.equal(scenario.events.at(-1).scanner_id, '');
  assert.equal(makeDeliveryComparisonClip(shipment, events), null);
});
test('Repeated events use the identical camera doorway key for one package', () => {
  const scenario = SCENARIOS.find(s => s.scenario_key === 'stolen_after_delivery');
  assert.ok(scenario);
  const shipment = shipmentFor(scenario);
  const events = scenario.events.map(e => ({ ...e, tracking_number: shipment.tracking_number }));
  const a = makeCustomerDoorbellClip(shipment, events, 'delivery');
  const b = makeCustomerDoorbellClip(shipment, events, 'removal');
  assert.ok(a && b);
  assert.deepEqual(doorbellIdentity(a), doorbellIdentity(b));
});