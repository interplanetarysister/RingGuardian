import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, MessageCircle, Volume2 } from 'lucide-react';
import { conversationalAnswer } from '@/lib/conversationalGuide';
import { runPackageLookup } from '@/lib/alexaSimulation.mjs';
import { packageProfilePath } from '@/lib/packageLinks';
import { speak, stopSpeaking, speechSupported } from '@/lib/voice';

const EXAMPLES = [
  'Show all packages',
  'Where is package 5063?',
  'How do I report a missing delivery?',
  'What does Ring Guardian help with?'
];

// Uses actual fictional session records and route-aware conversational tools.
// The Alexa+ experience itself is simulated using browser text and optional speech.
export default function AlexaSimulatedExperience({ board }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [voice, setVoice] = useState(false);

  async function ask(text = question) {
    const asked = String(text || '').trim().slice(0, 500);
    if (!asked || busy) return;
    setQuestion(asked);
    setBusy(true);
    setError('');
    try {
      // Package questions use recorded data first instead of a generated guess.
      const toolResult = runPackageLookup(asked, board?.shipments || []);
      const answer = toolResult || await conversationalAnswer(asked, {
        path: '/alexa',
        role: 'management',
        useAI: true,
        tracking: ''
      });
      const reply = answer.reply || 'There is no answer available for that question.';
      const destination = answer.route || answer.to || '/packages';
      setResult({
        question: asked,
        reply,
        to: destination,
        tool: answer.tool || 'conversational_guide',
        engine: toolResult ? 'Simulated package-data tool' : (answer.engine || 'Guide'),
        modelNotice: answer.modelNotice || '',
        packages: answer.packages || []
      });
      if (voice && speechSupported()) {
        stopSpeaking();
        speak(reply);
      }
    } catch (err) {
      setError(err?.message || 'The simulation could not answer. Check the demo records and retry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Alexa+ simulated assistant" className="space-y-4 rounded-xl border-[3px] border-primary bg-card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <MessageCircle aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 text-primary" />
        <div className="min-w-0">
          <h2 className="text-xl font-black text-foreground">Ask the simulated Alexa+ package assistant</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask naturally, inspect a package status, and open the exact shipment record.
            Answers use fictional session data and conversational tools, with optional browser narration.
          </p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            SIMULATION ONLY · Not an authenticated Alexa or Ring account, camera, or live shipping feed.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Try a sample question">
        {EXAMPLES.map(example => (
          <button
            key={example}
            type="button"
            disabled={busy || !board}
            onClick={() => ask(example)}
            className="rounded-lg border-2 border-primary/35 px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
          >
            {example}
          </button>
        ))}
      </div>

      <form onSubmit={e => { e.preventDefault(); ask(); }} className="space-y-2">
        <label htmlFor="alexa-sim-question" className="text-sm font-bold">Ask your own question</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="alexa-sim-question"
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={500}
            placeholder="Where is package 5063?"
            className="min-w-0 flex-1 rounded-lg border-2 border-input bg-background p-3 text-base text-foreground"
          />
          <button
            type="submit"
            disabled={busy || !question.trim() || !board}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-black text-primary-foreground disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {busy ? 'Finding the answer…' : 'Ask'}
          </button>
        </div>
      </form>

      <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <input type="checkbox" checked={voice} disabled={!speechSupported()} onChange={e => { setVoice(e.target.checked); if (!e.target.checked) stopSpeaking(); }} />
        <Volume2 aria-hidden="true" className="h-4 w-4" /> Speak answers using this browser
      </label>

      {!board && <p role="status" className="text-sm text-muted-foreground">Loading fictional packages…</p>}
      {error && <p role="alert" className="rounded-lg border border-red-500 p-3 text-sm text-red-500">{error}</p>}
      {result && (
        <div className="space-y-3 rounded-xl border-2 border-primary/50 bg-background p-4" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Assistant response</p>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">{result.reply}</p>
          <p className="text-xs text-muted-foreground">Source: {result.engine} · {result.tool.replaceAll('_', ' ')}</p>
          {result.modelNotice && <p className="text-xs text-muted-foreground">{result.modelNotice}</p>}
          {result.packages.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {result.packages.map(item => (
                <li key={item.tracking_number}>
                  <Link
                    to={packageProfilePath(item.tracking_number)}
                    className="block rounded-lg border-2 border-border bg-card p-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <strong className="block break-words text-sm">{item.title}</strong>
                    <span className="mt-1 block break-all text-xs text-muted-foreground">{item.tracking_number}</span>
                    <span className="mt-1 block text-xs font-bold">Status: {item.status}</span>
                    <span className="mt-2 block text-sm font-bold text-primary">Open package profile →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to={result.to}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-primary px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10"
          >
            Open the referenced page <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
