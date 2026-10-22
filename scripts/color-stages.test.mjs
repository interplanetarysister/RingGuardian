import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const panel=readFileSync('src/components/workflow/WorkflowStage.jsx','utf8');
const customer=readFileSync('src/pages/CustomerWorkspace.jsx','utf8');
const management=readFileSync('src/pages/HubManagement.jsx','utf8');
const other=readFileSync('src/components/customer/OtherCarrierDeliveries.jsx','utf8');
const guide=readFileSync('src/components/guide/RoleWalkthrough.jsx','utf8');
const roleKnowledge=readFileSync('src/lib/roleGuides.js','utf8');
const worker=readFileSync('cloudflare/guardian-guide/worker.mjs','utf8');

test('workflow outlines use thick vivid colors in correct order',()=>{
 for(const hex of ['#FACC15','#FF5138','#09CFC2','#45C967','#AD70FF'])assert.ok(panel.includes(hex),hex);
 assert.match(panel,/border-\[5px\]/);
 assert.match(panel,/blur-\[5px\]/);
 assert.match(panel,/aria-disabled=\{locked\}/);
 assert.match(panel,/Complete step \{number-1\} to unlock/);
 assert.match(panel,/active\?palette\.wash/);
});

test('Customer wizard has the exact requested numbered journey, paired camera and honest demo status',()=>{
 assert.match(customer,/const STAGE_TITLES=\['Select Package','Compile Details','Gather Evidence','Submit Investigation','Other Carriers'\]/);
 for(const number of [1,2,3,4,5])assert.match(customer,new RegExp('number=\\{'+number+'\\}'));
 assert.match(customer,/setReportedStart\(start\)/);
 assert.match(customer,/tracking_number:selected\.tracking_number/);
 assert.match(customer,/previewClip|pairedClip/);
 assert.match(customer,/EvidencePlayer key=\{pairedClip\.clip_key\}/);
 assert.match(customer,/footageReviewed/);
 assert.match(customer,/!isDone\(3\)/);
 assert.match(customer,/include_simulated_doorbell:includeFootage/);
 assert.match(customer,/DEMO LINKED/);
 assert.match(customer,/not a real Ring recording/);
 assert.match(customer,/doorbell_event_key:selectedDoorbellEvent/);
 assert.match(customer,/doorbellUnavailable\(selected\)/);
 assert.match(customer,/setOtherRoute\(true\)/);
});

test('Management flow enforces report -> shipping -> scanners and evidence -> cases -> optional tools',()=>{
 assert.match(management,/const STAGES=\['Customer Reports','Follow Shipment','Match Camera Evidence','Review Investigation','More Management Tools'\]/);
 assert.match(management,/CustomerReportsInbox/);
 assert.match(management,/!has\('scannersOpened'\)\|\|!has\('evidenceOpened'\)/);
 assert.match(management,/!has\('investigationsOpened'\)/);
 assert.match(management,/rgc\.management\.workflow\.v1/);
 assert.match(management,/sessionStorage\.setItem\(PROGRESS_KEY/);
 assert.match(management,/mode==='demo'/);
 assert.match(management,/not authorize real warehouse access/);
});

test('Other carrier route works without an Amazon submission, but external claim remains manual',()=>{
 assert.match(customer,/You can prepare non-Amazon package evidence even without completing the four-stage Amazon demo/);
 for(const n of [1,2,3,4])assert.match(other,new RegExp('WorkflowStage number=\\{'+n+'\\}'));
 assert.match(other,/SIMULATED/);
 assert.match(other,/downloadEvidence\('zip'\)/);
 assert.match(other,/downloadEvidence\('docx'\)/);
 assert.match(other,/not uploaded to Ring Guardian|not yet uploaded anywhere|prepared locally/i);
 assert.match(other,/No claim number is issued/);
});

test('Amy, Piper and the worker know the redesigned colored workflow',()=>{
 assert.match(guide,/sunshine yellow/);
 assert.match(guide,/orange-red/);
 assert.match(guide,/turquoise teal/);
 assert.match(guide,/grass green/);
 assert.match(guide,/electric violet/);
 assert.match(roleKnowledge,/Customer workflow: 1 sunshine-yellow Select Package/);
 assert.match(roleKnowledge,/Management workflow: 1 sunshine-yellow Review Customer Reports/);
 assert.match(worker,/color-coded stages/);
 assert.match(customer,/Talk to Amy/);
 assert.match(management,/Talk to Piper/);
});