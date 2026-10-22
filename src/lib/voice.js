// Alexa-style spoken announcements for the demonstration, produced by the browser's own
// speech synthesiser. No Alexa skill is registered, no Echo device is paired, and no
// Amazon account is involved — the voice is the browser standing in for a device.

let currentUtterance = null;

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
    const Ctx = window.AudioContext || window.webkitAudioContext;
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
  const { rate = 1, pitch = 1, voiceName = '', onStart, onEnd } = options;
  return new Promise((resolve) => {
    if (!speechSupported() || !text) {
      if (onEnd) onEnd();
      resolve(false);
      return;
    }

    const synth = window.speechSynthesis;

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
      if (onEnd) onEnd();
      resolve(ok);
    };

    const attempt = (round) => {
      if (settled) return;

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate;
      utter.pitch = pitch;
      utter.lang = 'en-US';

      try {
        const voices = synth.getVoices();
        const chosen = voiceName ? voices.find((v) => v.name === voiceName) : null;
        const english = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
        if (chosen) utter.voice = chosen;
        else if (english) utter.voice = english;
      } catch (err) {
        /* the browser picks a default voice */
      }

      let started = false;

      // If nothing is queued and nothing is playing shortly after speak(), the browser
      // silently dropped it. Retry once before giving up.
      const watchdog = window.setTimeout(() => {
        if (settled || started) return;
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
        if (settled) return;
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