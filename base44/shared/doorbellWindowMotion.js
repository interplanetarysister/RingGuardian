// Deterministic fictional camera motion events for the eight-second delivery-window summary.
// Motion moments are deliberately expanded for visibility while idle time is compressed.
// There is NO real Ring footage and these events must never be portrayed as actual observations.
export const PLAYBACK_SECONDS = 8;
export const SOURCE_SECONDS = 7200;
function hash(s) {
  let h=2166136261;
  for(const c of String(s)) h=Math.imul(h^c.charCodeAt(0),16777619);
  return h>>>0;
}
export function buildDemoWindowMotion(doorwayKey, windowStart) {
  const h=hash(String(doorwayKey)+'|'+String(windowStart).slice(0,10));
  const sequence=[
    ['passerby','Pedestrian walks past the front entrance'],
    ['bird','Bird flies across the camera view'],
    ['dog_walker','Neighbor walks past with a dog'],
    ['cyclist','Cyclist passes along the walkway']
  ];
  // Real fictional event times are minutes apart; the visible portions are held
  // so the audience can perceive movement instead of 15 seconds / 900 = 17 ms.
  const playback=[[0.70,1.45],[2.35,2.9],[4.45,5.45],[6.25,7.1]];
  const sourceOffsets=[680,2010,4090,5970];
  return playback.map(([playStart,playEnd],i)=>({
    key:'window-motion-'+i,
    type:sequence[(i+(h%3))%sequence.length][0],
    label:sequence[(i+(h%3))%sequence.length][1],
    playback_start_seconds:playStart,
    playback_end_seconds:playEnd,
    source_offset_seconds:sourceOffsets[i]+(h%(90+i*23)),
    source_duration_seconds:[17,8,31,12][i]
  }));
}
export function sourceOffsetAtPlayback(motionEvents,playbackSeconds,sourceLength=SOURCE_SECONDS) {
  const p=Math.max(0,Math.min(PLAYBACK_SECONDS,Number(playbackSeconds)||0));
  const events=Array.isArray(motionEvents)?motionEvents:[];
  const knots=[[0,0]];
  for(const e of events) {
    const start=Number(e.playback_start_seconds),end=Number(e.playback_end_seconds);
    const source=Number(e.source_offset_seconds),span=Number(e.source_duration_seconds);
    if(![start,end,source,span].every(Number.isFinite)||end<=start||source<0||span<=0)continue;
    knots.push([start,source],[end,source+span]);
  }
  knots.push([PLAYBACK_SECONDS,sourceLength]);
  knots.sort((a,b)=>a[0]-b[0]);
  for(let i=1;i<knots.length;i++){
    const [x2,y2]=knots[i], [x1,y1]=knots[i-1];
    if(p<=x2){
      const t=x2>x1?(p-x1)/(x2-x1):0;
      return Math.max(0,Math.min(sourceLength,y1+(y2-y1)*Math.max(0,Math.min(1,t))));
    }
  }
  return sourceLength;
}
export function activeWindowMotion(motionEvents,playbackSeconds){
  const sec=Math.max(0,Math.min(PLAYBACK_SECONDS,Number(playbackSeconds)||0));
  const e=(Array.isArray(motionEvents)?motionEvents:[]).find(x=>sec>=x.playback_start_seconds&&sec<=x.playback_end_seconds);
  if(!e)return null;
  const progress=(sec-e.playback_start_seconds)/(e.playback_end_seconds-e.playback_start_seconds);
  return {...e,progress:Math.max(0,Math.min(1,progress))};
}