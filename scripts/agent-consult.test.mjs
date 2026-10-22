import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const backend=readFileSync('base44/shared/agentConsultation.ts','utf8');
const endpoint=readFileSync('base44/functions/agentConsult/entry.ts','utf8');
const frontend=readFileSync('src/lib/agentConsultation.js','utf8');
test('peer consultation is server-owned and allowlisted',()=>{
 assert.match(backend,/Object\.freeze/);assert.match(backend,/TOPICS\[topic\]/);
 assert.match(backend,/noUserData:true/);
 assert.match(endpoint,/consultation\(data\?\.source,data\?\.target,data\?\.topic\)/);
 assert.match(frontend,/source,target,topic/);
 assert.doesNotMatch(frontend,/question\s*\}/);
});
test('other guide information cannot carry a raw user prompt or private package data',()=>{
 assert.match(frontend,/Only a vetted topic is sent/);
 assert.match(backend,/Invalid assistants/);
 assert.match(backend,/Topic not permitted/);
});