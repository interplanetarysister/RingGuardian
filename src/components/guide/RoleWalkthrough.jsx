import {guideSpeechCommand,GUIDE_COMMANDS_HELP} from '@/lib/guideSpeechCommands';
import {readGuideActions,clearGuideActions} from '@/lib/guideProgress';
import {roleGuide} from '@/lib/roleGuides';
import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {speak} from '@/lib/voice';
import {playGuideAudio,stopGuideAudio,pauseGuideAudio,resumeGuideAudio} from '@/lib/guideAudio';
import {conversationalAnswer,GUARDIAN_MODEL,GUARDIAN_PROVIDER,GUIDE_ENDPOINT} from '@/lib/conversationalGuide';

const FLOWS={
 customer:[
  {title:'1. Select Package — sunshine yellow',instruction:'Find the yellow Choose Delivery section. Choose a simulated delivery already linked to the demo Amazon, Ring and shipping accounts. An optional nickname helps you recognize it. Press Continue to compile details.',action:'I selected a package',path:null},
  {title:'2. Compile Details — orange-red',instruction:'In the orange-red Compile Details section, choose the problem and review the carrier-reported delivery window. Add an explanation if needed, then choose Continue to gather evidence.',action:'I compiled the details',path:null},
  {title:'3. Gather Evidence — turquoise teal',instruction:'In the teal Review Camera Evidence section, play the Ring-style fictional clip automatically paired with the selected tracking record. Decide whether to include the synthetic video, acknowledge that you reviewed it, then continue.',action:'I reviewed the evidence',path:null},
  {title:'4. Send the Report — grass green',instruction:'Read the green submission summary and press Submit Investigation and Selected Evidence. Check the management receipt after submission. The optional violet Other Carriers stage can import shipping notices and prepare a Word complaint and video ZIP for manual filing.',action:'I submitted the investigation',path:null}
 ],
 management:[
  {title:'1. Review Customer Reports — sunshine yellow',instruction:'In the yellow stage, review incoming fictional customer complaints and any synthetic Ring video received. Use I reviewed the incoming demo queue to unlock shipment review.',action:'I reviewed incoming reports',path:null},
  {title:'2. Follow Shipment — orange-red',instruction:'In the orange-red stage, open Hub overview or Package history, inspect the fictional shipment and return to Management. Then Continue to match camera evidence.',action:'I followed the shipment',path:'/packages'},
  {title:'3. Match Camera Evidence — turquoise teal',instruction:'In the teal stage, open both Scanner stations and Camera evidence to compare scan records and video timestamps. An empty interval is not proof that the delivery never happened.',action:'I checked scanners and video',path:'/evidence'},
  {title:'4. Review Investigation — grass green',instruction:'In the green stage, open Investigations, read the fictional findings and audit trail, and return. This is an investigation review, not an automatic package recovery.',action:'I reviewed the investigation',path:'/investigations'},
  {title:'5. More Management Tools — electric violet',instruction:'Explore the optional violet stage for the full operational demo, additional records, and follow-up tools. All management actions require authorized live permissions outside demo mode.',action:'I explored optional tools',path:'/guided-demo'}
 ]
};
function storeKey(role){return 'rgc.role-guide.v4.'+role}
function getSaved(role){try{let v=JSON.parse(sessionStorage.getItem(storeKey(role))||'null');return Number.isInteger(v?.index)?{index:Math.max(0,Math.min(FLOWS[role].length,v.index)),completed:v.completed||{},started:Boolean(v.started)}:null}catch{return null}}
export default function RoleWalkthrough({role}){
 const guide=roleGuide(role);
 const flow=FLOWS[role]||FLOWS.customer;
 const [progress,setProgress]=useState(()=>getSaved(role)||{index:0,completed:{},started:false});
 const [audio,setAudio]=useState(false),[textOnly,setTextOnly]=useState(true),[question,setQuestion]=useState(''),[reply,setReply]=useState(''),[engine,setEngine]=useState(''),[busy,setBusy]=useState(false),[health,setHealth]=useState('Not checked'),[listening,setListening]=useState(false);
 const recognition=useRef(null);
 const answerId=useRef(0);
 const historyRef=useRef([]);
 const [paused,setPaused]=useState(false);
 const [routeSuggestion,setRouteSuggestion]=useState(null);
 const [actions,setActions]=useState(()=>readGuideActions(role));
 const step=flow[Math.min(progress.index,flow.length-1)],finished=progress.index>=flow.length;
 const requirements=role==='customer'
  ? [['packageSelected'],['issueSelected'],['evidenceReviewed'],['reportSubmitted']]
  : [['complaintsReviewed'],['dashboardOpened','packageOpened'],['scannersOpened','evidenceOpened'],['investigationsOpened'],[]];
 const required=requirements[progress.index]||[];
 const verified=finished||!required.length||(role==='management'&&progress.index===1
    ? required.some(action=>actions.includes(action))
    : required.every(action=>actions.includes(action)));
 useEffect(()=>{sessionStorage.setItem(storeKey(role),JSON.stringify(progress))},[progress,role]);
 useEffect(()=>{const refresh=e=>{if(e.detail?.role===role)setActions(readGuideActions(role))};window.addEventListener('rgc-guide-action',refresh);return()=>window.removeEventListener('rgc-guide-action',refresh)},[role]);
 useEffect(()=>()=>{answerId.current += 1;stopGuideAudio();recognition.current?.stop?.()},[]);
 useEffect(()=>{let active=true;fetch(GUIDE_ENDPOINT+'/health').then(r=>r.json()).then(d=>{if(active)setHealth(d.ok&&d.inferenceEnabled?'Endpoint reports enabled':'Unavailable or disabled')}).catch(()=>{if(active)setHealth('Not reachable')});return()=>{active=false}},[]);
 function narrate(){if(finished)return;setPaused(false);setAudio(true);setTextOnly(false);playGuideAudio(role,progress.index,step.instruction)}
 function complete(){
 if(!verified){setReply('Try the action in the application first. You can also skip this step without marking it complete.');return}
 answerId.current += 1;setBusy(false);setPaused(false);stopGuideAudio();
 setProgress(p=>({started:true,index:Math.min(flow.length,p.index+1),completed:{...p.completed,[p.index]:true}}));setReply('');setRouteSuggestion(null);
}
 function skip(){
 answerId.current += 1;setBusy(false);setPaused(false);stopGuideAudio();
 setProgress(p=>({...p,index:Math.min(flow.length,p.index+1)}));
 setRouteSuggestion(null);setReply('Step skipped. No action was marked complete.');
}
 function back(){
 answerId.current+=1;setBusy(false);setPaused(false);stopGuideAudio();
 setProgress(p=>({...p,index:Math.max(0,p.index-1)}));setReply('');setRouteSuggestion(null);
}
 function begin(withAudio){
 setProgress(p=>({...p,started:true}));setAudio(withAudio);setTextOnly(!withAudio);setPaused(false);
 if(withAudio)narrate();
}
function restart(){
 answerId.current+=1;setBusy(false);setPaused(false);stopGuideAudio();
 clearGuideActions(role);setActions([]);historyRef.current=[];
 setProgress({index:0,completed:{},started:false});setReply('');setRouteSuggestion(null);
}
 async function ask(value){
 const q=String(value||question).trim();
 if(!q)return;
 setQuestion('');
 const intent=guideSpeechCommand(q);
 if(intent){
  if(intent==='stop'){answerId.current+=1;setBusy(false);stopGuideAudio();setPaused(false);setAudio(false);setTextOnly(true);setReply('Audio stopped. Written instructions remain available.');return}
  if(intent==='pause'){const result=pauseGuideAudio();setPaused(result);setReply(result?'Paused. Say resume to continue.':'There is no current audio to pause.');return}
  if(intent==='resume'){const result=await resumeGuideAudio();setPaused(false);setReply(result?'Resumed the current recording.':'No audio is paused. Choose Replay to hear this step.');return}
  if(intent==='repeat'){answerId.current+=1;setBusy(false);if(!finished)narrate();setReply(finished?'The walkthrough is finished.':'Repeating the current instruction.');return}
  if(intent==='skip'){if(!finished)skip();return}
  if(intent==='back'){back();return}
  if(intent==='start'){if(finished)restart();else begin(true);return}
  if(intent==='text'){answerId.current+=1;setBusy(false);stopGuideAudio();setPaused(false);setAudio(false);setTextOnly(true);setReply('Text-only mode is on. Instructions remain visible.');return}
  if(intent==='restart'){restart();return}
  if(intent==='context'){setReply(finished?'You have finished the walkthrough.':'You are on step '+(progress.index+1)+' of '+flow.length+': '+step.title+'. '+step.instruction);return}
  if(intent==='help'){setReply(GUIDE_COMMANDS_HELP);return}
 }
 if(busy)return;
 const id=++answerId.current;
 setBusy(true);setReply('');setRouteSuggestion(null);
 try{
  const answer=await conversationalAnswer(q,{useAI:true,path:step.path||('/view/'+role),history:historyRef.current,role,stepTitle:finished?'Walkthrough complete':step.title,instruction:finished?'The tour is complete.':step.instruction});
  if(id!==answerId.current)return;
  setReply(answer.reply);
  historyRef.current=[...historyRef.current,{role:'user',content:q.slice(0,300)},{role:'assistant',content:answer.reply.slice(0,350)}].slice(-4);
  const navigationAsked=/\b(where|navigate|find|go to|open|show me|take me|which page|which screen|how do i get)\b/i.test(q);
  setRouteSuggestion(navigationAsked && 'to' in answer && guide.routes.includes(answer.to)?answer.to:null);
  setEngine(answer.engine+(('provider' in answer && answer.provider)?' · '+answer.provider:'')+(('modelNotice' in answer && answer.modelNotice)?' · '+answer.modelNotice:''));
  if(audio){setPaused(false);stopGuideAudio();speak(answer.reply)}
 }catch{
  if(id===answerId.current)setReply('The assistant could not answer. You can follow the written step or try another question.');
 }finally{if(id===answerId.current)setBusy(false)}
}
 function listen(){
 const SpeechRecognition=window.SpeechRecognition||window['webkitSpeechRecognition'];
 if(!SpeechRecognition){setReply('Microphone input is unavailable in this browser. You can type a question or command instead.');return}
 try{
  recognition.current?.abort?.();
  // Prevent the assistant's own voice from being recognized as a user command.
  stopGuideAudio();setPaused(false);
  const r=new SpeechRecognition();recognition.current=r;
  r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;
  r.onresult=e=>{if(recognition.current!==r)return;const q=e.results?.[0]?.[0]?.transcript;if(q){setQuestion(q);ask(q)}};
  r.onerror=()=>{if(recognition.current===r){setListening(false);setReply('Microphone recognition failed. Type your question to continue.')}};
  r.onend=()=>{if(recognition.current===r){setListening(false);recognition.current=null}};
  setListening(true);r.start();
 }catch{setListening(false);setReply('Microphone could not start. Type your question to continue.')}
}
 return <section aria-label={role+' guided simulation'} className="rounded-xl border border-primary/40 bg-card p-5 space-y-4">
  <header><p className="text-xs font-semibold uppercase tracking-wide text-primary">Alexa-style guided simulation · {guide.name} · {guide.title}</p><h2 className="mt-1 text-xl font-bold">Interactive walkthrough</h2><p className="mt-1 text-sm text-muted-foreground">Fictional packages and safe practice actions. Walkthrough voice: {guide.voice}. Conversational replies use device speech where supported. This is not Amazon Alexa. Management selection does not grant access privileges.</p></header>
  <div className="text-xs rounded-lg border border-border p-3"><strong>Natural-language AI:</strong> {GUARDIAN_PROVIDER} · {GUARDIAN_MODEL} <span className="block mt-1">Endpoint: {health}. Inference runs only when you ask; the built-in guide responds if AI is unavailable. Browser speech recognition and narration are separate from the AI model.</span></div>
  {!progress.started?<div className="flex flex-wrap gap-2"><button className="rounded-lg bg-primary px-4 py-3 text-primary-foreground font-semibold" onClick={()=>begin(true)}>Start with audio</button><button className="rounded-lg border px-4 py-3" onClick={()=>begin(false)}>Start text-only</button><button className="rounded-lg border px-4 py-3" onClick={()=>{answerId.current++;stopGuideAudio();setProgress({index:flow.length,completed:{},started:true})}}>Skip tour</button></div>:finished?<div role="status" className="space-y-3"><p className="font-semibold">Walkthrough finished. You explored {role==='customer'?'the customer delivery-issue journey':'the management evidence and recovery journey'}.</p><button className="rounded border px-4 py-2" onClick={restart}>Restart walkthrough</button></div>:<>
   <div className="flex justify-between text-sm"><strong>Step {progress.index+1} of {flow.length}</strong><span>{Object.keys(progress.completed).length} actions acknowledged</span></div>
   <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{width:100*progress.index/flow.length+'%'}}/></div>
   <div className="rounded-lg border border-primary/30 p-4 space-y-3" aria-live="polite"><h3 className="text-lg font-semibold">{step.title}</h3><p className="text-sm leading-relaxed">{step.instruction}</p>{step.path?<Link to={step.path} className="inline-block rounded bg-primary px-4 py-2 text-primary-foreground font-semibold">Open the action screen →</Link>:<p className="text-xs text-muted-foreground">Use the interactive controls on this page, then confirm below.</p>}</div>
   <div className="flex flex-wrap gap-2"><button className="rounded border px-3 py-2 text-sm" onClick={narrate}>Replay {guide.name} narration</button><button className="rounded border px-3 py-2 text-sm" onClick={()=>ask('pause audio')}>Pause</button><button className="rounded border px-3 py-2 text-sm" disabled={!paused} onClick={()=>ask('resume audio')}>Resume</button><button className="rounded border px-3 py-2 text-sm" onClick={()=>ask('stop audio')}>Stop audio</button><button className="rounded border px-3 py-2 text-sm" aria-pressed={textOnly} onClick={()=>{if(textOnly)narrate();else ask('text only')}}>{textOnly?'Use audio':'Text only'}</button><button className="rounded border px-3 py-2 text-sm" disabled={progress.index===0} onClick={back}>Back</button></div>
   <div className="flex flex-wrap gap-2"><button className="rounded-lg bg-primary px-4 py-3 text-primary-foreground font-semibold disabled:opacity-40" disabled={!verified} onClick={complete}>{step.action} →</button><button className="rounded border px-4 py-3" onClick={skip}>Skip this step</button><button className="rounded border px-4 py-3" onClick={()=>{answerId.current+=1;setBusy(false);stopGuideAudio();setProgress(p=>({...p,started:false}))}}>Exit tour</button></div>
   <p role="status" className="text-xs text-muted-foreground">{verified?'Required demo interaction observed. You can continue.':'Complete the indicated on-screen action to enable Continue, or Skip to move on without claiming completion.'} The walkthrough does not confirm an external service action.</p>
  </>}
  <div className="border-t pt-4 space-y-2"><label htmlFor={'ask-'+role} className="block font-semibold text-sm">Ask {guide.name} in natural language</label><div className="flex flex-wrap gap-2"><input id={'ask-'+role} value={question} maxLength={500} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();ask()}}} placeholder="What should I do next?" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"/><button onClick={()=>ask()} disabled={busy||!question.trim()} className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy?'Answering…':'Ask'}</button><button onClick={listen} aria-pressed={listening} className="rounded border px-3 py-2">{listening?'Listening…':'Speak question'}</button></div>{reply&&<p role="status" className="rounded border p-3 text-sm">{reply}</p>}{routeSuggestion&&<Link to={routeSuggestion} className="inline-block rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={()=>stopGuideAudio()}>Open suggested screen →</Link>}<p className="text-xs text-muted-foreground">{GUIDE_COMMANDS_HELP}</p>{engine&&<p className="text-xs text-muted-foreground">Answer source: {engine}</p>}</div>
 </section>
}