import test from 'node:test';
import assert from 'node:assert/strict';
import {readGuideActions,recordGuideAction,clearGuideActions} from '../src/lib/guideProgress.js';
import {guideKnowledgeAnswer} from '../src/lib/guideKnowledge.js';

test('action receipts are role bounded, deduplicated and contain no package identifiers',()=>{
 const data=new Map();
 globalThis.sessionStorage={
  getItem:key=>data.get(key)||null,
  setItem:(key,v)=>data.set(key,v)
 };
 assert.equal(recordGuideAction('customer','packageSelected'),true);
 assert.equal(recordGuideAction('customer','packageSelected'),true);
 assert.equal(recordGuideAction('customer','evidenceOpened'),false);
 assert.equal(recordGuideAction('management','scannersOpened'),true);
 assert.deepEqual(readGuideActions('customer'),['packageSelected']);
 assert.deepEqual(readGuideActions('management'),['scannersOpened']);
 assert.doesNotMatch(data.get('rgc.guide.verifiedActions.v1'),/tracking_number|video_url|secret/);
 clearGuideActions('customer');
 assert.deepEqual(readGuideActions('customer'),[]);
 assert.deepEqual(readGuideActions('management'),['scannersOpened']);
 delete globalThis.sessionStorage;
});

test('curated guides distinguish stolen shipments, unknown recovery figures, and police reporting',()=>{
 assert.match(guideKnowledgeAnswer('How many packages get stolen per year?',{role:'customer'}),/37 million/);
 assert.match(guideKnowledgeAnswer('How many are never recovered?',{role:'customer'}),/no reliable nationwide count/);
 const report=guideKnowledgeAnswer('Can you file a police report?',{role:'customer'});
 assert.match(report,/No police, insurer, carrier or retailer is contacted/);
 assert.equal(guideKnowledgeAnswer('Can you file a police report?',{role:'management'}),null);
 assert.match(guideKnowledgeAnswer('What do warehouse scanners do?',{role:'management'}),/Scanner stations/);
});