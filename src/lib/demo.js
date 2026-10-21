import { base44 } from '@/api/base44Client';
import { tourEvent } from '@/lib/tour';
import { clearCache } from '@/lib/cache';

const ID_KEY = 'rgc.session.id';
const TOKEN_KEY = 'rgc.session.token';

let seedPromise = null;

function makeSessionId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return 'rg' + Date.now().toString(36) + rand;
}

function makeToken() {
  try {
    return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '');
  } catch (err) {
    return 'demo' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}

export function sessionId() {
  try {
    const existing = window.localStorage.getItem(ID_KEY);
    if (existing && /^[A-Za-z0-9_-]{6,80}$/.test(existing)) return existing;
    const fresh = makeSessionId();
    window.localStorage.setItem(ID_KEY, fresh);
    return fresh;
  } catch (err) {
    return makeSessionId();
  }
}

export function demoToken() {
  try {
    const existing = window.localStorage.getItem(TOKEN_KEY);
    if (existing && existing.length >= 32) return existing;
    const fresh = makeToken();
    window.localStorage.setItem(TOKEN_KEY, fresh);
    return fresh;
  } catch (err) {
    return makeToken();
  }
}

/** Idempotent: seeding twice for the same session returns the existing dataset. */
export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = base44.functions
      .invoke('seedDemoSession', { demo_session_id: sessionId(), action: 'seed' })
      .then((res) => res.data)
      .catch((err) => {
        seedPromise = null;
        throw err;
      });
  }
  return seedPromise;
}

export async function resetDemo() {
  seedPromise = null;
  const res = await base44.functions.invoke('seedDemoSession', { demo_session_id: sessionId(), action: 'reset' });
  return res.data;
}

/** Every interactive control routes through here. Any write invalidates the read cache. */
export async function ops(payload) {
  const res = await base44.functions.invoke('demoOps', { demo_session_id: sessionId(), ...payload });
  if (res.data && res.data.ok !== false) { clearCache(); if(payload.action!=='runAiTracking')tourEvent('operation',{action:payload.action}); }
  return res.data;
}

export async function gateway(payload) {
  const res = await base44.functions.invoke('packagePiGateway', {
    demo_session_id: sessionId(),
    token: demoToken(),
    ...payload
  });
  if (res.data && res.data.ok !== false) clearCache();
  if (res.data?.ok !== false) tourEvent('operation',{action:'gateway'});
  return res.data;
}

export async function ring(payload) {
  const res = await base44.functions.invoke('ringIntegration', { demo_session_id: sessionId(), ...payload });
  return res.data;
}

export async function amazon(payload) {
  const res = await base44.functions.invoke('amazonIntegration', { demo_session_id: sessionId(), ...payload });
  return res.data;
}

export function scoped(query) {
  return { demo_session_id: sessionId(), ...query };
}