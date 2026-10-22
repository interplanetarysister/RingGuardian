import {guideKnowledgeAnswer} from './guideKnowledge';
import {consultOtherGuide} from './agentConsultation';
import {roleGuide} from './roleGuides';

import {localAssistantAnswer} from './assistantTools';
import {navigationAnswer} from './navigationGuide';
export const GUARDIAN_MODEL='Meta Llama 3.1 8B Instruct FP8';
export const GUARDIAN_PROVIDER='Cloudflare Workers AI';
export const GUIDE_ENDPOINT='https://ring-guardian-guide.interplanetary-fund.workers.dev';
export async function conversationalAnswer(text,options={}){
 const guide=roleGuide(options.role);
 const local = options.role === 'customer'
   ? {reply:'Amy can help you choose a sample delivery, understand the recorded status, submit a sample report and synthetic doorbell scene to demo management, or download a separate police or insurance statement. Tell me what you see on the Customer page.',tool:'customerGuide',to:'/view/customer',tracking:'',needsConfirmation:false}
   : await localAssistantAnswer(text,options);
 const navigation=navigationAnswer(text,options);
 const known=guideKnowledgeAnswer(text,options);
 if(navigation && (!options.role || guide.routes.includes(navigation.to))) return {...local,...navigation,engine:'Context-aware navigation'};
 if(known) return {...local,reply:known,to:null,engine:'Curated guide knowledge'};
 if(options.confirm||local.needsConfirmation||options.useAI!==true)return {...local,engine:'Built-in guide'};
 let tourStep=null;
 try{const state=JSON.parse(sessionStorage.getItem('rgc.guided-tour.v1')||'null');tourStep=Number.isInteger(state?.index)?state.index:null;}catch{}
 const peerKnowledge=options.role ? await consultOtherGuide(options.role,text):null;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
 try{
  const r=await fetch(GUIDE_ENDPOINT+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({simulation:true,question:text.slice(0,600),context:{toolReply:('Guide: '+guide.name+' ('+(options.role||'general')+'). Current step: '+(options.stepTitle||'unspecified')+'. Instruction: '+(options.instruction||'')+'. Context: '+local.reply+'. Approved cross-guide note: '+(peerKnowledge||'None')).slice(0,1600),currentPath:guide.routes.includes(options.path)?options.path:guide.home,tourStep,role:options.role||'customer'},history:Array.isArray(options.history)?options.history.slice(-4):[]}),signal:controller.signal});
  const data=await r.json();if(!r.ok)throw Error(data.error||'AI unavailable');
  if(typeof data.reply!=='string'||!data.reply.trim())throw Error('AI response was empty');
  return {...local,reply:data.reply,to:guide.routes.includes(data.to)?data.to:(guide.routes.includes(local.to)?local.to:guide.home),engine:GUARDIAN_MODEL,provider:GUARDIAN_PROVIDER};
 }catch(error){return {...local,engine:'Built-in guide',modelNotice:error.name==='AbortError'?'AI took too long; the built-in guide answered.':error.message};}
 finally{clearTimeout(timer);}
}