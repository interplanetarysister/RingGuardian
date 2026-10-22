import { spokenResponse } from './spokenResponse';
// Alexa-style spoken announcements for the demonstration, produced by the browser's own
// speech synthesiser. No Alexa skill is registered, no Echo device is paired, and no
// Amazon account is involved — the voice is the browser standing in for a device.

let currentUtterance = null;
let speechGeneration = 0;
// Shared persisted speed for recorded walkthroughs and conversational replies.
// New default requested for both guides; versioned key migrates the previous 1x setting.
const SPEED_KEY='rgc.guide.speed.v2';
export const DEFAULT_GUIDE_SPEED=1.3;
export function getGuideSpeed(){
  try { const n=Number(localStorage.getItem(SPEED_KEY));return Number.isFinite(n)&&n>=0.9&&n<=1.6?n:DEFAULT_GUIDE_SPEED; } catch { return DEFAULT_GUIDE_SPEED; }
}
export function setGuideSpeed(value){
  const speed=Math.max(0.9,Math.min(1.6,Number(value)||DEFAULT_GUIDE_SPEED));
  try {localStorage.setItem(SPEED_KEY,String(speed));}catch{}
  if(typeof window!=='undefined')window.dispatchEvent(new Event('rgc-guide-speed-change'));
  return speed;
}


export function speechSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/** English voices the browser exposes. Empty until the browser finishes loading them. */
export function listVoices() {
  if (!speechSupported()) return [];
  try {
    return window.speechSynthesis
      .getVoices()
      .filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    return [];
  }
}

// Prefer the warmest available natural English voice without claiming this is Alexa.
const VOICE_KEY = 'rgc.voice.preference.v1';
export const DEMO_VOICE_LABEL = 'Guardian · gentle feminine voice (device-dependent)';
export function getVoicePreference() {
  try { return localStorage.getItem(VOICE_KEY) || ''; } catch { return ''; }
}
export function setVoicePreference(name) {
  try { localStorage.setItem(VOICE_KEY, name || ''); } catch { /* private browsing */ }
}
function chooseVoice(voices, preferred = '') {
  const english = voices.filter(v => /^en([_-]|$)/i.test(v.lang || ''));
  const wanted = preferred || getVoicePreference();
  const exact = english.find(v => v.name === wanted);
  if (exact) return exact;
  const rank = v => {
    const n = (v.name || '').toLowerCase();
    let score = 0;
    if (/aria|jenny|ava|samantha|serena|susan|sara|emma|zira|female|woman|natural|neural|premium/i.test(n)) score += 30;
    if (/microsoft|google|apple/i.test(n)) score += 8;
    if (/en-us/i.test(v.lang || '')) score += 4;
    if (/compact|robot|espeak|male|david|mark/i.test(n)) score -= 25;
    if (v.localService) score += 2;
    return score;
  };
  return english.sort((a,b) => rank(b) - rank(a))[0] || null;
}

// Chrome leaves a fresh speech queue paused until it has been touched by a user gesture,
// and it can stay paused after a cancel(). Waking the queue on the first interaction is
// what lets the guide actually speak — including on a session restored from a reload.
function wake() {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.resume();
  } catch (err) {
    /* the queue will simply stay as it is */
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', wake, { once: true, capture: true });
  document.addEventListener('keydown', wake, { once: true, capture: true });
}

/** The short two-note alert an Echo plays before it speaks. */
export function chime() {
  try {
    const Ctx = window.AudioContext || window['webkitAudioContext'];
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = now + i * 0.14;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.14, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.13);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.14);
    });
    window.setTimeout(() => {
      try {
        ctx.close();
      } catch (err) {
        /* nothing to release */
      }
    }, 700);
  } catch (err) {
    /* audio is optional; speech still plays without the chime */
  }
}

export function stopSpeaking() {
  speechGeneration += 1;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('rgc-voice-stop'));
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    /* nothing to cancel */
  }
  currentUtterance = null;
}

/**
 * Speaks one announcement. Resolves true when the utterance finished, false when it was
 * cancelled, interrupted or unsupported — so a caller can stop a briefing cleanly.
 */
export function speak(text, options = {}) {
  const { rate = getGuideSpeed(), pitch = 1.03, voiceName = '', onStart, onEnd } = options;
  stopSpeaking();
  const generation = speechGeneration;
  return new Promise((resolve) => {
    if (!speechSupported() || !text) {
      if (onEnd) onEnd();
      resolve(false);
      return;
    }

    const synth = window.speechSynthesis;
    const speechText = spokenResponse(text);

    try {
      synth.cancel();
    } catch (err) {
      /* nothing to cancel */
    }
    currentUtterance = null;

    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      currentUtterance = null;
      if (onEnd && generation === speechGeneration) onEnd();
      resolve(ok);
    };

    const attempt = (round) => {
      if (settled || generation !== speechGeneration) { finish(false); return; }

      const utter = new SpeechSynthesisUtterance(speechText);
      utter.rate = Math.max(0.9,Math.min(1.6,rate));
      utter.pitch = Math.max(0.9,Math.min(1.15,pitch));
      utter.lang = 'en-US';

      try {
        const voices = synth.getVoices();
        const chosen = chooseVoice(voices, voiceName);
        if (chosen) utter.voice = chosen;
      } catch (err) {
        /* the browser picks a default voice */
      }

      let started = false;

      // If nothing is queued and nothing is playing shortly after speak(), the browser
      // silently dropped it. Retry once before giving up.
      const watchdog = window.setTimeout(() => {
        if (settled || generation !== speechGeneration || started) return;
        try {
          if (synth.speaking || synth.pending) return;
        } catch (err) {
          /* fall through to the retry */
        }
        if (round < 1) attempt(round + 1);
        else finish(false);
      }, 1500);

      utter.onstart = () => {
        started = true;
        window.clearTimeout(watchdog);
        if (onStart) onStart();
      };
      utter.onend = () => {
        window.clearTimeout(watchdog);
        finish(true);
      };
      utter.onerror = () => {
        window.clearTimeout(watchdog);
        if (!started && round < 1) attempt(round + 1);
        else finish(false);
      };

      currentUtterance = utter;

      // Chrome ignores a speak() issued in the same tick as cancel(), and stays silent
      // unless the queue is running — so resume immediately before handing it the text.
      window.setTimeout(() => {
        if (settled || generation !== speechGeneration) { finish(false); return; }
        try {
          synth.resume();
        } catch (err) {
          /* nothing to resume */
        }
        synth.speak(utter);
      }, 60);
    };

    window.setTimeout(() => attempt(0), 120);
  });
}