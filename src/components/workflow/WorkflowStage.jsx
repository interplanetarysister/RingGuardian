import React from 'react';

// High-visibility stage colors used consistently on Customer and Management.
// The active fieldset is the only form rendered while future steps stay locked.
export const STAGE_COLORS=[
 {name:'sunshine yellow',accent:'#FACC15',wash:'rgba(250,204,21,.11)',glow:'rgba(250,204,21,.31)'},
 {name:'firetruck orange-red',accent:'#FF5138',wash:'rgba(255,81,56,.10)',glow:'rgba(255,81,56,.31)'},
 {name:'turquoise teal',accent:'#09CFC2',wash:'rgba(9,207,194,.10)',glow:'rgba(9,207,194,.31)'},
 {name:'grass green',accent:'#45C967',wash:'rgba(69,201,103,.10)',glow:'rgba(69,201,103,.31)'},
 {name:'electric violet',accent:'#AD70FF',wash:'rgba(173,112,255,.10)',glow:'rgba(173,112,255,.31)'}
];
export const STATUS_TEXT={active:'WORK HERE',done:'COMPLETED',locked:'FINISH THE PREVIOUS STEP',available:'OPTIONAL'};
export default function WorkflowStage({number,title,active=false,done=false,locked=false,optional=false,children,id,description='',onReopen=null}){
 const palette=STAGE_COLORS[(number-1)%STAGE_COLORS.length];
 const status=locked?'locked':active?'active':done?'done':'available';
 return <section id={id} data-stage={number} data-stage-status={status} aria-labelledby={'stage-heading-'+(id||number)} aria-disabled={locked} className={'relative scroll-mt-20 overflow-hidden rounded-none first:rounded-t-[20px] last:rounded-b-[20px] border-[5px] -mt-[5px] first:mt-0 bg-card p-4 sm:p-6 transition-all duration-300 '+(active?'z-10 scale-[1.005]':'')} style={{
  borderColor:palette.accent,
  background:active?palette.wash:undefined,
  boxShadow:active?'0 0 0 3px '+palette.glow+', 0 16px 38px rgba(0,0,0,.24)':'0 3px 12px rgba(0,0,0,.07)'
 }}>
  <header className="flex flex-wrap items-center gap-3">
   <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl font-black text-[#101520]" style={{backgroundColor:palette.accent}}>{number}</span>
   <div className="min-w-0 flex-1"><h2 id={'stage-heading-'+(id||number)} className="text-xl font-black tracking-tight text-foreground sm:text-2xl">{number}. {title}</h2>{description&&<p className="mt-1 text-sm font-medium text-foreground/75">{description}</p>}</div>
   <span className="rounded-lg border-2 px-2 py-1 text-[11px] font-black tracking-wider text-foreground" style={{borderColor:palette.accent}}>{optional?'OPTIONAL':STATUS_TEXT[status]}</span>
  </header>
  {locked?<div className="relative mt-4" aria-label="Locked step">
    <div aria-hidden="true" className="pointer-events-none select-none space-y-3 blur-[5px] opacity-35">
      <div className="h-8 w-3/4 rounded-lg" style={{backgroundColor:palette.accent}}/>
      <div className="h-11 w-full rounded-lg bg-muted"/><div className="h-11 w-4/5 rounded-lg bg-muted"/>
      <div className="h-12 w-36 rounded-lg" style={{backgroundColor:palette.accent}}/>
    </div>
    <div className="absolute inset-0 grid place-items-center"><p className="rounded-xl border-2 bg-background/95 px-4 py-3 text-center text-sm font-bold text-foreground shadow-lg" style={{borderColor:palette.accent}}>Complete step {number-1} to unlock</p></div>
   </div>:<div className={'mt-5 space-y-4 '+(done&&!active?'opacity-90':'')}>{children}
   {done&&!active&&typeof onReopen==='function'&&<button type="button" onClick={onReopen} className="rounded-lg border-2 px-3 py-2 text-sm font-bold text-foreground" style={{borderColor:palette.accent}}>Review or edit this step</button>}
   </div>}
 </section>;
}
export function StageProgress({titles,current=1,done=[]}){
 return <nav aria-label="Workflow progress" className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl sm:grid-cols-4 lg:grid-cols-5">
  {titles.map((t,i)=>{
   const n=i+1,theme=STAGE_COLORS[i%STAGE_COLORS.length];
   return <div key={n} className={'rounded-none border-[3px] -ml-[3px] first:ml-0 px-3 py-2 text-xs font-bold '+(current===n?'bg-card shadow-md':'opacity-80')} style={{borderColor:theme.accent}}>
     <span className="font-black" style={{color:theme.accent,filter:'drop-shadow(0 0 1px currentColor)'}}>{n}.</span> {t}
     <span className="mt-1 block text-[10px] text-muted-foreground">{done.includes(n)?'Complete':n===current?'Current step':'Waiting'}</span>
   </div>;
  })}
 </nav>;
}