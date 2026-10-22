import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const manifest = JSON.parse(readFileSync('public/audio/amy/manifest.json','utf8'));
test('all nine Piper Amy prompts have real matching audio assets',()=>{
 assert.equal(Object.keys(manifest.scripts).length,9);
 assert.equal(manifest.voice,'en_US-amy-medium');
 for (const [key,info] of Object.entries(manifest.scripts)){
  const file='public'+info.src;
  assert.ok(statSync(file).size>15000,key+' has non-empty sound');
  const bytes=readFileSync(file);
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');
  assert.equal(bytes.subarray(8,12).toString(),'WAVE');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),info.sha256);
 }
});