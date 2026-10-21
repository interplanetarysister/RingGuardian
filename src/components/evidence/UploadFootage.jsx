import React, { useRef, useState } from 'react';
import { Upload, Check, Loader2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ops } from '@/lib/demo';

export default function UploadFootage({ onUploaded, cameraId, facility }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setDone('');
    try {
      const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uploaded.file_uri, expires_in: 3600 });
      const registered = await ops({
        action: 'registerFootage',
        file_uri: uploaded.file_uri,
        title: file.name,
        camera_id: cameraId || 'CAM-2201',
        facility: facility || 'SEA3',
        description: 'Recording supplied by the demonstration operator. Not device footage from this scenario.'
      });
      if (!registered?.ok) throw new Error(registered?.error || 'The recording could not be registered.');
      setDone(file.name);
      if (onUploaded) onUploaded(registered.clip, signed.signed_url);
    } catch (err) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">Attach your own recording</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
            Video files are stored privately; the player requests a time-limited link. Use only footage you have the
            right to show.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/60 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {busy ? 'Uploading' : 'Choose file'}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
      {done ? (
        <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-tone-ok">
          <Check className="h-3 w-3" /> {done} attached to the evidence library.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 inline-flex items-start gap-1 text-[10px] text-tone-danger">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {error}
        </p>
      ) : null}
    </div>
  );
}