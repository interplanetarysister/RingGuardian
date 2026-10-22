import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packageProfilePath, packageProfileBackPath } from '../src/lib/packageLinks.js';

test('a package search result links to its own profile', () => {
  assert.equal(packageProfilePath('RG-1001'), '/packages/RG-1001');
  assert.equal(packageProfilePath('S 123/45'), '/packages/S%20123%2F45');
});

test('the customer workflow can return to its selected shipment', () => {
  assert.equal(packageProfilePath('RG-1001', true), '/packages/RG-1001?from=customer');
  assert.equal(packageProfileBackPath('RG-1001', new URLSearchParams('from=customer')), '/view/customer?tracking=RG-1001');
  assert.equal(packageProfileBackPath('S 123/45', new URLSearchParams('from=customer')), '/view/customer?tracking=S%20123%2F45');
  assert.equal(packageProfileBackPath('RG-1001', new URLSearchParams()), '/packages');
});
