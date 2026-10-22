// User-submitted notice processing. Never sends the original email or a parcel
// identifier to any provider or app database. Parsed data remains browser-local.
export const CARRIER_INFO = Object.freeze({
  UPS:{label:'UPS',trackingUrl:'https://www.ups.com/us/en/support/tracking-support',claimUrl:'https://www.ups.com/guestclaims/create?loc=en_us'},
  FedEx:{label:'FedEx',trackingUrl:'https://www.fedex.com/en-us/tracking.html',claimUrl:'https://www.fedex.com/en-us/customer-support/claims.html'},
  USPS:{label:'USPS',trackingUrl:'https://tools.usps.com/go/TrackConfirmAction',claimUrl:'https://www.usps.com/help/missing-mail.htm'},
  DHL:{label:'DHL',trackingUrl:'https://www.dhl.com/us-en/home/tracking.html',claimUrl:'https://www.dhl.com/us-en/home/customer-service.html'},
  OnTrac:{label:'OnTrac',trackingUrl:'https://www.ontrac.com/support/',claimUrl:'https://www.ontrac.com/contact/'},
  Other:{label:'Other carrier',trackingUrl:null,claimUrl:null}
});
/** @type {Array<[string, RegExp]>} */
/** @type {Array<[string, RegExp]>} */
const SOURCE_WORDS=[['UPS',/\b(UPS|My Choice|ups\.com)\b/i],['FedEx',/\b(FedEx|fedex\.com)\b/i],['USPS',/\b(USPS|United States Postal Service|Informed Delivery|usps\.com)\b/i],['DHL',/\b(DHL|dhl\.com)\b/i],['OnTrac',/\b(OnTrac|ontrac\.com)\b/i]];
export function normalizeTracking(value) {
 const normalized=String(value||'').trim().replace(/\s+/g,'').toUpperCase();
 return /^[A-Z0-9-]{7,40}$/.test(normalized)?normalized:'';
}
export function inferCarrier(source='',tracking=''){
 const text=String(source||'').slice(0,30000);
 // Use explicit carrier names in the user's email, not a speculative guess
 const named=SOURCE_WORDS.find(([,pattern])=>pattern.test(text));
 if(named)return named[0];
 const id=normalizeTracking(tracking);
 if(/^1Z[A-Z0-9]{16}$/.test(id))return 'UPS';
 if(/^9[2345678]\d{18,20}$/.test(id))return 'USPS';
 if(/^(1LS|LS|LX|BN)[A-Z0-9]{8,25}$/.test(id))return 'OnTrac';
 return 'Other';
}
export function statusFromNotice(text=''){
 const s=String(text||'').toLowerCase();
 // Negated delivery claims should not be counted as delivered.
 if(/\b(not delivered|not received|never delivered|delivery failed|unable to deliver|delivery exception)\b/.test(s))return 'Delivery problem reported';
 if(/\b(out for delivery)\b/.test(s))return 'Out for delivery (message)';
 if(/\b(delivered|delivery confirmed)\b/.test(s))return 'Delivered (reported in message)';
 if(/\b(delay|delayed|exception)\b/.test(s))return 'Delivery delayed (message)';
 if(/\b(in transit|on its way|on the way|shipped|shipping)\b/.test(s))return 'In transit (message)';
 if(/\b(label created|pre-shipment)\b/.test(s))return 'Label created (message)';
 return 'Status not determined';
}
export function parseShipmentNotice(source=''){
 const text=String(source||'').slice(0,35000);
 const stripped=text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<script[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
 const matches=[
  /(?:tracking(?:\s+(?:number|no\.?|id|#))?|shipment(?:\s+(?:number|id))?|waybill)\s*[:#\-]?\s*([A-Z0-9-]{7,40})/gi,
  /\b(1Z[A-Z0-9]{16})\b/gi,
  /\b(9[2345678]\d{18,20})\b/g
 ];
 const candidate=[];
 for(const regex of matches){
  let m;while((m=regex.exec(stripped))!==null && candidate.length<12){
   const value=normalizeTracking(m[1]?.split(/\s{2,}|(?:\s+(?:is|has|will|was|on|at|status))\b/i)[0]);
   if(value && !/^(DELIVERED|SHIPPING|TRACKING|CARRIER|CUSTOMER|CONFIRMED|YOURORDER)$/.test(value))candidate.push(value);
  }
 }
 const number=candidate[0]||'';
 // Return only sanitized shipment metadata. Never forward raw mail/body or HTML.
 return {tracking:number,carrier:inferCarrier(stripped,number),status:statusFromNotice(stripped),source:'Imported message (unverified)',reportedWindow:'',nickname:''};
}
export function createShipment(input={}){
 const tracking=normalizeTracking(input.tracking);
 const carrier=Object.hasOwn(CARRIER_INFO,input.carrier)?input.carrier:inferCarrier('',tracking);
 if(!tracking)return null;
 return {tracking,carrier,status:String(input.status||'Status not verified').slice(0,110),
  nickname:String(input.nickname||'').trim().slice(0,65),
  reportedWindow:String(input.reportedWindow||'').slice(0,100),
  source:String(input.source||'Manually entered (unverified)').slice(0,80),
  updatedAt:new Date().toISOString()};
}
export function mergeShipment(list=[],shipment){
 if(!shipment)return Array.isArray(list)?list:[];
 const safe=Array.isArray(list)?list:[];
 return [shipment,...safe.filter(p=>p.tracking!==shipment.tracking||p.carrier!==shipment.carrier)].slice(0,25);
}
export function carrierPortal(carrier,kind='claim'){
 const info=CARRIER_INFO[carrier]||CARRIER_INFO.Other;
 return kind==='tracking'?info.trackingUrl:info.claimUrl;
}