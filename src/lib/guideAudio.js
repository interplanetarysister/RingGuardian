import {speak, stopSpeaking, getGuideSpeed} from './voice';

let currentAudio = null;
let generation = 0;
let guidePaused = false;
// A browser-generated answer must silence prerecorded narration, and vice versa.
function stopRecordedAudio() {
  generation += 1;
  guidePaused = false;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio.load();
    currentAudio = null;
  }
}
if (typeof window !== 'undefined') window.addEventListener('rgc-voice-stop', stopRecordedAudio);

if (typeof window !== 'undefined') window.addEventListener('rgc-guide-speed-change', () => {
  if (currentAudio) currentAudio.playbackRate = getGuideSpeed();
});

export function stopGuideAudio() {
  stopRecordedAudio();
  stopSpeaking();
}

export async function playGuideAudio(role, index, transcript, fallback = true) {
  stopGuideAudio();
  const call = generation;
  // Customer recordings describe the superseded draft-only flow. Always narrate
  // the current step text instead, so a submission never gets called a draft.
  if (role === 'customer') return speak(transcript);
  const validRole = role === 'customer' || role === 'management';
  const maxIndex = role === 'customer' ? 3 : 4;
  if (!validRole || !Number.isInteger(index) || index < 0 || index > maxIndex) {
    return fallback ? speak(transcript) : false;
  }
  if (typeof Audio === 'undefined') return fallback ? speak(transcript) : false;
  const player = new Audio('/audio/amy/' + role + '-' + (index + 1) + '.wav');
  currentAudio = player;
  player.onended = () => { if(currentAudio===player){currentAudio=null;guidePaused=false;} };
  player.preload = 'auto';
  player.volume = 0.85;
  player.playbackRate = getGuideSpeed();
  player.preservesPitch = true;
  try {
    await player.play();
    guidePaused=false;
    if (call !== generation) {
      player.pause();
      return false;
    }
    return true;
  } catch {
    if (currentAudio === player) currentAudio = null;
    if (call !== generation) return false;
    return fallback ? speak(transcript) : false;
  }
}


// Pause preserves the current recording position; Stop cancels it entirely.
export function pauseGuideAudio() {
 if(currentAudio && !currentAudio.paused){ currentAudio.pause();guidePaused=true;return true; }
 if(typeof window!=='undefined' && window.speechSynthesis?.speaking) {
  window.speechSynthesis.pause();guidePaused=true;return true;
 }
 return false;
}
export async function resumeGuideAudio() {
 if(!guidePaused)return false;
 if(currentAudio){
  try{await currentAudio.play();guidePaused=false;return true;}catch{return false;}
 }
 if(typeof window!=='undefined' && window.speechSynthesis?.paused){
  window.speechSynthesis.resume();guidePaused=false;return true;
 }
 guidePaused=false;
 return false;
}