import {recordGuideAction} from '@/lib/guideProgress';
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, RotateCcw, Play, Database } from 'lucide-react';
import Sidebar from './Sidebar';
import DisclosureStrip from './DisclosureStrip';
import { ensureSeeded, resetDemo, sessionId } from '@/lib/demo';
import {getAppMode} from '@/lib/appMode';

export default function AppShell() {
  const [status, setStatus] = useState('preparing');
  const [mode, setMode] = useState('unknown');
  const [error, setError] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    getAppMode().then(async (next) => {
      if (!alive) return;
      setMode(next);
      if (next === 'demo') await ensureSeeded();
      if (alive) setStatus('ready');
    }).catch((err) => {
      if (!alive) return;
      setError(err?.message || 'Could not verify app mode. No demo data was loaded.');
      setStatus('error');
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setNavOpen(false);
    if (sessionStorage.getItem('rgc.role') !== 'management') return;
    const actions={'/dashboard':'dashboardOpened','/scanners':'scannersOpened','/evidence':'evidenceOpened','/investigations':'investigationsOpened'};
    const action=actions[location.pathname] || (location.pathname.startsWith('/packages/')?'packageOpened':null);
    if(action)recordGuideAction('management',action);
  }, [location.pathname]);

  async function handleReset() {
    setResetting(true);
    try {
      await resetDemo();
      window.location.reload();
    } catch (err) {
      setError(err?.message || 'Reset failed.');
      setResetting(false);
    }
  }

  if (status === 'preparing') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card">
          <Database className="h-5 w-5 animate-pulse text-primary" />
        </div>
        <div>
          <p className="font-heading text-sm font-semibold text-foreground">Preparing your demonstration dataset</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Loading five package scenarios, 31 scan events and 18 evidence windows.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="font-heading text-sm font-semibold text-foreground">The demonstration dataset could not be prepared</p>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    );
  }

  if (mode === 'demo' && sessionStorage.getItem('rgc.role') === 'customer') return (
    <div className="mx-auto max-w-xl p-6"><p className="rounded border p-4">This is the management evidence console. Choose Management view to open its fictional sample data.</p><Link className="mt-4 inline-block underline" to="/view/customer">Return to customer tour</Link></div>
  );

  if (mode === 'live') return (
    <div className="min-h-screen bg-background p-6"><div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Ring Guardian · Live setup</h1>
      <p className="rounded border p-4 text-sm">Simulation is off. No demo packages or recordings are shown. Real integrations require account authorization and working provider connections.</p>
      <div className="flex flex-wrap gap-3"><Link className="rounded border px-4 py-3" to="/view/customer">Customer setup and tips</Link><Link className="rounded border px-4 py-3" to="/view/management">Management setup and tips</Link><Link className="rounded border px-4 py-3" to="/admin">Admin portal</Link></div>
      <p className="text-sm text-muted-foreground">Do not enter private package data into the demo evidence console. Account-backed live storage and provider authorization must be enabled before this becomes a production system.</p>
    </div></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-border lg:block">
        <Sidebar />
      </aside>

      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[264px] border-r border-border shadow-2xl">
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex h-12 items-center gap-2 px-4 sm:px-6">
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground lg:hidden"
              aria-label="Toggle navigation"
            >
              {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <div className="ml-1 hidden items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-tone-ok" />
              <span className="text-[11px] font-medium text-foreground">Demo session</span>
              <span className="rgc-mono text-[10px] text-muted-foreground">{sessionId().slice(0, 10)}</span>
            </div>

            <div className="flex-1" />

            {sessionStorage.getItem('rgc.role') === 'management' && (
              <Link to="/view/management" className="rounded border border-primary px-3 py-2 text-xs font-semibold text-primary">
                Return to management walkthrough
              </Link>
            )}
            <Link
              to="/guided-demo"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Play className="h-3 w-3" strokeWidth={2.5} />
              Guided demo
            </Link>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <RotateCcw className={'h-3 w-3 ' + (resetting ? 'animate-spin' : '')} />
              <span className="hidden sm:inline">{resetting ? 'Resetting' : 'Reset demo'}</span>
            </button>
          </div>
          <DisclosureStrip />
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>

        <footer className="mx-auto w-full max-w-[1400px] px-4 pb-8 pt-2 sm:px-6">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Ring Guardian Cam · Package handling and evidence console. Not an Amazon or Ring
            product. No customer, employee or operational data is present. All times shown in US Pacific.
          </p>
        </footer>
      </div>
    </div>
  );
}