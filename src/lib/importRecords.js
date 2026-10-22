/** Guest import parser: runs entirely in the browser. No remote API or implied courier verification. */
export function parseCsv(input) {
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<input.length;i++){const ch=input[i];
  if(ch==='"' && input[i+1]==='"' && quoted){cell+='"';i++;continue}
  if(ch==='"'){quoted=!quoted;continue}
  if(ch===','&&!quoted){row.push(cell.trim());cell='';continue}
  if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&input[i+1]==='\n')i++;row.push(cell.trim());cell='';if(row.some(Boolean))rows.push(row);row=[];continue}
  cell+=ch;
 }
 if(quoted)throw Error('CSV has an unclosed quote.');
 row.push(cell.trim());if(row.some(Boolean))rows.push(row);
 if(!rows.length)return [];
 const keys=rows.shift().map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,'_'));
 const match=(names)=>names.map(n=>keys.indexOf(n)).find(n=>n>=0);
 const id=match(['tracking_number','tracking','tracking_id','shipment_id','package_id','awb','waybill']);
 if(id===undefined)throw Error('No tracking-number column found. Export a CSV with a tracking_number or tracking column.');
 const carrier=match(['carrier','courier','shipping_service','delivery_service']);
 const status=match(['status','shipment_status','delivery_status']);
 const eta=match(['eta','expected_delivery','delivery_date']);
 return rows.slice(0,500).map((r,i)=>({
   tracking:r[id]?.slice(0,90)||'',
   carrier:carrier===undefined?'Not provided':r[carrier]?.slice(0,80)||'Not provided',
   status:status===undefined?'Unverified':r[status]?.slice(0,120)||'Unverified',
   eta:eta===undefined?'Unknown':r[eta]?.slice(0,100)||'Unknown',
   source:'Uploaded file; not verified with carrier',
   row:i+2
 })).filter(r=>r.tracking);
}
export function parseNotice(text) {
 const value=text.trim();if(!value)return [];
 const tracking=value.match(/(?:tracking(?:\s*(?:number|id|#))?|shipment(?:\s*(?:number|id))?)\s*[:#-]?\s*([A-Z0-9-]{8,40})/i);
 return [{tracking:tracking?.[1]||value.slice(0,90),carrier:'Not verified',status:'Unverified',eta:'Unknown',source:'User-entered text; not verified with carrier',row:1}];
}