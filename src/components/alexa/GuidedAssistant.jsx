import React,{useEffect,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {TOUR_STEPS,downloadTour} from '@/lib/tour';
import ConversationGuide from './ConversationGuide';
import {speak,stopSpeaking,speechSupported} from '@/lib/voice';
const KEY='rgc.guided-tour.v1';
function saved(){try{return JSON.parse(sessionStorage.getItem(KEY))||{active:false,index:0};}catch{return {active:false,index:0};}}
export default function GuidedAssistant(){
 const [state,setState]=useState(saved),[voice,setVoice]=useState(true),[minimized,setMinimized]=useState(false);
 const location=useLocation(),navigate=useNavigate();const step=TOUR_STEPS[state.index]||TOUR_STEPS[0];
 useEffect(()=>{sessionStorage.setItem(KEY,JSON.stringify(state));},[state]);
 useEffect(()=>{
  const receive=e=>{const d=e.detail;if(d.name==='start'){setState({active:true,index:location.pathname==='/live-events'?3:0});setMinimized(false);return;}
   if(!state.active)return;
   if(d.name===step.event||(d.name==='operation'&&(d.action===step.action||step.action==='gateway'&&d.action==='gateway'))){if(state.index<TOUR_STEPS.length-1)setState(s=>({...s,index:s.index+1}));}
  };window.addEventListener('rgc-tour',receive);return()=>window.removeEventListener('rgc-tour',receive);
 },[state.active,state.index,step]);
 useEffect(()=>{
  if(!state.active)return;
  if(voice)speak(step.say);
  const id=setTimeout(()=>{const el=document.querySelector(step.target);if(el){el.classList.add('rgc-guide-focus');el.scrollIntoView({behavior:'smooth',block:'center'});}},350);
  return()=>{clearTimeout(id);stopSpeaking();document.querySelectorAll('.rgc-guide-focus').forEach(el=>el.classList.remove('rgc-guide-focus'));};
 },[state.active,state.index,location.pathname,voice,step]);
 if(!state.active)return <ConversationGuide/>;
 return <section aria-label="Alexa guided walkthrough" className="fixed bottom-3 right-3 z-40 max-h-[65vh] w-[min(390px,calc(100vw-24px))] overflow-y-auto rounded-xl border border-primary bg-card p-4 shadow-2xl">
  <div className="flex items-center justify-between gap-3"><strong className="text-sm">Audio guide · {state.index+1}/{TOUR_STEPS.length}</strong><div className="flex gap-3"><button onClick={()=>setMinimized(v=>!v)} aria-label="Minimize guide">{minimized?'+':'−'}</button><button onClick={()=>{setState(s=>({...s,active:false}));stopSpeaking();}} aria-label="Close guide">×</button></div></div>
  {!minimized&&<><h2 className="mt-3 text-lg font-semibold">{step.title}</h2><p className="mt-2 text-sm leading-relaxed" aria-live="polite">{step.say}</p><p className="mt-2 text-xs text-muted-foreground">{speechSupported()?'Browser voice simulation.':'Audio is unavailable in this browser; follow the captions.'} Amazon Alexa connection is configured separately.</p><div className="mt-4 flex flex-wrap gap-2"><button className="rounded border px-3 py-2 text-sm" onClick={()=>speak(step.say)}>Repeat</button><button className="rounded border px-3 py-2 text-sm" onClick={()=>setVoice(v=>!v)}>{voice?'Pause narration':'Resume narration'}</button>{step.event==='continue'&&<button className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={()=>setState(s=>({...s,index:s.index+1}))}>Continue</button>}{location.pathname!==step.path&&<button className="rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" onClick={()=>navigate(step.path)}>Open this step</button>}<button className="rounded border px-3 py-2 text-sm" disabled={state.index===0} onClick={()=>setState(s=>({...s,index:Math.max(0,s.index-1)}))}>Back</button>{state.index===TOUR_STEPS.length-1?<button className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={()=>setState({active:false,index:0})}>Finish</button>:<button className="rounded border px-3 py-2 text-sm" onClick={()=>setState(s=>({...s,index:s.index+1}))}>Skip step</button>}</div><button className="mt-3 text-xs text-primary underline" onClick={downloadTour}>Export Alexa walkthrough content</button></>}
 </section>;
}