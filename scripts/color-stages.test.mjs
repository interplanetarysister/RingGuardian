import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const panel = readFileSync('src/components/workflow/WorkflowStage.jsx','utf8');
const customer = readFileSync('src/pages/CustomerWorkspace.jsx','utf8');
const management = readFileSync('src/pages/HubManagement.jsx','utf8');
const guide = readFileSync('src/components/guide/RoleWalkthrough.jsx','utf8');
const other = readFileSync('src/components/customer/OtherCarrierDeliveries.jsx','utf8');
const roleKnowledge = readFileSync('src/lib/roleGuides.js','utf8');

test('Sequential sections remain connected and keep their high-contrast color boundaries',()=>{
  for (const hex of ['#FACC15','#FF5138','#09CFC2','#45C967','#AD70FF']) assert.ok(panel.includes(hex),hex);
  assert.match(panel,/border-\[5px\]/);
  assert.match(panel,/rounded-none/);
  assert.match(panel,/blur-\[5px\]/);
  assert.match(panel,/aria-disabled=\{locked\}/);
  assert.match(panel,/Complete step \{number-1\} to unlock/);
  assert.match(customer,/Connected customer workflow stages/);
  assert.match(management,/Connected management workflow stages/);
  assert.match(customer,/flex flex-col gap-0/);
  assert.match(management,/flex flex-col gap-0/);
});
test('Customer package flow matches selection, description, footage and submission',()=>{
  for (const label of ['Choose Delivery','Describe the Issue','Review Camera Evidence','Send the Report','Other Delivery Services']) assert.ok(customer.includes(label),label);
  for (const n of [1,2,3,4,5]) assert.match(customer,new RegExp('number=\\{'+n+'\\}'));
  assert.match(customer,/setReportedStart\(start\)/);
  assert.match(customer,/tracking_number:selected\.tracking_number/);
  assert.match(customer,/EvidencePlayer key=\{pairedClip\.clip_key\}/);
  assert.match(customer,/footageReviewed/);
  assert.match(customer,/!isDone\(3\)/);
  assert.match(customer,/include_simulated_doorbell:includeFootage/);
  assert.match(customer,/doorbell_event_key:selectedDoorbellEvent/);
  assert.match(customer,/doorbellUnavailable\(selected\)/);
});
test('Management investigation cannot skip evidence and case review',()=>{
  for (const label of ['Review Incoming Reports','Trace Package Movement','Compare Camera Evidence','Resolve Investigation','Additional Operations']) assert.ok(management.includes(label),label);
  assert.match(management,/CustomerReportsInbox/);
  assert.match(management,/!has\('scannersOpened'\)\|\|!has\('evidenceOpened'\)/);
  assert.match(management,/!has\('investigationsOpened'\)/);
  assert.match(management,/sessionStorage\.setItem\(PROGRESS_KEY/);
});
test('Other delivery services keep independent evidence handling',()=>{
  assert.match(customer,/You can prepare non-Amazon package evidence even without completing the four-stage Amazon demo/);
  for (const n of [1,2,3,4]) assert.match(other,new RegExp('WorkflowStage number=\\{'+n+'\\}'));
  assert.match(other,/downloadEvidence\('zip'\)/);
  assert.match(other,/downloadEvidence\('docx'\)/);
  assert.match(other,/No claim number is issued/);
});
test('Help text knows current stage names',()=>{
  for (const phrase of ['sunshine yellow','orange-red','turquoise teal','grass green','electric violet']) assert.ok(guide.includes(phrase),phrase);
  assert.match(roleKnowledge,/Customer workflow: 1 sunshine-yellow Choose Delivery/);
  assert.match(roleKnowledge,/Management workflow: 1 sunshine-yellow Review Incoming Reports/);
  assert.match(customer,/Talk to Amy/);
  assert.match(management,/Talk to Piper/);
});