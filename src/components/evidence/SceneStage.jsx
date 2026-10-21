import React from 'react';

// A schematic reconstruction of the recorded scene, driven by the player position.
// This is deliberately stylised rather than pretending to be photographic footage:
// it shows what the recording documents, and it is labelled as a reconstruction.
// If a real recording is attached to the clip, the player renders that instead.

const W = 1000;
const H = 562;

function Box({ x, y, w = 92, h = 66, highlight = false, lifted = false, label = '' }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={lifted ? 0.98 : 1}>
      <ellipse cx={w / 2} cy={h + 6} rx={w * 0.52} ry={lifted ? 10 : 5} fill="#000" opacity={lifted ? 0.35 : 0.22} />
      {highlight ? (
        <rect x={-7} y={-7} width={w + 14} height={h + 14} rx={5} fill="none" stroke="hsl(var(--tone-info))" strokeWidth="2" strokeDasharray="7 5" />
      ) : null}
      <rect width={w} height={h} rx={3} fill="#a97b46" />
      <rect width={w} height={h} rx={3} fill="url(#boxShade)" />
      <rect x={w * 0.16} y={h * 0.6} width={w * 0.36} height={h * 0.1} fill="#f2e8d6" opacity="0.8" />
      <rect x={w * 0.6} y={h * 0.18} width={w * 0.16} height={h * 0.2} fill="#7d5a31" opacity="0.6" />
      {label ? <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fontSize="11" fill="#3a2c1a" fontFamily="monospace">{label}</text> : null}
    </g>
  );
}

function Person({ x, y, scale = 1, armAngle = 0, flip = 1, vest = '#2f4a6b' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * flip} ${scale})`}>
      <ellipse cx="0" cy="124" rx="36" ry="8" fill="#000" opacity="0.3" />
      <rect x="-16" y="44" width="13" height="66" rx="6" fill="#1b2739" />
      <rect x="3" y="44" width="13" height="66" rx="6" fill="#1b2739" />
      <rect x="-27" y="-56" width="54" height="104" rx="14" fill={vest} />
      <rect x="-20" y="-46" width="40" height="16" rx="4" fill="#f6d365" opacity="0.85" />
      <rect x="-20" y="-26" width="40" height="16" rx="4" fill="#f6d365" opacity="0.85" />
      <circle cx="0" cy="-76" r="17" fill="#b9906b" />
      <path d="M-17 -84 a17 17 0 0 1 34 0 z" fill="#2b3a52" />
      <g transform={`rotate(${armAngle} 22 -46)`}>
        <rect x="20" y="-52" width="12" height="58" rx="6" fill={vest} />
        <rect x="20" y="2" width="12" height="14" rx="3" fill="#b9906b" />
      </g>
    </g>
  );
}

function ScannerBeam({ fromX, fromY, toX, toY, active }) {
  if (!active) return null;
  return (
    <g>
      <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="hsl(var(--tone-danger))" strokeWidth="2.5" opacity="0.9" />
      <circle cx={toX} cy={toY} r="7" fill="hsl(var(--tone-danger))" opacity="0.35" />
      <circle cx={toX} cy={toY} r="3" fill="hsl(var(--tone-danger))" />
    </g>
  );
}

function Conveyor({ progress }) {
  const shift = (progress * 240) % 48;
  const slats = [];
  for (let i = -1; i < 24; i += 1) slats.push(i * 48 - shift);
  return (
    <g>
      <rect x="0" y="404" width={W} height="26" fill="#16233a" />
      {slats.map((x) => (
        <rect key={'s' + x} x={x} y="408" width="22" height="18" rx="2" fill="#2a3d5c" />
      ))}
      <rect x="0" y="430" width={W} height="14" fill="#0f1a2b" />
      <Box x={210 + progress * 300} y={340} highlight label="" />
      <Box x={520 - progress * 120} y={352} w={70} h={50} />
      <Person x={790} y={352} scale={0.92} armAngle={progress > 0.32 && progress < 0.78 ? -34 : -6} flip={-1} />
      <ScannerBeam fromX={742} fromY={330} toX={400 + progress * 300} toY={372} active={progress > 0.32 && progress < 0.78} />
    </g>
  );
}

function SortLine({ progress }) {
  return (
    <g>
      <path d="M0 250 L420 250 L560 430 L1000 430" stroke="#22334c" strokeWidth="70" fill="none" strokeLinecap="round" />
      <path d="M0 250 L420 250 L560 430 L1000 430" stroke="#2d4262" strokeWidth="56" fill="none" strokeLinecap="round" />
      <Box x={140 + progress * 260} y={196} w={84} h={60} highlight />
      <Box x={640 + progress * 200} y={392} w={70} h={52} />
      <Person x={520} y={300} scale={0.86} armAngle={-26} flip={-1} />
      <ScannerBeam fromX={482} fromY={282} toX={240 + progress * 260} toY={226} active={progress > 0.25 && progress < 0.7} />
    </g>
  );
}

function Dock({ progress, misroute }) {
  const walk = misroute ? progress : progress * 0.8;
  return (
    <g>
      <rect x="0" y="120" width="230" height="360" fill="#0d1726" />
      <rect x="18" y="140" width="194" height="330" rx="4" fill="#1a2a42" />
      <rect x="18" y="140" width="194" height="330" rx="4" fill="url(#trailerShade)" />
      <text x="115" y="330" textAnchor="middle" fontSize="12" fill="#6f88a8" fontFamily="monospace" transform="rotate(-90 115 330)">TRL-3388</text>
      <rect x="0" y="470" width={W} height="92" fill="#0b1421" />
      <line x1="0" y1="470" x2={W} y2="470" stroke="#22334c" strokeWidth="2" />
      {misroute ? (
        <g>
          <rect x="700" y="392" width="130" height="16" rx="4" fill="#2a3d5c" />
          <rect x="706" y="408" width="10" height="62" rx="3" fill="#1b2739" />
          <rect x="814" y="408" width="10" height="62" rx="3" fill="#1b2739" />
          <circle cx="711" cy="474" r="8" fill="#111c2c" />
          <circle cx="819" cy="474" r="8" fill="#111c2c" />
          <Box x={712 + walk * 40} y={330} w={84} h={60} highlight />
          <Person x={430 + walk * 250} y={372} scale={0.94} armAngle={-14} />
          <text x="765" y="366" textAnchor="middle" fontSize="11" fill="hsl(var(--tone-danger))" fontFamily="monospace">HAND CART</text>
        </g>
      ) : (
        <g>
          <Box x={120 + progress * 120} y={360} w={88} h={64} highlight />
          <Box x={132} y={318} w={76} h={54} />
          <Person x={430 - progress * 120} y={372} scale={0.94} armAngle={-20} flip={-1} />
        </g>
      )}
    </g>
  );
}

function TrailerInterior({ progress }) {
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill="#0b1421" />
      <path d="M60 90 L940 140 L940 470 L60 430 Z" fill="#122033" stroke="#22334c" strokeWidth="3" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={60 + i * 176} y1={90 + i * 8} x2={60 + i * 176} y2={430 + i * 8} stroke="#1b2c44" strokeWidth="2" />
      ))}
      <Box x={360} y={330} w={110} h={78} highlight label="" />
      <g transform={`translate(${520 - progress * 30} ${300 - progress * 10})`}>
        <rect x="0" y="0" width="120" height="52" rx="10" fill="#1b2739" stroke="#33475f" />
        <rect x="18" y="10" width="58" height="32" rx="4" fill="#0b1421" />
        <circle cx="96" cy="26" r="6" fill="hsl(var(--tone-danger))" />
      </g>
      <ScannerBeam fromX={556} fromY={318} toX={470} toY={366} active={progress > 0.2 && progress < 0.85} />
      <g opacity="0.5">
        <rect x="0" y="470" width={W} height="92" fill="#101a2a" />
      </g>
    </g>
  );
}

function Porch({ progress, theft=false, quiet=false }) {
  const p=progress;
  const courier=p<0.32?850-p*1250:p<0.56?450+(p-0.32)*2000:1200;
  const collector=p<0.64?-150:-150+(p-0.64)*2200;
  const placed=p>=0.29&&p<0.84;
  return <g>
    <rect width={W} height={H} fill="#101c2b"/>
    <rect y="470" width={W} height="92" fill="#344152"/>
    <rect x="120" y="110" width="230" height="360" rx="4" fill="#42546a"/>
    <rect x="136" y="126" width="198" height="328" rx="3" fill="#2b3f5b"/>
    <circle cx="300" cy="300" r="7" fill="#cbd5e1"/>
    <rect x="380" y="440" width="180" height="14" rx="3" fill="#2a3a52"/>
    <text x="145" y="98" fill="#e2e8f0" fontSize="18">{quiet?'EXPECTED ADDRESS · PORCH STAYS EMPTY':'DELIVERY ADDRESS'}</text>
    {quiet?<g><text x="500" y="280" textAnchor="middle" fontSize="20" fill="#cbd5e1">No matching delivery at this porch</text><text x="500" y="310" textAnchor="middle" fontSize="15" fill="#94a3b8">Review interval; absence alone is not proof</text></g>:<>
      {placed&&<Box x={452} y={404} w={78} h={46} highlight/>}
      {p<0.29&&<Box x={courier-45} y={340} w={78} h={46}/>}
      {p<0.56&&<Person x={courier} y={372} scale={0.9} armAngle={p>0.2?-50:-12} flip={-1}/>}
      {p>0.64&&<Person x={collector} y={372} scale={0.9} armAngle={p>0.78?-65:-12} vest={theft?'#66586b':'#50766b'}/>}
      {p>=0.84&&<Box x={collector+20} y={335} w={78} h={46}/>}
      {p>=0.84&&<text x="600" y="110" fontSize="17" fill={theft?'#fbbf24':'#6ee7b7'}>{theft?'Later removal · human review needed':'Recipient collection confirmed'}</text>}
    </>}
  </g>;
}

function Pallet({ progress, scanning }) {
  const cells = [
    { id: 'A1', x: 300, y: 150 },
    { id: 'A2', x: 430, y: 150 },
    { id: 'A3', x: 560, y: 150 },
    { id: 'B1', x: 300, y: 280 },
    { id: 'B2', x: 430, y: 280 },
    { id: 'B3', x: 560, y: 280 }
  ];
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill="#0d1626" />
      <rect x="230" y="90" width="500" height="380" rx="6" fill="#8a6836" opacity="0.55" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={230} y={110 + i * 76} width="500" height="10" fill="#6d5028" opacity="0.7" />
      ))}
      {cells.map((c) => {
        const lift = c.id === 'B2' ? Math.max(0, Math.min(1, (progress - 0.4) / 0.3)) : 0;
        return (
          <g key={c.id} transform={`translate(${c.x} ${c.y - lift * 34})`} opacity={c.id === 'B2' ? 1 : 0.82}>
            <rect width="104" height="82" rx="3" fill={c.id === 'B2' ? '#c08f52' : '#a97b46'} />
            <rect width="104" height="82" rx="3" fill="url(#boxShade)" />
            <text x="52" y="46" textAnchor="middle" fontSize="13" fill="#3a2c1a" fontFamily="monospace">{c.id}</text>
            {c.id === 'B2' ? (
              <rect x="-6" y="-6" width="116" height="94" rx="5" fill="none" stroke="hsl(var(--tone-warn))" strokeWidth="2.5" strokeDasharray="8 5" />
            ) : null}
          </g>
        );
      })}
      <Person x={850-Math.min(1,progress*3)*100} y={350} scale={0.85} armAngle={progress>0.25?-55:-10} />
      <circle cx="744" cy="317" r="8" fill={progress>0.1?'#34d399':'#ef4444'}/>
      <text x="780" y="288" fontSize="14" fill="#e2e8f0">{progress>0.1?'VEST CAMERA ON':'WORKER ENTERING'}</text>
      {!scanning&&progress>0.45&&<text x="290" y="430" fontSize="18" fill="#fbbf24">SCAN 64% · NO CONFIRMATION · RETAIN INTERVAL</text>}
      {scanning ? (
        <g opacity={progress > 0.3 && progress < 0.9 ? 1 : 0.35}>
          <rect x="600" y="330" width="120" height="54" rx="10" fill="#1b2739" stroke="#33475f" />
          <circle cx="694" cy="357" r="6" fill="hsl(var(--tone-danger))" />
          <ScannerBeam fromX={610} fromY={352} toX={500} toY={308} active={progress > 0.3 && progress < 0.9} />
        </g>
      ) : null}
    </g>
  );
}

export default function SceneStage({ scene, progress = 0, className = '' }) {
  const p = Math.max(0, Math.min(1, progress));

  let body = null;
  if (scene === 'conveyor') body = <Conveyor progress={p} />;
  else if (scene === 'sortline') body = <SortLine progress={p} />;
  else if (scene === 'dock') body = <Dock progress={p} misroute={false} />;
  else if (scene === 'dock_misroute') body = <Dock progress={p} misroute />;
  else if (scene === 'trailer') body = <TrailerInterior progress={p} />;
  else if (scene === 'porch_quiet') body = <Porch progress={p} quiet />;
  else if (scene === 'porch') body = <Porch progress={p} theft={false} />;
  else if (scene === 'porch_theft') body = <Porch progress={p} theft />;
  else if (scene === 'pallet') body = <Pallet progress={p} scanning={false} />;
  else if (scene === 'pallet_scan') body = <Pallet progress={p} scanning />;
  else body = <Pallet progress={p} scanning />;

  return (
    <div className={'relative w-full overflow-hidden rounded-md border border-border bg-[#070d16] ' + className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={'Simulated camera scene: ' + (scene || 'handling')}>
        <defs>
          <linearGradient id="boxShade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="trailerShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="48%" r="72%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
        </defs>

        {body}
        <rect x="0" y="0" width={W} height={H} fill="url(#vignette)" pointerEvents="none" />

        {/* camera framing marks */}
        <g stroke="#7f93ad" strokeWidth="2" opacity="0.5" fill="none">
          <path d="M28 60 L28 28 L60 28" />
          <path d="M940 28 L972 28 L972 60" />
          <path d="M28 502 L28 534 L60 534" />
          <path d="M940 534 L972 534 L972 502" />
        </g>
        <text x="46" y="52" fontSize="13" fill="#8fa6c2" fontFamily="monospace" opacity="0.85">SIMULATED EVENT</text>
        <text x="954" y="52" fontSize="13" fill="#8fa6c2" fontFamily="monospace" opacity="0.85" textAnchor="end">
          {String(Math.round(p * 100)).padStart(3, '0')}%
        </text>
        <text x="46" y="516" fontSize="13" fill="#8fa6c2" fontFamily="monospace" opacity="0.85">GUARDIAN VEST CAM · DEMO</text>
      </svg>

      {/* scanline texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)' }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
        <div className="h-16 w-full animate-scan-sweep bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      </div>
    </div>
  );
}