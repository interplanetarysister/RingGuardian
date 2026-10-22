import {base44} from '@/api/base44Client';
// Only a vetted topic is sent. Never transmit actual user question or record values.
const topics = ['shipping','evidence','reporting','navigation','privacy'];
export function selectConsultationTopic(question=''){
 const q=String(question).toLowerCase();
 if(/police|insurance|report|complaint|refund/.test(q))return 'reporting';
 if(/proof|footage|clip|timestamp|evidence|video/.test(q))return 'evidence';
 if(/page|menu|where|navigate|screen|button/.test(q))return 'navigation';
 if(/private|privacy|permission|access|security/.test(q))return 'privacy';
 if(/ship|sort|load|delivery|carrier/.test(q))return 'shipping';
 return null;
}
export async function consultOtherGuide(role, question){
 const topic=selectConsultationTopic(question);
 if(!topic||!topics.includes(topic))return null;
 const source=role==='management'?'Piper':'Amy';
 const target=source==='Amy'?'Piper':'Amy';
 try{
  const response=await base44.functions.invoke('agentConsult',{source,target,topic});
  const value=response?.data||response;
  if(value?.ok===true && value.version===1 && value.visibility==='public_demo_knowledge' && value.topic===topic && value.source===source && value.target===target && value.noUserData===true && typeof value.answer==='string')return value.answer.slice(0,350);
 }catch{/* Local guidance continues when consult backend is unavailable. */}
 return null;
}