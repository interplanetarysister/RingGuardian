import test from 'node:test';
import assert from 'node:assert/strict';
import {parseShipmentNotice,normalizeTracking,inferCarrier,createShipment,mergeShipment,statusFromNotice,carrierPortal} from '../src/lib/customerShipmentImports.js';

test('shipping email extraction identifies carrier without storing raw email',()=>{
 const notice='From: UPS <shipping@ups.com> Tracking Number: 1Z999AA10123456784. Your package is out for delivery.';
 const result=parseShipmentNotice(notice);
 assert.equal(result.carrier,'UPS');
 assert.equal(result.tracking,'1Z999AA10123456784');
 assert.equal(result.status,'Out for delivery (message)');
 assert.equal(Object.hasOwn(result,'rawText'),false);
 assert.equal(Object.hasOwn(result,'sender'),false);
});
test('imports never treat negative delivery as successful handoff',()=>{
 assert.equal(statusFromNotice('Your package was not delivered'),'Delivery problem reported');
 assert.equal(statusFromNotice('Delivery exception'),'Delivery problem reported');
});
test('invalid tracking entries cannot enter the customer shipment list',()=>{
 assert.equal(normalizeTracking(''), '');
 assert.equal(normalizeTracking('abc'), '');
 assert.equal(normalizeTracking('1Z 999AA10123456784'),'1Z999AA10123456784');
 assert.equal(createShipment({tracking:'fake',carrier:'UPS'}),null);
 assert.equal(inferCarrier('My FedEx package is coming'), 'FedEx');
});
test('shipments are deduplicated by carrier and tracking number, capped to 25',()=>{
 const s=createShipment({tracking:'1Z999AA10123456784',carrier:'UPS',nickname:'one'});
 const updated=createShipment({tracking:'1Z999AA10123456784',carrier:'UPS',nickname:'two'});
 const a=mergeShipment([s],updated);
 assert.equal(a.length,1);
 assert.equal(a[0].nickname,'two');
});
test('official provider support links are HTTPS and unknown carriers require manual verification',()=>{
 for(const carrier of ['UPS','FedEx','USPS','DHL','OnTrac'])assert.match(carrierPortal(carrier),/^https:\/\//);
 assert.equal(carrierPortal('Other'),null);
});