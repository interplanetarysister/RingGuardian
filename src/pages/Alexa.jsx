import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ListMusic, Loader2, AlertTriangle, Check } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import AlexaDevice from '@/components/alexa/AlexaDevice';
import AnnouncementRow from '@/components/alexa/AnnouncementRow';
import { loadBoard } from '@/lib/board';
import { buildAnnouncements } from '@/lib/announcements';
import { chime, listVoices, speak, speechSupported, stopSpeaking } from '@/lib/voice';

export default function Alexa() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState(1);
  const [currentKey, setCurrentKey] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [briefing, setBriefing] = useState(false);
  const [audioStatus, setAudioStatus] = useState('Tap Enable voice to confirm your browser can speak.');
  const [mcpState, setMcpState] = useState('Not tested');
  const [mcpPackages, setMcpPackages] = useState([]);
  const [mcpMessage, setMcpMessage] = useState('');
  // Browser speech demo and MCP demonstration are not an authorized Alexa+ device integration.
  const MCP_URL = 'https://ring-guardian-alexa-mcp.interplanetary-fund.workers.dev/mcp';
  async function connectMcp() {
    setMcpState('Connecting'); setMcpMessage('');
    try {
      async function call(id, method, params = {}) {
        const res = await fetch(MCP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25' }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
        if (!res.ok) throw new Error('MCP returned HTTP ' + res.status);
        const body = await res.json();
        if (body.error) throw new Error(body.error.message);
        return body.result;
      }
      const handshake = await call(1, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'ring-guardian-web', version: '1.0.0' } });
      if (handshake.protocolVersion !== '2025-11-25') throw new Error('MCP protocol mismatch');
      const discovered = await call(2, 'tools/list');
      if (!discovered.tools?.some(t => t.name === 'list_demo_packages')) throw new Error('Package tool missing');
      const result = await call(3, 'tools/call', { name: 'list_demo_packages', arguments: {} });
      const packages = JSON.parse(result.content?.find(c => c.type === 'text')?.text || '[]');
      if (!Array.isArray(packages) || packages.length !== 5) throw new Error('Expected five demo packages');
      setMcpPackages(packages); setMcpState('Connected — fictional demo');
      setMcpMessage('Live MCP handshake, discovery and five package retrieval succeeded. Not Amazon Alexa authentication or Ring camera connectivity.');
    } catch(err) { setMcpState('Connection failed'); setMcpMessage(err.message || String(err)); }
  }
  const stopRef = useRef(true);

  const supported = speechSupported();

  useEffect(() => {
    let alive = true;
    loadBoard()
      .then((data) => {
        if (alive) setBoard(data);
      })
      .catch((err) => {
        if (alive) setError(err?.message || 'The demonstration dataset could not be loaded.');
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!supported) return undefined;
    const sync = () => setVoices(listVoices());
    sync();
    window.speechSynthesis.addEventListener('voiceschanged', sync);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', sync);
      stopRef.current = true;
      stopSpeaking();
    };
  }, [supported]);

  const announcements = useMemo(() => (board ? buildAnnouncements(board) : []), [board]);
  const current = announcements.find((a) => a.key === currentKey) || null;

  async function playOne(item) {
    setAudioStatus('Starting package narration…');
    stopRef.current = true;
    setBriefing(false);
    setCurrentKey(item.key);
    chime();
    await speak(item.spoken, {
      rate,
      voiceName,
      onStart: () => {setSpeaking(true);setAudioStatus('Voice playback started for package '+item.tracking);},
      onEnd: () => setSpeaking(false)
    }).then(ok=>{if(!ok)setAudioStatus('Speech did not start. Check device media volume and browser text-to-speech settings.');});
  }

  async function playBriefing() {
    if (announcements.length === 0) return;
    stopRef.current = false;
    setBriefing(true);
    chime();
    for (const item of announcements) {
      if (stopRef.current) break;
      setCurrentKey(item.key);
      const finished = await speak(item.spoken, {
        rate,
        voiceName,
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false)
      });
      if (!finished && !supported) break;
    }
    setBriefing(false);
    setSpeaking(false);
    if (!stopRef.current) setCurrentKey('');
    stopRef.current = true;
  }

  function stop() {
    stopRef.current = true;
    setBriefing(false);
    stopSpeaking();
    setSpeaking(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Alexa voice announcements</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            The hands-free surface of the console: an investigator hears a custody anomaly without opening a screen.
            Announcements are generated from the stored package records, so the words always match the data.
          </p>
        </div>
        <StatusPill
          tone={supported ? (speaking ? 'ok' : 'info') : 'warn'}
          label={supported ? (speaking ? 'Speaking' : 'Voice ready') : 'Voice unavailable'}
        />
      </div>

      {!supported ? (
        <div className="flex items-start gap-2 rounded-md border border-tone-warn/40 bg-tone-warn/10 p-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tone-warn" />
          <p className="text-[11px] leading-relaxed text-foreground">
            This browser does not expose speech synthesis, so no audio can play. The announcement text below is still
            generated from the live records.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-tone-danger/40 bg-tone-danger/10 p-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tone-danger" />
          <p className="text-[11px] text-foreground">{error}</p>
        </div>
      ) : null}

      <div role="status" className="rounded-md border border-border bg-card p-3 text-xs leading-relaxed text-foreground">
        <strong>Integration evidence:</strong> This page plays browser-generated speech, not audio from an authenticated Alexa device.
        The separate Alexa+ MCP endpoint implements simulated package lookup, location, evidence, and walkthrough tools.
        Live Alexa+ developer registration, account authorization, and official client invocation remain unverified until tested in the Amazon developer environment.
      </div>

      <div className="rounded-md border border-border bg-card p-3 space-y-2" aria-live="polite">
        <h2 className="font-semibold text-sm">Live Alexa+ MCP demonstration connection</h2>
        <p className="text-xs">Status: {mcpState}. Uses scripted fictional packages only. No actual Echo or Ring pairing.</p>
        <button type="button" className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground" onClick={connectMcp}>Connect and verify MCP</button>
        {mcpMessage && <p className="text-xs">{mcpMessage}</p>}
        {mcpPackages.length > 0 && <ul className="text-xs space-y-1">{mcpPackages.map(p => <li key={p.package_id}>{p.package_id} · {p.scenario} · {p.status} (simulated)</li>)}</ul>}
      </div>
      <section className="rounded-lg border-2 border-primary bg-card p-4" aria-label="Audio readiness"><h2 className="font-semibold">Voice for the walkthrough video</h2><p role="status" className="mt-2 text-sm">{audioStatus}</p><button type="button" disabled={!supported||!announcements.length} onClick={()=>playOne(announcements[0])} className="mt-3 rounded bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">Enable voice and hear the first package</button><p className="mt-2 text-xs text-muted-foreground">This is browser speech using the current package record, not audio streamed from an Echo or the official Alexa service. Record with device media sound enabled.</p></section>
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <Panel title="Device" subtitle="Browser speech standing in for an Echo device">
            <AlexaDevice
              speaking={speaking}
              text={current ? current.spoken : ''}
              label="Echo Show 8 · warehouse ops (simulated)"
              onStop={stop}
            />
          </Panel>

          <Panel title="Delivery of the briefing" subtitle="Reads every announcement in order">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={playBriefing}
                disabled={!supported || announcements.length === 0 || briefing}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {briefing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListMusic className="h-3 w-3" />}
                {briefing ? 'Speaking briefing' : 'Play full briefing'}
              </button>
              <button
                type="button"
                onClick={stop}
                disabled={!speaking && !briefing}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50 disabled:opacity-40"
              >
                Stop
              </button>
            </div>

            <div className="mt-3 space-y-2.5 border-t border-border pt-3">
              <div>
                <label htmlFor="alexa-voice" className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Voice
                </label>
                <select
                  id="alexa-voice"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-[11px] text-foreground"
                >
                  <option value="">Browser default</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="alexa-rate" className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Speaking rate · {rate.toFixed(2)}×
                </label>
                <input
                  id="alexa-rate"
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="mt-1.5 w-full accent-primary"
                />
              </div>
            </div>
          </Panel>
        </div>

        <Panel
          title="Announcement queue"
          subtitle={board ? announcements.length + ' announcements derived from the five scenarios' : 'Building from the records'}
          dense
        >
          {!board ? (
            <div className="space-y-2 p-4">
              <div className="h-14 animate-pulse rounded bg-muted/50" />
              <div className="h-14 animate-pulse rounded bg-muted/50" />
              <div className="h-14 animate-pulse rounded bg-muted/50" />
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {announcements.map((item) => (
                <AnnouncementRow
                  key={item.key}
                  item={item}
                  active={item.key === currentKey}
                  speaking={speaking}
                  disabled={!supported || briefing}
                  onPlay={playOne}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="What this is, precisely">
        <ul className="space-y-2">
          {[
            'The words are generated from the stored scan events, cases and package records — not scripted separately.',
            'The audio is produced by the browser’s built-in speech synthesiser. No Alexa skill is registered and no Echo device is paired.',
            'An Alexa skill would receive these same announcements through a custom-skill or Smart Home directive; that registration is outside this build.'
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-tone-ok" />
              {t}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}