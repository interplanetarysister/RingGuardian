import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Maximize2, RotateCcw, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SceneStage from './SceneStage';
import CustomerDoorbellStage from './CustomerDoorbellStage';
import {sourceOffsetAtPlayback,activeWindowMotion} from '../../../base44/shared/doorbellWindowMotion.js';
import { speak } from '@/lib/voice';
import StatusPill from '@/components/common/StatusPill';
import { formatClock, formatDateTime, clockString } from '@/lib/format';
import { TONE } from '@/lib/status';

function MarkerTrack({ duration, position, markers, onSeek }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function positionFrom(clientX) {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  function handlePointerDown(e) {
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onSeek(positionFrom(e.clientX));
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    onSeek(positionFrom(e.clientX));
  }

  function handlePointerUp(e) {
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        role="slider"
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(position)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onSeek(Math.min(duration, position + 1));
          if (e.key === 'ArrowLeft') onSeek(Math.max(0, position - 1));
          if (e.key === ' ') onSeek(position);
        }}
        className="relative h-9 cursor-pointer touch-none"
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary/70" style={{ width: pct + '%' }} />
        </div>

        {markers.map((m, i) => {
          const left = duration > 0 ? Math.min(100, Math.max(0, (m.seconds / duration) * 100)) : 0;
          const tone = TONE[m.tone] || TONE.info;
          return (
            <button
              key={m.key || i}
              type="button"
              title={m.label + ' · ' + clockString(m.seconds)}
              onPointerDown={(e) => {
                e.stopPropagation();
                onSeek(m.seconds);
              }}
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: left + '%' }}
              aria-label={'Jump to ' + m.label}
            >
              <span className={'block h-3 w-[3px] rounded-full ' + tone.bar} />
              <span className="absolute left-1/2 top-4 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-foreground/70" />
            </button>
          );
        })}

        <div
          className="pointer-events-none absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow"
          style={{ left: pct + '%' }}
        />
      </div>
    </div>
  );
}

export default function EvidencePlayer({
  clip,
  markers = [],
  initialPosition = 0,
  trackingNumber = null,
  cameraId = null,
  eventTime = null,
  syncNote = null,
  height = 'md'
}) {
  const duration = clip?.duration_seconds || 14;
  const [position, setPosition] = useState(Math.min(duration, Math.max(0, initialPosition)));
  const [playing, setPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [signing, setSigning] = useState(false);
  const [mediaError,setMediaError]=useState('');
  const frameRef = useRef(null);
  const rafRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    setPosition(Math.min(duration, Math.max(0, initialPosition)));
    setPlaying(false);
    setMediaError('');
  }, [clip?.clip_key, initialPosition, duration]);

  useEffect(() => {
    let alive = true;
    async function resolveSource() {
      if (!clip || clip.evidence_kind !== 'video_file' || !clip.clip_url) {
        setVideoSrc('');
        return;
      }
      if (clip.clip_url.startsWith('http')) {
        setVideoSrc(clip.clip_url);
        return;
      }
      setSigning(true);
      try {
        const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: clip.clip_url, expires_in: 3600 });
        if (alive) setVideoSrc(res.signed_url);
      } catch (err) {
        if (alive) setVideoSrc('');
      } finally {
        if (alive) setSigning(false);
      }
    }
    resolveSource();
    return () => {
      alive = false;
    };
  }, [clip?.clip_key, clip?.clip_url, clip?.evidence_kind]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return undefined;
    }
    if (videoSrc) return undefined;
    let last = performance.now();
    const tick = (now) => {
      const delta = (now - last) / 1000;
      last = now;
      setPosition((prev) => {
        const next = prev + delta;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, duration, videoSrc]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;
    if (Math.abs((v.currentTime || 0) - position) > 0.45) v.currentTime = position;
    if (playing) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [playing, videoSrc, position]);

  const progress = duration > 0 ? position / duration : 0;
  const currentSourceMs=clip?.window_compressed && Number.isFinite(Date.parse(clip?.source_window_start||'')) && Number.isFinite(Date.parse(clip?.source_window_end||''))
    ? Date.parse(clip.source_window_start) + sourceOffsetAtPlayback(clip.motion_events,position)*1000
    : Date.parse(clip?.recorded_start||'') + position*1000;
  const currentSourceTime=Number.isFinite(currentSourceMs)?new Date(currentSourceMs).toISOString():null;
  const visibleMotion=clip?.window_compressed?activeWindowMotion(clip?.motion_events,position):null;
  const sourceLabel = clip?.source_label || 'Generated scene reconstruction — not device footage';
  const isReconstruction = !videoSrc;

  const heightClass = useMemo(() => {
    if (height === 'sm') return 'max-h-[240px]';
    if (height === 'lg') return 'max-h-[460px]';
    return 'max-h-[360px]';
  }, [height]);

  async function toggleFullscreen() {
    const el = frameRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch (err) {
      /* fullscreen can be blocked by the embedding context; playback still works */
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div ref={frameRef} className="relative bg-[#05090f]">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            playsInline
            className="block w-full"
            onError={()=>{setMediaError('This uploaded recording could not be played. Check its format or attach it again.');setPlaying(false);}}
            onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
            onEnded={() => setPlaying(false)}
          />
        ) : clip && clip.evidence_kind === 'scene_reconstruction' ? (
          <div className={heightClass}>
            {String(clip?.scene || '').startsWith('doorbell_') ? <CustomerDoorbellStage scene={clip.scene} progress={progress} clip={clip} className="h-full" /> : <SceneStage scene={clip?.scene} progress={progress} className="h-full" />}
          </div>
        ) : null}
        {visibleMotion&&<span className="pointer-events-none absolute bottom-2 left-2 max-w-[90%] rounded bg-black/85 px-2 py-1 text-xs font-bold text-amber-100">SIMULATED MOTION · {visibleMotion.label}</span>}
        {mediaError && <p role="alert" className="p-4 text-sm text-red-300">{mediaError}</p>}
        {clip && clip.evidence_kind !== 'scene_reconstruction' && !videoSrc && !signing && <p role="alert" className="p-4 text-sm text-red-300">Recording unavailable. No replacement scene is being presented as this recording.</p>}

        {!clip ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <AlertTriangle className="h-5 w-5 text-tone-warn" />
            <p className="text-sm font-medium text-foreground">No recording is available for this event</p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              {syncNote || 'The scan is recorded, but no capture window covers this timestamp.'}
            </p>
          </div>
        ) : null}

        {clip ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
            <div className="flex items-center gap-1.5 rounded bg-background/80 px-1.5 py-1 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-tone-danger" />
              <span className="rgc-mono text-[10px] font-medium text-foreground">{currentSourceTime?formatDateTime(currentSourceTime):'SIMULATED EVENT'}</span>
            </div>
            <div className="rounded bg-background/80 px-1.5 py-1 backdrop-blur">
              <span className="rgc-mono text-[10px] text-muted-foreground">{cameraId || clip.camera_id}</span>
            </div>
          </div>
        ) : null}
      </div>

      {clip ? (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <MarkerTrack
            duration={duration}
            position={position}
            markers={markers}
            onSeek={(v) => {
              setPlaying(false);
              setPosition(v);
            }}
          />

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button type="button" className="rounded border px-2 py-2 text-xs" onClick={()=>speak(clip.description || clip.title || sourceLabel)}>Read description</button>
            <button
              type="button"
              onClick={() => {
                if (position >= duration) setPosition(0);
                setPlaying((p) => !p);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setPosition(0);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              aria-label="Restart"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <div className="rgc-mono flex items-baseline gap-1 text-[11px]">
              <span className="text-foreground">{clockString(position)}</span>
              <span className="text-muted-foreground">/ {clockString(duration)}</span>
            </div>

            {markers.length > 0 ? (
              <div className="ml-1 hidden items-center gap-1 sm:flex">
                {markers.slice(0, 4).map((m, i) => (
                  <button
                    key={m.key || i}
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setPosition(m.seconds);
                    }}
                    className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex-1" />

            <span className="rgc-mono hidden text-[10px] text-muted-foreground sm:inline">
              {currentSourceTime?formatClock(currentSourceTime):'—'} PT
            </span>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
            <StatusPill
              tone={isReconstruction ? 'warn' : 'ok'}
              label={isReconstruction ? (String(clip?.scene || '').startsWith('doorbell_') ? 'Simulated doorbell video' : 'Scene reconstruction') : 'Recording attached'}
              dot={false}
            />
            <span className="text-[10px] text-muted-foreground">{signing ? 'Preparing recording…' : sourceLabel}</span>
          </div>

          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] sm:grid-cols-4">
            <div>
              <dt className="uppercase tracking-wide text-muted-foreground">Package</dt>
              <dd className="rgc-mono truncate text-foreground">{trackingNumber || '—'}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-muted-foreground">Camera</dt>
              <dd className="rgc-mono truncate text-foreground">{cameraId || clip.camera_id || '—'}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-muted-foreground">Capture window</dt>
              <dd className="rgc-mono truncate text-foreground">
                {clip.window_compressed?formatClock(clip.source_window_start)+'–'+formatClock(clip.source_window_end):formatClock(clip.recorded_start, 0)+'–'+formatClock(clip.recorded_start, duration)}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-muted-foreground">Facility</dt>
              <dd className="truncate text-foreground">{clip.facility || '—'}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}