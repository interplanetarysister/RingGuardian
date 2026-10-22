import React, { useEffect, useRef, useState } from 'react';
import CustomerDoorbellStage from '@/components/evidence/CustomerDoorbellStage';
import { ring } from '@/lib/demo';

/**
 * Two explicit evidence sources:
 * - official authenticated Ring API/WebRTC live view (admin only)
 * - clearly labelled fictional eight-second scene illustration (no token)
 * The two are never represented as interchangeable recordings.
 */
export default function RingStreamPlayer({ deviceId, verified, trackingNumber, demoClip = null }) {
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const sessionRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [replay, setReplay] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!replay) return undefined;
    const started = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(8, (Date.now() - started) / 1000);
      setSeconds(t);
      if (t >= 8) setReplay(false);
    }, 100);
    return () => clearInterval(timer);
  }, [replay]);

  // Close streams when device changes or page unmounts.
  useEffect(() => () => {
    peerRef.current?.close();
    peerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [deviceId]);

  async function stop() {
    const url = sessionRef.current;
    sessionRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    if (url) await ring({ action: 'stopSession', session_url: url }).catch(() => {});
  }

  async function start() {
    if (!verified || !deviceId || busy) return;
    await stop();
    setBusy(true);
    setStreamError('');
    try {
      if (!window.RTCPeerConnection) throw new Error('This browser cannot play WebRTC streams.');
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerRef.current = peer;
      peer.addTransceiver('video', { direction: 'recvonly' });
      // Ring WHEP documentation: video only. Do not request or record audio.
      peer.ontrack = event => {
        if (!videoRef.current) return;
        if(event.track?.kind !== 'video')return;
        videoRef.current.srcObject = event.streams[0] || new MediaStream([event.track]);
        videoRef.current.play().catch(() => {});
        setStreaming(true);
      };
      peer.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) setStreaming(false);
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await new Promise(resolve => {
        if (peer.iceGatheringState === 'complete') return resolve();
        let resolved = false;
        const finish = () => { if (!resolved) { resolved = true; resolve(); } };
        peer.addEventListener('icegatheringstatechange', () => {
          if (peer.iceGatheringState === 'complete') finish();
        });
        setTimeout(finish, 3500);
      });
      const result = await ring({
        action: 'whepSession', device_id: deviceId,
        offer_sdp: peer.localDescription.sdp
      });
      if (!result?.ok || !result?.official_api_connection || !result?.answer_sdp || result.mode === 'simulated') {
        throw new Error(result?.error || 'An authenticated Ring WHEP answer was not returned.');
      }
      sessionRef.current = result.session_url || null;
      await peer.setRemoteDescription({ type: 'answer', sdp: result.answer_sdp });
    } catch (error) {
      peerRef.current?.close();
      peerRef.current = null;
      setStreaming(false);
      setStreamError(error?.message || 'The stream could not be started.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border-[3px] border-orange-500 bg-card p-4" aria-label="Ring video player">
      <h2 className="text-lg font-black">2. Watch your camera evidence</h2>
      <p className="text-sm text-muted-foreground">
        {trackingNumber ? 'Paired fictional demo package: ' + trackingNumber + '. ' : ''}
        The Ring API video and the package-specific illustration are separate sources. An unrelated stream is never assigned as proof of a selected shipment.
      </p>
      <div className="overflow-hidden rounded-xl border bg-black">
        <video ref={videoRef} playsInline autoPlay muted controls className={streaming ? 'block aspect-video w-full object-contain' : 'hidden'} aria-label="Authenticated Ring WebRTC live video" />
        {!streaming && (
          <div className="relative">
            {demoClip ? <CustomerDoorbellStage scene={demoClip.scene} clip={demoClip} progress={Math.min(1, seconds / 8)}/> :
              <div className="flex aspect-video items-center justify-center p-8 text-center text-sm text-slate-200">No doorstep event is associated with this package. An unrelated delivery is not shown as evidence.</div>}
            <div className="absolute left-2 top-2 rounded bg-black/80 px-2 py-1 text-xs font-black text-white">
              SCENARIO ILLUSTRATION — NOT CAMERA FOOTAGE
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={!demoClip} onClick={() => { setSeconds(0); setReplay(false); requestAnimationFrame(() => setReplay(true)); }}
          className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40">
          {replay ? 'Restart illustration' : 'Play matching scenario illustration'}
        </button>
        <button type="button" disabled={!verified || !deviceId || busy} onClick={start}
          className="rounded-lg border-2 border-teal-500 px-4 py-3 text-sm font-bold disabled:opacity-40">
          {busy ? 'Connecting…' : streaming ? 'Reconnect Ring' : 'Start official Ring live view'}
        </button>
        <button type="button" disabled={!streaming && !busy} onClick={stop}
          className="rounded-lg border px-4 py-3 text-sm font-bold disabled:opacity-40">Stop Ring stream</button>
      </div>
      <p role="status" className="text-xs font-semibold">
        {streaming ? 'Official Ring API WebRTC video currently playing.' : replay ? 'Playing the package-matched illustration.' : 'Scenario illustration is separate from Ring video. Live video requires successful authenticated device discovery.'}
        {replay ? ' ' + Math.floor(seconds) + '/8 seconds.' : ''}
      </p>
      {streamError && <p role="alert" className="rounded border border-red-500 p-3 text-sm text-red-400">{streamError}</p>}
      <p className="text-xs text-muted-foreground">
        Illustrations are not evidence from a camera. This application does not automatically assign a Ring livestream to a package, and it does not store genuine Ring footage.
      </p>
    </section>
  );
}