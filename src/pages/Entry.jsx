import React,{useEffect,useRef,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Package,Building2,PlayCircle,ShieldCheck,Settings2,ArrowRight} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {getAppMode,setAppMode} from '@/lib/appMode';
import ThemeToggle from '@/components/layout/ThemeToggle';
import {stopGuideAudio} from '@/lib/guideAudio';
import {getGuideSpeed} from '@/lib/voice';
export default function Entry(){
 const [mode,setMode]=useState('loading'),[admin,setAdmin]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const navigate=useNavigate();
 const [introPlaying,setIntroPlaying]=useState(false);
 const introRef=useRef(null);
 useEffect(()=>()=>{window.speechSynthesis?.cancel();introRef.current=null},[]);
 function playIntro(){stopGuideAudio();window.speechSynthesis?.cancel();if(!window.speechSynthesis){setIntroPlaying(false);return;}const voice=new SpeechSynthesisUtterance('Welcome to Ring Guardian. Choose Customer to review a delivery, compare matching evidence and report an issue. Choose Management to trace a package and investigate discrepancies. All sample scenarios are clearly identified.');voice.rate=getGuideSpeed();voice.onend=()=>setIntroPlaying(false);voice.onerror=()=>setIntroPlaying(false);introRef.current=voice;setIntroPlaying(true);window.speechSynthesis.speak(voice);}
 function stopIntro(){window.speechSynthesis?.cancel();introRef.current=null;setIntroPlaying(false)}
 useEffect(()=>{let alive=true;Promise.all([getAppMode(),base44.auth.me().catch(()=>null)]).then(([m,u])=>{if(alive){setMode(m);setAdmin(u?.role==='admin');}}).catch(()=>{if(alive){setMode('unknown');setError('Could not read the current demonstration mode.');}});return()=>{alive=false}},[]);
 async function change(next){if(!admin)return;setBusy(true);setError('');try{setMode(await setAppMode(next));}catch(e){setError(e?.message||'Could not change demo mode.');}finally{setBusy(false)}}
 function enter(role){stopIntro();try{sessionStorage.setItem('rgc.role',role);}catch{}navigate(role==='customer'?'/view/customer':'/view/management');}
 return <div className="min-h-screen bg-background text-foreground">
  <header className="border-b border-border"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><div className="flex items-center gap-3"><span className="rounded-lg bg-primary p-2 text-primary-foreground"><ShieldCheck size={21}/></span><div><strong className="block text-base">Ring Guardian</strong><span className="text-xs text-muted-foreground">Package accountability & evidence</span></div></div><ThemeToggle/></div></header>
  <main className="mx-auto max-w-4xl px-5 py-9 sm:py-14">
    <div className="mb-8 text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Welcome</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">How would you like to enter?</h1><p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">Explore how Ring Guardian helps explain uncertain deliveries with package scans and simulated camera evidence.</p></div>
    <section className="mb-6 rounded-xl border border-primary/40 bg-card p-5" aria-label="Welcome story">
      <p className="text-xs font-semibold uppercase text-primary">Why Ring Guardian matters</p>
      <p className="mt-2 text-sm leading-relaxed">Security.org’s 2025 report estimated 37 million U.S. packages stolen annually. Tracking updates alone do not always explain what happened. Ring Guardian demonstrates how shipment scans and camera evidence can help teams investigate delivery issues and help customers understand their options.</p>
      <p className="mt-2 text-xs text-muted-foreground">Source: Security.org, 2025 Package Theft Report (survey-based estimate of theft, not all lost shipments). This demo uses fictional package records and does not guarantee recovery, refunds or replacement.</p>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={introPlaying?stopIntro:playIntro}>{introPlaying?'Stop introduction':'Listen to the introduction'}</button><a href="https://www.security.org/package-theft/annual-report/" target="_blank" rel="noreferrer" className="rounded border px-4 py-2 text-sm">Research source</a></div>
      <p className="mt-3 font-semibold">Ready to explore? Start with Customer or Management.</p>
    </section>
    <section className="mb-6 rounded-xl border border-border bg-card p-5" aria-label="Demo control">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><PlayCircle size={20} className="text-primary"/><h2 className="font-semibold">Demo mode</h2></div><p className="mt-1 text-sm text-muted-foreground">{mode==='demo'?'ON — fictional packages and guided demonstrations are enabled.':mode==='live'?'OFF — real-service setup only; demo records are hidden.':'Checking demo settings…'}</p></div>
      <div className="flex gap-2" role="group" aria-label="Demo on or off"><button type="button" disabled={!admin||busy||mode==='loading'||mode==='unknown'} onClick={()=>change('demo')} aria-pressed={mode==='demo'} className={'rounded-lg border px-5 py-3 text-sm font-semibold disabled:opacity-50 '+(mode==='demo'?'bg-primary text-primary-foreground':'bg-background')}>Demo on</button><button type="button" disabled={!admin||busy||mode==='loading'||mode==='unknown'} onClick={()=>change('live')} aria-pressed={mode==='live'} className={'rounded-lg border px-5 py-3 text-sm font-semibold disabled:opacity-50 '+(mode==='live'?'bg-primary text-primary-foreground':'bg-background')}>Demo off</button></div></div>
      {!admin&&<p className="mt-3 text-xs text-muted-foreground"><Settings2 size={13} className="mr-1 inline"/> Only a signed-in administrator can change the global demo switch. <Link to="/admin" className="font-semibold text-primary underline">Admin sign-in and controls</Link>.</p>}
      {error&&<p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
    </section>
    <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-xl border border-border bg-card p-6"><Package size={30} className="text-primary"/><h2 className="mt-4 text-xl font-semibold">Enter as Customer</h2><p className="mt-2 min-h-20 text-sm text-muted-foreground">Follow your own deliveries, explore package status, and learn how to review missing or incorrect delivery evidence. No management information is shown.</p><button type="button" onClick={()=>enter('customer')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground">Enter Customer <ArrowRight size={18}/></button></section>
    <section className="rounded-xl border border-border bg-card p-6"><Building2 size={30} className="text-primary"/><h2 className="mt-4 text-xl font-semibold">Enter as Management</h2><p className="mt-2 min-h-20 text-sm text-muted-foreground">Explore shipment operations, scans, evidence, exception handling and recovery workflows. Real management actions require authorized sign-in.</p><button type="button" onClick={()=>enter('management')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 font-semibold">Enter Management <ArrowRight size={18}/></button></section></div>
    <section className="mt-6 rounded-xl border-[3px] border-violet-500 bg-card p-5">
      <h2 className="text-lg font-black">Ring camera integration and package investigation</h2>
      <p className="mt-2 text-sm">Explore how Ring Guardian links package details to camera evidence. Connect an authorized Ring source or review a clearly labelled illustrative scenario, then complete a delivery investigation.</p>
      <Link to="/ring" className="mt-3 block rounded-lg bg-violet-600 px-5 py-3 text-center text-sm font-black text-white">Explore Ring camera integration →</Link>
      <p className="mt-2 text-xs text-muted-foreground">Scenario illustrations are available without Ring hardware or a token. Genuine Ring API testing requires a signed-in administrator.</p>
    </section>
    <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-sm"><Link className="text-primary underline" to="/overview">About Ring Guardian</Link><Link className="text-primary underline" to="/admin">Administrator controls</Link>{mode==='demo'&&<Link className="text-primary underline" to="/live-events">Open simulated events</Link>}</div>
    <p className="mt-7 text-center text-xs text-muted-foreground">Role selection changes the tour, not account privileges. No real camera or delivery account is connected automatically.</p>
  </main></div>
}