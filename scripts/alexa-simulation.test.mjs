import test from 'node:test';
import assert from 'node:assert/strict';
import { runPackageLookup } from '../src/lib/alexaSimulation.mjs';

const fixtures = [
  { tracking_number: 'TBA304711915063', scenario_title: 'Wrong truck', status: 'misrouted', last_known_location: 'Dock A' },
  { tracking_number: 'TBA123456789123', package_nickname: 'Birthday present', status: 'delivered_received' }
];

test('list tool returns actual demo records and their current statuses', () => {
  const answer = runPackageLookup('Show all packages', fixtures);
  assert.equal(answer.tool, 'list_demo_packages');
  assert.equal(answer.packages.length, 2);
  assert.equal(answer.packages[0].status, 'misrouted');
});

test('package question routes to the selected package profile', () => {
  const answer = runPackageLookup('Where is package 5063?', fixtures);
  assert.equal(answer.tool, 'get_package_status');
  assert.equal(answer.route, '/packages/TBA304711915063');
  assert.match(answer.reply, /Dock A/);
  assert.match(answer.reply, /fictional/);
});

test('unknown packages are not invented', () => {
  const answer = runPackageLookup('Where is package 9999?', fixtures);
  assert.equal(answer.route, '/packages');
  assert.deepEqual(answer.packages, []);
});

test('unrelated questions go to the conversational guide', () => {
  assert.equal(runPackageLookup('How do I log in?', fixtures), null);
});
