import React, { useEffect, useRef } from 'react';
import {doorbellIdentity} from '../../../base44/shared/customerDoorbellProfiles.js';
import {activeWindowMotion,sourceOffsetAtPlayback} from '../../../base44/shared/doorbellWindowMotion.js';

// Camera-perspective 2.5D dramatization for the CUSTOMER side only.
// A fixed doorbell-height lens, textured architecture, natural shadows and frame-by-frame
// pedestrian/parcel motion replace the Guardian-vest schematic. All people and places
// are fictional illustrations; never claim these frames came from a Ring device.
const W = 960, H = 540;
const clamp = n => Math.max(0, Math.min(1, n));
const lerp = (a,b,t) => a+(b-a)*clamp(t);
const smooth = t => { const x=clamp(t);return x*x*(3-2*x); };
function hash(s){let h=2166136261;for (const c of String(s||''))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function rng(seed){let s=seed||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296}}
function path(ctx,points,fill,stroke=null){ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function rect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function rounded(ctx,x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function grad(ctx,x,y,x2,y2,stops){const g=ctx.createLinearGradient(x,y,x2,y2);for(const [o,c]of stops)g.addColorStop(o,c);return g}
function ellipse(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);ctx.fill()}
function line(ctx,pts,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.stroke()}
function parcel(ctx,x,y,scale,code,withLabel=true){
 const w=88*scale,h=63*scale,d=22*scale;
 ellipse(ctx,x+w*.47,y+h+5*scale,w*.66,11*scale,'#12130d44');
 path(ctx,[[x,y],[x+d,y-d*.75],[x+w+d,y-d*.75],[x+w,y]],'#c89e6c','#9d7147');
 path(ctx,[[x+w,y],[x+w+d,y-d*.75],[x+w+d,y+h-d*.75],[x+w,y+h]],'#a57a4e');
 rect(ctx,x,y,w,h,grad(ctx,x,y,x+w,y+h,[[0,'#d8b488'],[.43,'#c9a074'],[1,'#a77d50']]));
 line(ctx,[[x+w*.47,y-d*.29],[x+w*.49,y+h]],6*scale,'#c7ad82');
 rect(ctx,x+w*.11,y+h*.24,w*.56,h*.46,'#efebe1');
 rect(ctx,x+w*.15,y+h*.29,w*.47,3*scale,'#9f9b92');
 if(withLabel){
  ctx.font=`${Math.max(8,11*scale)}px monospace`;ctx.fillStyle='#302f2a';ctx.fillText(String(code).slice(-4),x+w*.16,y+h*.57);
  for(let i=0;i<13;i++)rect(ctx,x+w*(.15+i*.032),y+h*.63,(i%3?1.3:2.5)*scale,7*scale,'#45433f');
 }
}

function background(ctx,seed,scene,identity,viewRole){
 const r=rng(seed),late=scene==='doorbell_removal',dusk=late?0.24:scene==='doorbell_empty'?.11:0;
 const houseIndex=seed%4;
 rect(ctx,0,0,W,H,grad(ctx,0,0,0,H,[[0,late?'#8697a3':'#acbecd'],[.5,late?'#b8aca3':'#dae0da'],[1,'#777e72']]));
 // Natural uneven residential façade and soffit in wide-angle fixed position.
 const wall=[['#ae9d8c','#897462'],['#b2afa7','#928879'],['#a9a28f','#8d816d'],['#a89785','#846a58']][houseIndex];
 rect(ctx,0,0,764,394,grad(ctx,0,0,600,390,[[0,wall[0]],[.67,wall[1]],[1,'#74665c']]));
 const bricks=houseIndex===0||houseIndex===3;
 for(let y=26;y<383;y+=17){
  for(let x=-24;x<772;x+=61){const dx=(Math.round(y/17)%2)*31;const t=r();
   ctx.fillStyle=bricks?`rgba(78,57,43,${.09+t*.09})`:`rgba(235,231,217,${.018+t*.025})`;
   ctx.fillRect(x+dx,y,59,1.8);if(bricks)ctx.fillRect(x+dx,y,1.4,16);
  }
 }
 path(ctx,[[0,0],[W,0],[W,122],[748,83],[0,111]],grad(ctx,0,0,0,122,[[0,'#545a60'],[.55,'#777c7c'],[1,'#565753']]));
 rect(ctx,0,100,W,11,'#9e9e98');
 // Dark entry recess and bevelled front door, seen from a camera beside the door.
 path(ctx,[[287,117],[587,111],[587,414],[280,426]],'#555752');
 const doorColors={'slate blue':['#607785','#354b61','#27343c'],'forest green':['#58745f','#354c3b','#23312a'],'warm gray':['#77736c','#605d55','#3c3a35'],'brick red':['#8e5e56','#733e3a','#462d2c']};
 const tones=doorColors[identity.door_color];
 path(ctx,[[307,128],[566,124],[563,408],[303,417]],grad(ctx,320,130,550,410,[[0,tones[0]],[.47,tones[1]],[1,tones[2]]]));
 rect(ctx,329,155,208,112,grad(ctx,329,155,537,267,[[0,'#242f35'],[.5,'#3c4743'],[1,'#20282a']]));
 // Reflections of trees / sky in door glazing.
 path(ctx,[[336,159],[422,155],[375,262],[333,262]],'#b9d4d022');
 path(ctx,[[428,154],[533,155],[487,260],[403,265]],'#d5dddd20');
 rect(ctx,313,287,231,5,'#313635');
 for (let y of [320,359])rect(ctx,335,y,194,3,'#374039');
 ellipse(ctx,532,315,7,7,'#c5af85');ellipse(ctx,532,315,3,3,'#e9d7ab');
 // Entry light and address number, intentionally invented from package seed.
 rounded(ctx,238,141,21,39,5,identity.fixture==='bronze lantern'?'#7f624a':'#323c40');ellipse(ctx,248,166,9,12,'#f6e6bd8a');
 ctx.fillStyle='#e9e5d8';ctx.font='17px Arial';ctx.fillText(identity.door_number,600,178);
 // Side window and entry bench.
 path(ctx,[[50,183],[227,179],[229,345],[48,350]],'#dfd8c8');
 path(ctx,[[61,192],[213,189],[216,337],[59,339]],grad(ctx,0,160,250,320,[[0,'#33464d'],[.47,'#6b7d7e'],[1,'#263b3d']]));
 line(ctx,[[137,188],[137,338]],7,'#e0d6c3');line(ctx,[[58,263],[216,259]],6,'#e0d6c3');
 path(ctx,[[61,200],[123,195],[82,330],[60,330]],'#e9f3e91f');
 rounded(ctx,668,321,85,16,5,'#65574d');rect(ctx,679,337,9,55,'#5e544b');rect(ctx,741,337,9,55,'#5e544b');
 // Hedge and lawn at the side, natural variation across individual addresses.
 rect(ctx,753,219,207,208,grad(ctx,750,200,940,435,[[0,'#465a43'],[1,'#384e34']]));
 for(let i=0;i<100;i++){const x=748+r()*218,y=210+r()*230,rr=13+r()*37;
  ellipse(ctx,x,y,rr,rr*.55,`rgba(${30+Math.floor(r()*55)},${58+Math.floor(r()*45)},${23+Math.floor(r()*36)},${.25+r()*.32})`);
 }
 // Porch floor, walkway and paving, perspective lines.
 path(ctx,[[0,397],[759,382],[W,540],[0,540]],grad(ctx,0,393,0,540,[[0,'#aaaca7'],[.62,'#838980'],[1,'#70776d']]));
 path(ctx,[[260,424],[625,417],[765,540],[126,540]],grad(ctx,390,421,400,540,[[0,'#b8b7ad'],[1,'#888c87']]));
 for(let y=448;y<540;y+=26){line(ctx,[[0,y],[960,y+Math.round((y-448)*.23)]],1,'#6a6f6755')}
 for(let x=80;x<960;x+=145)line(ctx,[[x,398],[x+(x-475)*.6,540]],1,'#6a716855');
 rounded(ctx,379,438,186,37,9,'#3a3b34');rounded(ctx,390,440,164,31,6,'#666354');
 ctx.font='18px Arial';ctx.fillStyle='#bdb8a4';ctx.fillText(identity.doormat, identity.doormat==='WELCOME'?428:identity.doormat==='PLAIN'?438:445,463);
 // Fixed security-lens shading; photographed rather than vector diagram.
 rect(ctx,0,0,W,H,grad(ctx,0,0,0,H,[[0,'#13192222'],[.40,'#ffffff00'],[1,'#22211a29']]));
 if(dusk){rect(ctx,0,0,W,H,`rgba(51,43,70,${dusk})`)}
}

function human(ctx,x,feet,scale,phase,{visitor=false,bend=0,carrying=false}={}){
 const s=scale,unit=(n)=>n*s;
 const shade=visitor?'#393c4b':'#18384c',jacket=visitor?'#4d5365':'#415968';
 const skin=visitor?'#987c68':'#b18b72';
 ellipse(ctx,x,feet,33*s,8*s,'#12130d42');
 // Walking cadence with bent knees and naturally swinging arms.
 const stride=Math.sin(phase*10)*15*s;
 const hip=feet-92*s;
 const torsoY=feet-(205-16*bend)*s;
 const shoulder=torsoY+27*s;
 line(ctx,[[x-12*s,hip],[x-14*s+stride,feet-38*s],[x-13*s+stride*1.13,feet-2*s]],15*s,'#30353b');
 line(ctx,[[x+12*s,hip],[x+13*s-stride,feet-39*s],[x+13*s-stride*1.13,feet-2*s]],15*s,'#283139');
 line(ctx,[[x-14*s+stride*1.13,feet-2*s],[x-27*s+stride*1.13,feet]],9*s,'#1e242c');
 line(ctx,[[x+13*s-stride*1.13,feet-2*s],[x+28*s-stride*1.13,feet]],9*s,'#1e242c');
 ctx.fillStyle=grad(ctx,x-34*s,shoulder,x+35*s,hip,[[0,'#71808a'],[.2,jacket],[.7,shade],[1,'#162c3b']]);
 ctx.beginPath();ctx.moveTo(x-31*s,shoulder);ctx.quadraticCurveTo(x-42*s,shoulder+45*s,x-25*s,hip);ctx.lineTo(x+28*s,hip);ctx.quadraticCurveTo(x+39*s,shoulder+37*s,x+29*s,shoulder);ctx.closePath();ctx.fill();
 if(!visitor){ // high-visibility reflective safety stripes
  line(ctx,[[x-27*s,shoulder+35*s],[x+30*s,shoulder+35*s]],5*s,'#dbb84e');
  line(ctx,[[x-27*s,shoulder+49*s],[x+30*s,shoulder+49*s]],3*s,'#f8eb9b');
 }
 const handY=carrying ? feet-130*s : feet-99*s+30*s*bend;
 line(ctx,[[x-25*s,shoulder+8*s],[x-48*s,shoulder+61*s],[x-41*s,handY]],14*s,shade);
 line(ctx,[[x+26*s,shoulder+9*s],[x+50*s,shoulder+58*s],[x+41*s,handY]],14*s,shade);
 ellipse(ctx,x-41*s,handY,7*s,11*s,skin);ellipse(ctx,x+41*s,handY,7*s,11*s,skin);
 // Head with actual silhouette rather than icon/text.
 ellipse(ctx,x,torsoY-21*s,24*s,31*s,grad(ctx,x-15*s,torsoY-45*s,x+12*s,torsoY+8*s,[[0,'#d3b59a'],[.57,skin],[1,'#755743']]));
 ctx.fillStyle=visitor?'#292c34':'#1f3441';
 ctx.beginPath();ctx.ellipse(x,torsoY-46*s,25*s,10*s,0,Math.PI,Math.PI*2);ctx.fill();
 rounded(ctx,x-27*s,torsoY-48*s,54*s,10*s,6,visitor?'#272935':'#294555');
}
function motion(ctx,scene,p,tracking,dims){
 const code=String(tracking||'0000').slice(-4);
 const dimension=parseInt(String(dims||'12'),10);
 const sc=Math.max(.65,Math.min(1.22,(Number.isFinite(dimension)?dimension:12)/15));
 const threshold=scene==='doorbell_delivery';
 const removal=scene==='doorbell_removal';
 if(threshold){
  const approach=smooth(p/.23),exit=smooth((p-.39)/.35);
  const x=lerp(1020,610,approach)+exit*460;
  const bending=p>.23&&p<.41 ? Math.sin(Math.PI*clamp((p-.23)/.18))*.8 :0;
  if(p>=.39)parcel(ctx,435,422,sc,code);
  if(p<.75){
   if(p<.39)parcel(ctx,x-28,lerp(342,395,clamp((p-.26)/.13)),sc*.8,code);
   human(ctx,x,440,.9,p*2.5,{bend:bending,carrying:p<.39});
  }
 }else if(removal){
  const approach=smooth((p-.10)/.29),exit=smooth((p-.62)/.31);
  const x=lerp(1040,611,approach)+exit*430;
  if(p<.52)parcel(ctx,435,422,sc,code);
  if(p>.52&&p<.96)parcel(ctx,x-40,lerp(390,350,clamp((p-.52)/.12)),sc*.8,code);
  if(p>.10&&p<.97){
   const bending=p>.36&&p<.60?Math.sin(Math.PI*clamp((p-.36)/.24))*.9:0;
   human(ctx,x,440,.88,p*2.7,{visitor:true,bend:bending,carrying:p>.52});
  }
 }
}


function windowActivity(ctx, event){
  if(!event)return;
  const t=smooth(event.progress), x=lerp(1045,-85,t);
  if(event.type==='passerby'){
    human(ctx,x,436,.74,event.progress*2,{visitor:true});
  }else if(event.type==='dog_walker'){
    const p=x-104;
    human(ctx,x,438,.70,event.progress*2,{visitor:true});
    ellipse(ctx,p,417,33,18,'#ba9269');ellipse(ctx,p-27,404,15,15,'#c8a37c');
    ellipse(ctx,p-36,408,6,11,'#755940');
    for(const dx of [-17,17])line(ctx,[[p+dx,423],[p+dx+5,450]],5,'#8b7156');
    line(ctx,[[x-22,365],[p+21,405]],2,'#c9c0a0');
  }else if(event.type==='bird'){
    const bx=lerp(1010,-30,t),by=160+25*Math.sin(t*Math.PI*4);
    ellipse(ctx,bx,by,20,9,'#354556');
    path(ctx,[[bx-5,by-1],[bx-29,by-29*Math.abs(Math.sin(t*Math.PI*10))],[bx-16,by+5]],'#303a43');
    path(ctx,[[bx+5,by-1],[bx+29,by-29*Math.abs(Math.sin(t*Math.PI*10))],[bx+16,by+5]],'#303a43');
  }else if(event.type==='cyclist'){
    const by=426;
    for(const wx of [x-56,x+51]){
      ctx.strokeStyle='#282f31';ctx.lineWidth=6;ctx.beginPath();ctx.arc(wx,by,30,0,Math.PI*2);ctx.stroke();
      ellipse(ctx,wx,by,4,4,'#bbb5a8');
    }
    line(ctx,[[x-56,by],[x+6,by-46],[x+51,by],[x-56,by],[x+16,by],[x+51,by]],4,'#688879');
    line(ctx,[[x-9,by-64],[x+6,by-46]],7,'#51554e');
    human(ctx,x,by-29,.56,event.progress*2.4,{visitor:true});
  }
}

export default function CustomerDoorbellStage({scene, progress=0, clip, className=''}) {
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
  const tracking=clip?.tracking_number||clip?.clip_key||'demo';
  const identity=doorbellIdentity(clip);
  const seed=identity.hash;
  const p=clamp(progress);
  ctx.clearRect(0,0,W,H);
  background(ctx,seed,scene,identity,clip?.camera_view_role);
  if(scene==='doorbell_timelapse'){
   // Simulated motion of sunlight as frames advance through the fictional 2-hour interval.
   const sweep=Math.sin(p*Math.PI*1.5);
   path(ctx,[[110+p*370,398],[210+p*370,397],[268+p*450,540],[100+p*450,540]],'rgba(51,63,64,'+(.11+.10*Math.abs(sweep))+')');
   rect(ctx,0,0,W,H,'rgba(231,221,172,'+(.02+.10*(1-Math.abs(p-.5)*2))+')');
   windowActivity(ctx,activeWindowMotion(clip?.motion_events,p*8));
  } else motion(ctx,scene,p,tracking,clip?.package_dimensions);
  // Mild fixed surveillance noise, micro-banding, corner falloff, video framing.
  const random=rng(seed+Math.floor(p*180)+140);
  for(let i=0;i<4500;i++){
   const x=random()*W,y=random()*H;
   rect(ctx,x,y,1+random()*2,1+random(),random()>.52?'#ffffff0c':'#00000009');
  }
  const vignette=ctx.createRadialGradient(W*.5,H*.48,140,W*.5,H*.49,610);
  vignette.addColorStop(0,'#00000000');vignette.addColorStop(.72,'#12192712');vignette.addColorStop(1,'#070b14ba');
  rect(ctx,0,0,W,H,vignette);
  ctx.fillStyle='#f8f9f6';ctx.font='bold 16px ui-monospace, monospace';ctx.fillText(clip?.camera_view_role==='carrier_claimed_dropoff'?'● SIMULATED COURIER PROOF VIEW':'● SIMULATED CUSTOMER DOORBELL',18,32);
  ctx.font='13px ui-monospace, monospace';
  ctx.fillText(scene==='doorbell_timelapse'?'FICTIONAL 2-HOUR WINDOW → 8-SECOND SUMMARY':'DEMO REENACTMENT · NOT REAL VIDEO',18,H-22);
  if(scene==='doorbell_timelapse'){
   const start=Date.parse(clip?.source_window_start||clip?.recorded_start||'');
   if(Number.isFinite(start)){
    const simTime=new Date(start+sourceOffsetAtPlayback(clip?.motion_events,p*8)*1000);
    const display=simTime.toLocaleTimeString('en-US',{timeZone:'America/Los_Angeles',hour:'2-digit',minute:'2-digit'});
    rounded(ctx,17,43,205,37,5,'#05090fbc');ctx.fillStyle='#f3f6f0';ctx.font='bold 21px monospace';ctx.fillText(display+' PT',28,69);
   }
  }
  ctx.textAlign='right';ctx.fillText('PARCEL · '+String(tracking).slice(-8),W-22,H-22);ctx.textAlign='left';
 },[scene,progress,clip?.tracking_number,clip?.package_dimensions,clip?.clip_key,clip?.doorway_key,clip?.camera_view_role,clip?.recorded_start,clip?.source_window_start,clip?.motion_events]);
 return <div className={`relative w-full overflow-hidden rounded-md bg-slate-950 ${className}`}>
  <canvas ref={ref} width={W} height={H} aria-label={'Realistic fictional doorbell-view dramatization for '+(clip?.tracking_number||'sample package')+'; '+(clip?.description||'')} role="img" className="block w-full aspect-video"/>
 </div>;
}