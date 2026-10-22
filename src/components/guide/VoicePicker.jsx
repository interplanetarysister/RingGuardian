import React,{useEffect,useState} from 'react';
import {listVoices,getVoicePreference,setVoicePreference,speak,stopSpeaking,DEMO_VOICE_LABEL,getGuideSpeed,setGuideSpeed} from '@/lib/voice';
export default function VoicePicker(){
 const [voices,setVoices]=useState(()=>listVoices()),[selected,setSelected]=useState(()=>getVoicePreference()),[speed,setSpeed]=useState(()=>getGuideSpeed());
 useEffect(()=>{
  if(typeof window==='undefined'||!window.speechSynthesis)return;
  const refresh=()=>setVoices(listVoices());
  window.speechSynthesis.addEventListener?.('voiceschanged',refresh);
  const id=setTimeout(refresh,500);
  return()=>{clearTimeout(id);window.speechSynthesis.removeEventListener?.('voiceschanged',refresh);stopSpeaking()};
 },[]);
 return <section className="rounded-lg border border-border p-3 space-y-2" aria-label="Voice settings">
  <p className="text-sm font-semibold">{DEMO_VOICE_LABEL}</p>
  <p className="text-xs text-muted-foreground">Calm pace, gentle pitch. The voice selector changes conversational replies and updated customer walkthrough narration; management steps may use prerecorded narration. Available conversational voices vary by device. This is an Alexa-inspired simulation, not Amazon's Alexa voice.</p>
  <label className="block text-xs">Choose a voice
   <select className="mt-1 w-full rounded border bg-background p-2 text-sm" value={selected} onChange={e=>{stopSpeaking();setSelected(e.target.value);setVoicePreference(e.target.value)}} >
    <option value="">Automatic · best available warm English voice</option>
    {voices.map(v=><option key={v.voiceURI||v.name} value={v.name}>{v.name} ({v.lang})</option>)}
   </select>
  </label>
  <label className="block text-sm font-medium" htmlFor="guardian-speech-speed">Speech speed: {speed.toFixed(2)}×
   <input id="guardian-speech-speed" className="mt-2 w-full" aria-label="Speech speed" type="range" min="0.9" max="1.6" step="0.05" value={speed} onChange={e=>{const value=setGuideSpeed(e.target.value);setSpeed(value);stopSpeaking()}}/>
  </label>
  <div className="flex flex-wrap gap-2">{[1,1.3,1.45].map(value=><button key={value} type="button" aria-pressed={Math.abs(speed-value)<0.03} className={"rounded border px-3 py-1.5 text-xs "+(Math.abs(speed-value)<0.03?'bg-primary text-primary-foreground':'')} onClick={()=>{setSpeed(setGuideSpeed(value));stopSpeaking()}}>{value===1?'Normal':value===1.3?'Default':'Fast'} ({value}×)</button>)}</div>
  <div className="flex gap-2"><button className="rounded border px-3 py-2 text-sm" type="button" onClick={()=>speak('Hello. I’m Guardian. I’ll help you find your next step, and I’ll wait while you try it.')}>Preview voice</button><button type="button" className="rounded border px-3 py-2 text-sm" onClick={stopSpeaking}>Stop</button></div>
 </section>;
}