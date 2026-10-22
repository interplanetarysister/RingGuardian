// Backend-only curated cross-guide consultation. No private records or supplied dialogue.
export const TOPICS = Object.freeze({
 shipping:'Packages move through acceptance, sorting, transport, loading, and delivery. Every scan is a record of an event, not proof of receipt.',
 evidence:'Compare source, item identity, date/time and provenance. Footage with mismatched timestamps cannot verify a scan. Do not infer theft from missing imagery.',
 reporting:'Customers can create a local Word incident statement and optionally download their own video. Nothing automatically reaches a police agency, insurer or carrier.',
 navigation:'Amy uses Customer: select and optionally nickname a paired delivery, submit an internal demo complaint with optional synthetic doorbell scene, confirm receipt in step 4, and separately prepare a Word report. Piper uses Management: dashboard, packages, scanners, camera evidence, investigations, recovery.',
 privacy:'Never share real worker, customer, device or camera data between assistants. Management route selection does not grant server permissions.'
});
export function consultation(source,target,topic){
 if(!['Amy','Piper'].includes(source)||!['Amy','Piper'].includes(target)||source===target)return {ok:false,error:'Invalid assistants'};
 if(typeof topic!=='string'||!Object.prototype.hasOwnProperty.call(TOPICS,topic))return {ok:false,error:'Topic not permitted'};
 return {ok:true,version:1,source,target,topic,answer:TOPICS[topic],visibility:'public_demo_knowledge',mode:'curated',noUserData:true};
}