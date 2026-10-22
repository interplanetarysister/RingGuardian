import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {getAppMode,setAppMode} from '@/lib/appMode';
export default function AdminPortal(){
 const [user,setUser]=useState(null),[mode,setMode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{Promise.all([base44.auth.me().catch(()=>null),getAppMode()]).then(([u,m])=>{setUser(u);setMode(m);setReady(true)}).catch(()=>{setError('Admin status could not be verified.');setReady(true)})},[]);
 async function change(next){setBusy(true);setError('');try{const updated=await setAppMode(next);setMode(updated);}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <div className="mx-auto max-w-2xl space-y-5 p-5"><Link to="/" className="underline">← Home</Link><h1 className="text-2xl font-semibold">Admin · Demo control</h1>
 {!ready?<p>Checking administrator access…</p>:user?.role!=='admin'?<section className="rounded border p-5"><p>Administrator authentication is required. Visitor views do not grant admin permissions.</p><button className="mt-3 rounded bg-primary px-4 py-2 text-primary-foreground" onClick={()=>base44.auth.redirectToLogin(window.location.href)}>Sign in as administrator</button></section>:
 <section className="rounded border p-5"><p className="mb-3">Current global mode: <strong>{mode.toUpperCase()}</strong></p>
 <div className="flex gap-3"><button disabled={busy||mode==='demo'} className="rounded border px-4 py-3 disabled:opacity-50" onClick={()=>change('demo')}>Enable simulation / tour</button><button disabled={busy||mode==='live'} className="rounded bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50" onClick={()=>change('live')}>Enable live setup</button></div>
 <p className="mt-4 text-sm">Live mode hides demo records and removes automatic simulation seeding. It does not transform sample records into real packages or enable unconnected services. Private services require actual authentication and authorization.</p></section>}
 {error&&<p role="alert">{error}</p>}
 </div>;
}