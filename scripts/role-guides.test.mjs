import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const guides=readFileSync('src/lib/roleGuides.js','utf8');
const client=readFileSync('src/lib/conversationalGuide.js','utf8');
const worker=readFileSync('cloudflare/guardian-guide/worker.mjs','utf8');
test('Amy is customer and cannot route to management interfaces',()=>{
 assert.match(guides,/name:'Amy', title:'Customer guide'/);
 const segment=guides.split('customer: {')[1].split('management: {')[0];
 assert.doesNotMatch(segment,/\/scanners|\/investigations|\/dashboard/);
 assert.match(client,/guide\.routes\.includes\(data\.to\)/);
 assert.match(client,/options\.role === 'customer'/);
});
test('Piper is management and worker has separate knowledge without authorizing real operations',()=>{
 assert.match(guides,/name:'Piper',title:'Management guide'/);
 assert.match(worker,/roleKnowledge = management/);
 assert.match(worker,/Management tour view does not grant real operational privileges/);
 assert.match(worker,/Do not describe management navigation/);
});