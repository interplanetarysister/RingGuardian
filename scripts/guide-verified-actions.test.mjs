import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/lib/guideProgress.js','utf8');
const screen=readFileSync('src/components/guide/RoleWalkthrough.jsx','utf8');
const customer=readFileSync('src/pages/CustomerWorkspace.jsx','utf8');
const shell=readFileSync('src/components/layout/AppShell.jsx','utf8');
test('guide action receipts allowlist action names and do not store private details',()=>{
 assert.match(source,/customer:new Set/);assert.match(source,/management:new Set/);
 assert.match(source,/sessionStorage\.setItem\(KEY,JSON\.stringify\(saved\)\)/);
 assert.doesNotMatch(source,/tracking_number|location|password|videoUrl/);
});
test('customer confirmations depend on actual interactions instead of clicking through',()=>{
 for(const action of ['packageSelected','issueSelected','reportSubmitted','reportReviewed'])
  assert.match(customer,new RegExp('recordGuideAction\\(\\\'customer\\\',\\\''+action+'\\\'\\)'));
 assert.match(screen,/disabled=\{!verified\} onClick=\{complete\}/);
 assert.match(screen,/No action was marked complete/);
});
test('management guidance recognizes route visits only, not case mutations',()=>{
 assert.match(shell,/dashboardOpened/);assert.match(shell,/scannersOpened/);
 assert.match(shell,/evidenceOpened/);assert.match(shell,/packageOpened/);
 assert.doesNotMatch(shell,/caseResolved|recoverSucceeded/);
});
test('natural-language history stays bounded, suggestions stay within the guide role',()=>{
 assert.match(screen,/historyRef\.current=\[/);
 assert.match(screen,/\.slice\(-4\)/);
 assert.match(screen,/guide\.routes\.includes\(answer\.to\)/);
});