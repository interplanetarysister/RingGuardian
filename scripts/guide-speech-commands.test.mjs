import test from 'node:test';
import assert from 'node:assert/strict';
import {guideSpeechCommand} from '../src/lib/guideSpeechCommands.js';
import {readFileSync} from 'node:fs';
test('direct guide controls recognize explicit voice commands',()=>{
 for(const [text,intent] of [['Skip this step','skip'],['next step','skip'],['repeat that','repeat'],['say it again','repeat'],['stop talking','stop'],['pause audio','pause'],['resume audio','resume'],['start walkthrough','start'],['text only','text'],['restart tour','restart'],['help','help'],['go back','back'],['where am I?','context']])
  assert.equal(guideSpeechCommand(text),intent,text);
});
test('negated, conditional or unrelated phrases never trigger skip or stop',()=>{
 for(const text of ['I do not want to skip','Can you explain what skip means?','Why did you stop?','Please repeat how the evidence works','Should I skip anything?','The scanner skipped my package','Please do not skip','Can you repeat how the issue was handled?'])
  assert.equal(guideSpeechCommand(text),null,text);
});
test('skip does not claim the action was completed and the guide preserves user control',()=>{
 const source=readFileSync('src/components/guide/RoleWalkthrough.jsx','utf8');
 assert.match(source,/function skip\(\)\{/);
 assert.match(source,/No action was marked complete/);
 assert.match(source,/onClick=\{skip\}>Skip this step/);
 assert.match(source,/disabled=\{!verified\} onClick=\{complete\}/);
 assert.match(source,/guideSpeechCommand\(q\)/);
});
test('default narration speed and brief factual introduction are configured',()=>{
 const voice=readFileSync('src/lib/voice.js','utf8');
 const entry=readFileSync('src/pages/Entry.jsx','utf8');
 assert.match(voice,/DEFAULT_GUIDE_SPEED=1\.3/);
 assert.match(entry,/voice\.rate=getGuideSpeed\(\)/);
 assert.match(entry,/Security\.org’s 2025 report estimated 37 million/);
 assert.doesNotMatch(entry,/photographs saved from a fire/);
});