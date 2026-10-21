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

/** The short two-note alert an Echo plays before it speaks. */
export function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
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
    stopSpeaking();

    // Chrome ignores a speak() issued in the same tick as cancel().
    window.setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate;
      utter.pitch = pitch;

      try {
        const voices = synth.getVoices();
        const chosen = voiceName ? voices.find((v) => v.name === voiceName) : null;
        const fallback = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
        if (chosen) utter.voice = chosen;
        else if (fallback) utter.voice = fallback;
      } catch (err) {
        /* the browser picks a default voice */
      }

      utter.onend = () => {
        currentUtterance = null;
        if (onEnd) onEnd();
        resolve(true);
      };
      utter.onerror = () => {
        currentUtterance = null;
        if (onEnd) onEnd();
        resolve(false);
      };

      currentUtterance = utter;
      if (onStart) onStart();
      synth.speak(utter);
    }, 120);
  });
}