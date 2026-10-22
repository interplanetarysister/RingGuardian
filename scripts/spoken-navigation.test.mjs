import test from 'node:test';
import assert from 'node:assert/strict';
import {spokenResponse} from '../src/lib/spokenResponse.js';
import {navigationAnswer} from '../src/lib/navigationGuide.js';
test('long package identifiers are spoken by last four digits only',()=>{
 const s=spokenResponse('Package TBA304711915063 is flagged. Tracking 123456789012 is also here.');
 assert.ok(!s.includes('304711915063'));assert.ok(!s.includes('123456789012'));
 assert.match(s,/5 0 6 3/);assert.match(s,/9 0 1 2/);
});
test('navigation responds to actual page question',()=>{assert.equal(navigationAnswer('Where do I find scanner stations?',{role:'management'}).to,'/scanners')});
test('navigation respects customer separation',()=>{assert.equal(navigationAnswer('Where is the evidence lab?',{role:'customer'}).to,'/')});
test('acknowledge current step without pretending action happened',()=>{const x=navigationAnswer('What do I do next here?',{stepTitle:'Review scan',instruction:'Compare the event timestamp.',path:'/scanners'});assert.match(x.reply,/Review scan/);assert.match(x.reply,/Compare/);});