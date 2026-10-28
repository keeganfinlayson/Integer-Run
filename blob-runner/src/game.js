/* Canvas renderer and fixed-step controller. No external assets or network. */
(()=>{
'use strict';
const {operation,encounter,cancellation,signed,fits,signAllowed,LEVELS,DIFFICULTIES,makeLevel}=BlobMath;
let LEVEL=makeLevel(),selectedLevel=0,difficulty='standard',runSeed=1;
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const ui={notice:$('notice'),progress:$('progress')};
let W=0,H=0,dpr=1,half=0,horizon=0,near=0,unit=1,quality=1;
const keys=new Set();let held=0,dragging=false,helpWasRunning=false;
let cameraX=0,dragCameraX=0;
let s,accumulator=0,last=0,time=0,draws=0,budget=180;
const timings=[],frameIntervals=[];
const spriteFrames=BlobArt.creatures(),sprites={1:spriteFrames[1][0],'-1':spriteFrames[-1][0]};
const formations=new Map();let visualDt=0;let armyBounds=[],armyLabels=[],placedLabels=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
function footprint(n,sc=1){const r=Math.max(2,Math.min(12,half*.033)*sc),cap=half*.76*sc;return {r,spread:cap*(1-Math.exp(-r*Math.sqrt(Math.max(0,n))*1.3/cap))};}
const massSprites={};
for(const sign of [1,-1]){
 const image=document.createElement('canvas');image.width=320;image.height=190;const g=image.getContext('2d');
 g.fillStyle=sign>0?'#148dce':'#ce2c50';g.beginPath();g.ellipse(160,100,153,82,0,0,7);g.fill();
 const points=Array.from({length:480},(_,i)=>{const a=i*2.399963,r=Math.sqrt((i+.5)/480);return {x:160+Math.cos(a)*r*150,y:100+Math.sin(a)*r*78};}).sort((a,b)=>a.y-b.y);
 for(const p of points)g.drawImage(sprites[sign],p.x-7,p.y-10,14,14);
 massSprites[sign]=image;
}
function resize(){const bounds=$('stage').getBoundingClientRect();W=bounds.width;H=bounds.height;dpr=Math.min(devicePixelRatio||1,1.5)*quality;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);half=Math.min(W*.47,H*.58);horizon=H*(H<500?.33:.19);near=H*(H<500?.67:.76);unit=Math.min(W/440,H/700,1.3);}
addEventListener('resize',resize);resize();
function project(x,d){const sc=1/(1+Math.max(-160,d)/510),far=1/(1+LEVEL.view/510);return {x:W/2+(x-cameraX)*half*sc,y:horizon+(near-horizon)*(sc-far)/(1-far),sc};}
function round(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function tag(x,y,text,color='#245d69',size=16){ctx.font=`800 ${size}px system-ui`;const width=ctx.measureText(text).width+18,height=size+13;ctx.fillStyle='#17364820';round(x-width/2,y-height/2+3,width,height,7);ctx.fill();ctx.fillStyle=color;round(x-width/2,y-height/2,width,height,7);ctx.fill();ctx.strokeStyle='#ffffffdd';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);}
function message(text){ui.notice.textContent=text;}
function reset(start=false){
 formations.clear();cameraX=0;dragCameraX=0;keys.clear();held=0;dragging=false;s={mode:start?'running':'ready',position:0,value:LEVEL.start,x:0,target:0,next:0,incoming:[],spawned:[],passed:[],contacts:[],cancel:null,log:[],flash:0,end:false,won:false};
 $('pause').textContent='Pause';$('pauseVeil').hidden=true;ui.progress.style.width='0%';message(LEVEL.rows[0].title);$('levelHud').textContent=`${selectedLevel+1} / ${LEVELS.length} · ${LEVEL.name} · ${DIFFICULTIES[difficulty].name}`;sync();
}
function sync(){canvas.setAttribute('aria-label',`Signed integer runner. Current army ${signed(s.value)}. Use left/right arrows or drag to steer.`);}
function stop(title,text,won=false){s.mode='ended';s.end=true;s.won=won;$('nextLevel').hidden=!won||selectedLevel===LEVELS.length-1;$('resultTag').textContent=won?'Level complete':'Run ended';$('resultTitle').textContent=title;$('resultText').textContent=text;$('history').replaceChildren(...s.log.map(text=>{const d=document.createElement('div');d.textContent=text;return d;}));$('result').showModal();}
function pause(){if(s.mode==='running'){s.mode='paused';keys.clear();held=0;}else if(s.mode==='paused')s.mode='running';$('pause').textContent=s.mode==='paused'?'Resume':'Pause';$('pauseVeil').hidden=s.mode!=='paused';}
function log(text){s.log.push(text);message(text);}
function contactGap(a,b){return 20+Math.min(36,(Math.sqrt(Math.abs(a))+Math.sqrt(Math.abs(b)))*1.4);}
function finishContact(enemy){
 enemy.done=true;s.contacts.push(enemy.id);
 if(s.incoming.filter(e=>e.row===s.next).every(e=>e.done)){s.next++;}
}
function spawnCurrent(){
 const row=LEVEL.rows[s.next];if(!row||!['incoming','swarm'].includes(row.type)||s.spawned.includes(s.next))return;
 const items=row.type==='incoming'?row.items:[{id:row.id,x:0,v:row.v}];
 for(const it of items)s.incoming.push({...it,id:row.id+'-'+it.id,row:s.next,z:row.z,original:it.v,done:false});
 s.spawned.push(s.next);message(row.title);
}
function meet(enemy){
 const a=s.value,b=enemy.v;
 if(a*b>0){s.value=encounter(a,b);finishContact(enemy);log(`${signed(a)} joins ${signed(b)} → ${signed(s.value)}`);sync();return;}
 s.cancel={a,b,x:s.x,enemyId:enemy.id,elapsed:0,duration:difficulty==='fast'?.42:.55,result:encounter(a,b),gap:enemy.z-s.position};
 log(`${signed(a)} meets ${signed(b)} · canceling at front contact`);
}
function updateIncoming(dt,forwardStep=0){
 const active=LEVEL.rows[s.next]?.type;
 for(const enemy of s.incoming){
  if(enemy.done||!['incoming','swarm'].includes(active)||enemy.row!==s.next||s.cancel?.enemyId===enemy.id)continue;
  const d=enemy.z-s.position;
  if(d>LEVEL.view)continue;
  const gap=contactGap(s.value,enemy.v);
  // Direct route to the nearest part of the player's front, from this army's
  // own position. No road-center waypoint or separate lateral approach phase.
  const frontHalf=footprint(s.value).spread/half*.65;
  const targetX=clamp(enemy.x,s.x-frontHalf,s.x+frontHalf);
  const dx=(targetX-enemy.x)*180,dz=gap-(enemy.z-s.position+forwardStep);
  const length=Math.hypot(dx,dz),travel=Math.min(length,(LEVEL.speed*.42)*dt+forwardStep);
  if(length>.001){enemy.x+=dx/length*travel/180;enemy.z=s.position+Math.max(gap,enemy.z-s.position+forwardStep+dz/length*travel);}

 }
 if(s.cancel)return;
 const candidates=s.incoming.filter(enemy=>!enemy.done&&enemy.row===s.next&&enemy.z-s.position<=contactGap(s.value,enemy.v)+.9)
 .filter(enemy=>Math.abs(enemy.x-s.x)<Math.min(.65,(footprint(s.value).spread+footprint(enemy.v).spread)/half+.035))
 .sort((a,b)=>(a.z-s.position)-(b.z-s.position)||Math.abs(a.x-s.x)-Math.abs(b.x-s.x));
 if(candidates.length)meet(candidates[0]);
}
function resolve(row){
 if(row.type==='gate'){
  const magnitude=Math.abs(s.value);log(`Gate: |${signed(s.value)}| = ${magnitude}; requires < ${row.capacity}`);
  if(fits(s.value,row.capacity)){s.boss=BlobBoss.create();keys.clear();held=0;message('Boss arena: move to a circle. Oppose the pulse and survive.');}
  else stop('Too large to pass.',`|${signed(s.value)}| = ${magnitude}, which is not less than ${row.capacity}. The entire swarm stops. Revisit your earlier choices.`);
 }else if(row.type==='signGate'){
  const word=row.sign>0?'positive':'negative';
  if(!signAllowed(s.value,row.sign)){log(`${row.title}: ${signed(s.value)} blocked`);stop('Wrong sign at the gate.',`This gate requires a ${word} swarm. You arrived with ${signed(s.value)}. Use an earlier operation to change your sign.`);}
  else{s.passed.push(row.id);log(`${row.title}: ${signed(s.value)} passes`);}
 }else if(row.type==='pads'){
  const item=row.items.reduce((best,it)=>Math.abs(it.x-s.x)<Math.abs(best.x-s.x)?it:best);
  const old=s.value;
  try{s.value=operation(old,item.op);}catch(e){stop('No whole-number swarm.',e.message);return;}
  s.flash=.65;log(`${signed(old)} ${item.label} → ${signed(s.value)}`);sync();
  if(s.value===0)stop('Zero: no swarm left.','This operation made zero. Restart and keep a nonzero swarm.');
 }
}
function step(dt){
 if(s.mode!=='running')return;
 if(s.boss){stepBoss(dt);return;}
 if(s.value===0&&!s.cancel){stop('Zero: no army left.','Your army reached zero. Restart to try another route.');return;}
 s.flash=Math.max(0,s.flash-dt);
 if(s.cancel){
  const c=s.cancel,enemy=s.incoming.find(e=>e.id===c.enemyId);c.elapsed+=dt;
  const q=cancellation(c.a,c.b,c.elapsed/c.duration);s.value=q.a;enemy.v=q.b;sync();
  if(s.value===0){s.cancel=null;formations.delete('player');log('Your army reached zero');stop('Zero: no army left.','Your army reached zero at the impact point. The run ends even if the opposing army has survivors.');return;}
  // The impact is local: the other swarm still moves toward the group.
  updateIncoming(dt);
  if(c.elapsed>=c.duration){s.value=c.result;s.cancel=null;finishContact(enemy);sync();log(`${signed(c.a)} + (${signed(c.b)}) = ${signed(s.value)}`);if(s.value===0)stop('Zero: no swarm left.','Equal opposite quantities canceled completely. Steer toward the other approaching swarm on your next run.');}
  return;
 }
 const dir=(keys.has('ArrowRight')||keys.has('d')||keys.has('D')?1:0)-(keys.has('ArrowLeft')||keys.has('a')||keys.has('A')?1:0)+held;
 if(dir)s.target=clamp(s.target+dir*dt*1.85,-.76,.76);
 s.x+=(s.target-s.x)*Math.min(1,dt*13);
 const row=LEVEL.rows[s.next];
 if(row?.type==='gate'){s.target=0;s.x+=(0-s.x)*Math.min(1,dt*6);}
 spawnCurrent();
 const previousPosition=s.position;
 s.position+=LEVEL.speed*dt;
 // Keep the next operation ahead while homing swarms finish closing the gap.
 if(row&&['incoming','swarm'].includes(row.type))s.position=Math.min(s.position,row.hold);
 updateIncoming(dt,s.position-previousPosition);
 if(s.cancel||s.end)return;
 const next=LEVEL.rows[s.next];
 if(next&&['pads','gate','signGate'].includes(next.type)&&s.position>=next.z){s.position=next.z;s.next++;resolve(next);}
 ui.progress.style.width=`${Math.min(100,s.position/LEVEL.length*100)}%`;
}

function stepBoss(dt){
 const b=s.boss;
 if(b.phase==='exit'){b.exit+=dt;s.position+=LEVEL.speed*dt;if(b.exit>=1.5)stop('Boss defeated!',`${signed(s.value)} survives three counters. Course complete!`,true);return;}
 const dx=(keys.has('ArrowRight')||keys.has('d')||keys.has('D')?1:0)-(keys.has('ArrowLeft')||keys.has('a')||keys.has('A')?1:0)+held;
 const dy=(keys.has('ArrowDown')||keys.has('s')||keys.has('S')?1:0)-(keys.has('ArrowUp')||keys.has('w')||keys.has('W')?1:0);
 if(dx||dy){b.tx=b.x+dx*dt*1.25;b.ty=b.y+dy*dt*1.25;}
 const len=Math.hypot(b.tx,b.ty);if(len>.9){b.tx*=.9/len;b.ty*=.9/len;}
 // Slide around the central boss instead of crossing through its body.
 let nx=b.x+(b.tx-b.x)*Math.min(1,dt*10),ny=b.y+(b.ty-b.y)*Math.min(1,dt*10);
 const dist=Math.hypot(nx,ny+.28);if(dist<.33){nx=nx/dist*.33;ny=-.28+(ny+.28)/dist*.33;}
 b.x=nx;b.y=ny;
 if(b.phase==='charge'){
  b.timer-=dt;
  if(b.choice===null){const i=BlobBoss.pads.findIndex(p=>Math.hypot(p.x-b.x,p.y-b.y)<.17);if(i>=0){const p=BlobBoss.pads[i],old=s.value;s.value=operation(old,p.op);b.choice=i;log(`${signed(old)} ${p.label} → ${signed(s.value)}`);sync();if(!s.value){stop('Zero: no swarm left.','This operation made zero.');return;}}}
  if(b.timer<=0){b.phase='pulse';b.elapsed=0;b.before=s.value;b.result=BlobBoss.attack(s.value,b.sign,b.pulse);}
 }else if(b.phase==='pulse'){b.elapsed+=dt;if(b.elapsed>=.5){b.elapsed=0;b.phase='cancel';}}
 else if(b.phase==='cancel'){
  b.elapsed+=dt;
  if(b.before*b.sign<0){const removed=Math.floor(Math.min(Math.abs(b.before),b.pulse)*Math.min(1,b.elapsed/.5));s.value=Math.sign(b.before)*(Math.abs(b.before)-removed);sync();if(!s.value){stop('Zero: no army left.','The boss pulse exhausted your swarm.');return;}}
  if(b.elapsed>=.5){s.value=b.result.value;sync();if(b.result.hit)b.hits++;log(`${signed(b.before)} + (${signed(b.sign*b.pulse)}) = ${signed(s.value)}${b.result.hit?' · Boss hit!':' · Same sign: merged, no boss damage'}`);
   if(b.hits===3){b.phase='exit';b.exit=0;message('Boss defeated! Forward running resumes.');}
   else{b.sign*=-1;b.round++;b.choice=null;b.phase='charge';b.timer=difficulty==='fast'?3.5:difficulty==='relaxed'?6:5;
    b.pulse=[8,4].find(n=>BlobBoss.pads.some(p=>{const v=operation(s.value,p.op);return v*b.sign<0&&Math.abs(v)>n;}))||4;}
  }
 }
}
function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
function scene(){BlobArt.scene(ctx,{W,H,half,project,position:s.position,view:LEVEL.view,time,unit,cameraX,theme:LEVEL.theme});}
// A stable disk of light visual particles, with no collision or pairwise physics.
// Local coordinates survive resize. Existing members keep their identities as the
// crowd grows; a delayed follow response creates a soft tail when steering.
function intersects(a,b,gap=5){return a.x1<b.x2+gap&&a.x2>b.x1-gap&&a.y1<b.y2+gap&&a.y2>b.y1-gap;}
function renderArmyLabels(){
 placedLabels=[];
 for(const label of armyLabels.sort((a,b)=>(a.key==='player'?-1:0)-(b.key==='player'?-1:0))){
  ctx.font=`800 ${label.size}px system-ui`;const w=ctx.measureText(label.text).width+18,h=label.size+13;
  const x=clamp(label.x,w/2+5,W-w/2-5),preferred=label.below?label.bounds.y2+9+h/2:label.bounds.y1-9-h/2;
  const ys=[preferred];for(let i=1;i<30;i++){ys.push(preferred+(label.below?1:-1)*i*(h+7));ys.push(preferred-(label.below?1:-1)*i*(h+7));}
  let box=null;
  for(const cy of ys){const candidate={x1:x-w/2,x2:x+w/2,y1:cy-h/2,y2:cy+h/2};if(candidate.y1<58||candidate.y2>H-96)continue;if(armyBounds.some(b=>intersects(candidate,b))||placedLabels.some(b=>intersects(candidate,b)))continue;box=candidate;break;}
  if(!box)continue; // Never cover an army if a very small viewport has no free slot.
  tag(x,(box.y1+box.y2)/2,label.text,label.color,label.size);placedLabels.push({...box,key:label.key});
 }
}
function crowd(x,y,sc,value,cap=budget,label=true,feed=null,key='player'){
 const n=Math.abs(value),sign=value<0?-1:1,targetX=(x-W/2)/(half*sc)+cameraX;
 let v=formations.get(key);const fresh=!v;
 if(!v){v={mag:n,cx:targetX,particles:[],order:[],count:0};formations.set(key,v);}
 const dt=fresh?1:visualDt,blend=1-Math.exp(-dt*7);
 v.mag=mix(v.mag,n,blend);if(Math.abs(v.mag-n)<.02)v.mag=n;
 v.cx=mix(v.cx,targetX,1-Math.exp(-dt*12));
 const {r,spread}=footprint(v.mag,sc),count=Math.min(cap,Math.max(n?1:0,Math.round(v.mag)));
 // Keep the whole coherent footprint inside the roadway while permitting steering.
 const margin=clamp(1-(spread+r)/(half*sc),.08,.95),cx=clamp(v.cx,-margin,margin);
 if(n===0){return;}
 const bounds={x1:Infinity,x2:-Infinity,y1:Infinity,y2:-Infinity,key};
  if(count!==v.count){
  v.count=count;v.order=Array.from({length:count},(_,i)=>i);
  v.order.sort((a,b)=>Math.sin(a*2.399963)*Math.sqrt(a+.5)-Math.sin(b*2.399963)*Math.sqrt(b+.5));
 }
 if(v.mag>50&&!feed){
  ctx.drawImage(massSprites[sign],W/2+(cx-cameraX)*half*sc-spread,y-spread*.65,spread*2,spread*1.2);draws++;Object.assign(bounds,{x1:W/2+(cx-cameraX)*half*sc-spread,x2:W/2+(cx-cameraX)*half*sc+spread,y1:y-spread*.65,y2:y+spread*.55});
 }
 for(const i of v.order){
  const theta=i*2.399963,rad=Math.sqrt((i+.5)/Math.max(1,count));
  const ux=Math.cos(theta)*rad,uy=Math.sin(theta)*rad;
  const jitter=Math.sin(i*91.73)*.055;
  const tx=cx+(ux+jitter)*spread/(half*sc);
  let particle=v.particles[i];
  if(!particle){particle={x:cx+(ux+jitter)*spread/(half*sc)*.7,alpha:0};v.particles[i]=particle;}
  const follow=7+(uy+1)*3+Math.sin(i*13.7);
  particle.x=mix(particle.x,tx,1-Math.exp(-dt*follow));
  particle.alpha=mix(particle.alpha,1,1-Math.exp(-dt*10));
  const bob=Math.sin(time*(6.8+Math.sin(i*7.3)*.7)+i*1.83)*r*.16;
  const sway=Math.sin(time*2.1+i*4.17)*r*.12;
  let px=W/2+(clamp(particle.x,-1+r/(half*sc),1-r/(half*sc))-cameraX)*half*sc+sway;
  let py=y+uy*spread*.57;
  if(feed){const f=(i*.618033+time*1.55)%1;py=mix(feed.from,feed.to,f)+uy*r*1.2;px=mix(px,W/2+(cx-cameraX)*half*sc+ux*spread*.9,f);}
  ctx.globalAlpha=clamp(particle.alpha,0,1);
  ctx.drawImage(spriteFrames[sign][i%4],px-r,py-r*1.85+bob,r*2,r*2);draws++;bounds.x1=Math.min(bounds.x1,px-r);bounds.x2=Math.max(bounds.x2,px+r);bounds.y1=Math.min(bounds.y1,py-r*1.85+bob);bounds.y2=Math.max(bounds.y2,py+r*.15+bob);
 }
 ctx.globalAlpha=1;
 armyBounds.push(bounds);
 if(label)armyLabels.push({x:W/2+(cx-cameraX)*half*sc,text:signed(value),color:sign>0?'#087dcc':'#cc3654',size:Math.max(13,22*sc*unit),below:key==='player',bounds,key});
}
function pad(item,d,selected){
 const p=project(item.x,d),rx=Math.max(22,half*.25*p.sc),ry=rx*.42;
 ctx.fillStyle='#1b3a4738';ctx.beginPath();ctx.ellipse(p.x,p.y+4*p.sc,rx*1.06,ry*1.08,0,0,7);ctx.fill();
 ctx.save();ctx.shadowColor='#75e9ff';ctx.shadowBlur=selected?15:6;
 ctx.fillStyle=selected?'#2badd8':'#216d96';ctx.strokeStyle=selected?'#ecffff':'#73d7ef';ctx.lineWidth=selected?3:1.8;
 ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,7);ctx.fill();ctx.stroke();ctx.restore();
 ctx.strokeStyle='#d7ffff66';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,rx*.89,ry*.75,0,0,7);ctx.stroke();
 ctx.fillStyle='#fff';ctx.font=`850 ${Math.max(13,Math.min(26,28*p.sc*unit))}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(item.label,p.x,p.y-1);
}
function gate(d){
 const p=project(0,d),roadHalf=half*p.sc,gateHeight=170*p.sc*unit;
 // Opening follows the same radius-to-quantity mapping as the visible swarm.
 const depth=12*p.sc*unit;
 polygon([{x:p.x+roadHalf,y:p.y},{x:p.x+roadHalf+depth,y:p.y-depth},{x:p.x+roadHalf+depth,y:p.y-gateHeight-depth},{x:p.x+roadHalf,y:p.y-gateHeight}],'#405958');
 polygon([{x:p.x-roadHalf,y:p.y-gateHeight},{x:p.x+roadHalf,y:p.y-gateHeight},{x:p.x+roadHalf+depth,y:p.y-gateHeight-depth},{x:p.x-roadHalf+depth,y:p.y-gateHeight-depth}],'#b2b9a6');
 const gateFootprint=footprint(LEVEL.capacity,p.sc);
 const aperture=gateFootprint.spread+gateFootprint.r;
 ctx.fillStyle='#486b67';ctx.fillRect(p.x-roadHalf,p.y-gateHeight,roadHalf-aperture,gateHeight);ctx.fillRect(p.x+aperture,p.y-gateHeight,roadHalf-aperture,gateHeight);
 for(const side of [-1,1]){const wing=roadHalf-aperture,x=side<0?p.x-roadHalf:p.x+aperture;for(let row=0;row<4;row++)for(let col=0;col<3;col++)BlobArt.block(ctx,x+col*wing/3,p.y-gateHeight+row*gateHeight/4,wing/3,gateHeight/4,'#788b85','#b2bdae','#4e6565');}
 for(let j=0;j<8;j++)BlobArt.block(ctx,p.x-roadHalf+j*roadHalf/4,p.y-gateHeight-15*p.sc,roadHalf/4,18*p.sc,'#8a9a8b','#cbd0b2','#50656a');
 const glow=ctx.createLinearGradient(p.x-aperture,0,p.x+aperture,0);glow.addColorStop(0,'#93e6c388');glow.addColorStop(.5,'#c9f8d522');glow.addColorStop(1,'#93e6c388');ctx.fillStyle=glow;ctx.fillRect(p.x-aperture,p.y-gateHeight,aperture*2,gateHeight);
 ctx.strokeStyle='#c1f4d0';ctx.lineWidth=3;ctx.strokeRect(p.x-aperture,p.y-gateHeight,aperture*2,gateHeight);
 tag(p.x,p.y-gateHeight-33*p.sc,`|value| < ${LEVEL.capacity}`,'#214f4a',Math.max(14,22*p.sc*unit));
}
function drawSignField(d,row){
 const p=project(0,d),width=half*p.sc,height=Math.max(38,125*p.sc*unit),top=p.y-height,pillar=Math.max(9,26*p.sc*unit);
 const stone=row.sign>0?'#4e83aa':'#ad5669',light=row.sign>0?'#94bad4':'#dba0ab',shade=row.sign>0?'#2f526f':'#743849';
 ctx.fillStyle='#142f492b';ctx.beginPath();ctx.ellipse(p.x,p.y+2*p.sc,width,pillar*.4,0,0,7);ctx.fill();
 for(const side of [-1,1]){const x=side<0?p.x-width:p.x+width-pillar;for(let j=0;j<5;j++)BlobArt.block(ctx,x,top+j*height/5,pillar,height/5,stone,light,shade);BlobArt.block(ctx,x-pillar*.08,top-pillar*.15,pillar*1.16,pillar*.32,light,'#b5cbd7',shade);BlobArt.block(ctx,x-pillar*.12,p.y-pillar*.2,pillar*1.24,pillar*.32,stone,light,shade);}
 const blocks=8;for(let j=0;j<blocks;j++)BlobArt.block(ctx,p.x-width+j*width*2/blocks,top-pillar,width*2/blocks,pillar,stone,light,shade);
 tag(p.x,top-pillar-18*p.sc,row.sign>0?'POSITIVE +':'NEGATIVE −',row.sign>0?'#086cb0':'#b92c46',Math.max(12,19*p.sc*unit));
}
function drawImpact(){
 if(!s.cancel)return;
 const enemy=s.incoming.find(e=>e.id===s.cancel.enemyId),p=project(enemy.x,enemy.z-s.position),player=project(s.x,0);
 const x=(p.x+player.x)/2,y=(p.y+player.y)/2,width=Math.max(12,Math.min(footprint(s.cancel.a).spread,footprint(s.cancel.b).spread));
 // Small stationary contact seam; no separate battle layout or whole-screen animation.
 const glow=ctx.createLinearGradient(0,y-10*unit,0,y+9*unit);glow.addColorStop(0,'#c5f4ff00');glow.addColorStop(.5,'#ffffffdd');glow.addColorStop(1,'#ffc0d000');
 ctx.fillStyle=glow;ctx.fillRect(x-width,y-10*unit,width*2,19*unit);
 for(let i=0;i<12;i++){const f=(time*1.8+i*.618)%1;ctx.fillStyle='#ffffffb0';ctx.beginPath();ctx.arc(x+Math.sin(i*7.3)*width,y-f*15*unit,1+f,0,7);ctx.fill();}
}
function draw(){
 // Follow the visual formation's center, including its elastic steering lag.
 // Projection alone changes: arithmetic, contact checks, and steering lanes stay in world space.
 const v=formations.get('player'),dt=visualDt;
 const mag=mix(v?v.mag:Math.abs(s.value),Math.abs(s.value),1-Math.exp(-dt*7));
 const fp=footprint(mag),margin=clamp(1-(fp.spread+fp.r)/half,.08,.95);
 cameraX=clamp(mix(v?v.cx:s.x,s.x,1-Math.exp(-dt*12)),-margin,margin);
 draws=0;armyBounds=[];armyLabels=[];if(s.boss){BlobBoss.draw(ctx,W,H,s.boss,s.value,time,spriteFrames,tag);return;}scene();
 for(let i=LEVEL.rows.length-1;i>=s.next;i--){
  const row=LEVEL.rows[i],d=row.z-s.position;if(d>LEVEL.view||d<0)continue;
  if(row.type==='gate')gate(d);
  else if(row.type==='signGate')drawSignField(d,row);
  else if(row.type==='pads')for(const item of row.items)pad(item,d,i===s.next&&Math.abs(s.x-item.x)<.52);
  else if(['incoming','swarm'].includes(row.type)&&!s.spawned.includes(i)){
   const items=row.items||[{id:row.id,x:0,v:row.v}];for(const it of items){const p=project(it.x,d);crowd(p.x,p.y,p.sc,it.v,60,true,null,'preview-'+row.id+'-'+it.id);}
  }
 }
 const visible=s.incoming.filter(e=>!e.done&&e.z-s.position<=LEVEL.view).sort((a,b)=>b.z-a.z);
 for(const enemy of visible){const p=project(enemy.x,enemy.z-s.position);crowd(p.x,p.y,p.sc,enemy.v,60,true,null,enemy.id);}
 const p=project(s.x,0);crowd(p.x,p.y,1,s.value);drawImpact();renderArmyLabels();
}
function frame(ms){
 const raw=last?(ms-last)/1000:0;last=ms;const elapsed=Math.min(.1,raw);if(s.mode==='running')time+=elapsed;accumulator+=elapsed;
 while(accumulator>=1/60){step(1/60);accumulator-=1/60;}
 visualDt=s.mode==='running'?elapsed:0;
 const begin=performance.now();draw();timings.push(performance.now()-begin);if(timings.length>300)timings.shift();
 if(raw>0){frameIntervals.push(raw*1000);if(frameIntervals.length>120)frameIntervals.shift();}
 if((timings.length===300&&timings.reduce((a,b)=>a+b,0)/300>20)||(frameIntervals.length>=60&&frameIntervals.reduce((a,b)=>a+b,0)/frameIntervals.length>28)){budget=90;if(quality===1){quality=.75;resize();}}
 requestAnimationFrame(frame);
}
function steer(e){if(s.boss){const r=canvas.getBoundingClientRect();s.boss.tx=(e.clientX-r.left-W*.5)/(W*.44);s.boss.ty=(e.clientY-r.top-H*.58)/(H*.25);return;}const rect=canvas.getBoundingClientRect();const screenX=e.clientX-rect.left;s.target=Math.max(-.76,Math.min(.76,dragCameraX+(screenX-W/2)/half));}
canvas.addEventListener('pointerdown',e=>{if(s.mode!=='running')return;dragging=true;dragCameraX=cameraX;canvas.setPointerCapture(e.pointerId);steer(e);});
canvas.addEventListener('pointermove',e=>{if(dragging)steer(e);});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
for(const [id,dir] of [['left',-1],['right',1]]){
 const button=$(id);button.addEventListener('pointerdown',e=>{e.preventDefault();held=dir;button.setPointerCapture(e.pointerId);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>held=0);
 // Keyboard and assistive click activation moves toward the selected lane.
 button.addEventListener('click',e=>{if(e.detail===0)s.target=dir*.65;});
}
addEventListener('keydown',e=>{
 if(document.querySelector('dialog[open]'))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','W','s','S','a','A','d','D',' '].includes(e.key))e.preventDefault();
 if(e.key===' '&&!e.repeat)pause();
 if((e.key==='r'||e.key==='R')&&!e.repeat)reset(true);
 keys.add(e.key);
});
addEventListener('keyup',e=>keys.delete(e.key));
addEventListener('blur',()=>{keys.clear();held=0;dragging=false;if(s.mode==='running')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.mode==='running')pause();last=0;accumulator=0;});
function newRun(index,mode,seed){selectedLevel=index;difficulty=mode;runSeed=seed;LEVEL=makeLevel(index,seed,mode);reset(true);}
function openMenu(){if(s.mode==='running')pause();$('levelSelect').value=selectedLevel;$('difficultySelect').value=difficulty;$('intro').showModal();}
$('begin').onclick=()=>{$('intro').close();newRun(Number($('levelSelect').value),$('difficultySelect').value,(Date.now()^Math.floor(Math.random()*0x7fffffff))>>>0);};
$('levels').onclick=openMenu;$('chooseLevel').onclick=()=>{$('result').close();openMenu();};
$('nextLevel').onclick=()=>{$('result').close();$('levelSelect').value=Math.min(LEVELS.length-1,selectedLevel+1);newRun(Math.min(LEVELS.length-1,selectedLevel+1),difficulty,(runSeed+1337)>>>0);};
$('restart').onclick=()=>reset(true);$('again').onclick=()=>{$('result').close();reset(true);};$('pause').onclick=pause;
$('help').onclick=()=>{helpWasRunning=s.mode==='running';if(helpWasRunning)pause();$('helpDialog').showModal();};
function resumeHelp(){if(helpWasRunning&&s.mode==='paused')pause();helpWasRunning=false;}
$('closeHelp').onclick=()=>{$('helpDialog').close();resumeHelp();};$('helpDialog').addEventListener('close',resumeHelp);
$('result').addEventListener('cancel',e=>e.preventDefault());$('intro').addEventListener('cancel',e=>e.preventDefault());
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else message('Fullscreen is unavailable here. Open the HTML directly in your browser.');}catch(e){message('Fullscreen is blocked here. Open the HTML directly in your browser.');}};
document.addEventListener('fullscreenchange',()=>{$('full').textContent=document.fullscreenElement?'Exit full':'Fullscreen';resize();});
// Read-only diagnostics used by the verification harness.
window.BlobRunner={course:()=>JSON.parse(JSON.stringify(LEVEL)),cameraSnapshot:()=>({x:cameraX,width:W,roadNear:project(0,0),roadFar:project(0,LEVEL.view),player:project(s.x,0)}),labelSnapshot:()=>({armies:armyBounds,labels:placedLabels}),resetMetrics:()=>{timings.length=0;frameIntervals.length=0;},visualSnapshot:()=>{const v=formations.get('player');return v?{magnitude:v.mag,center:v.cx,particleX:v.particles.slice(0,24).map(p=>p.x),...footprint(v.mag)}:null;},snapshot:()=>JSON.parse(JSON.stringify(s)),metrics:()=>({spriteBudget:budget,drawnSprites:draws,drawMsMean:timings.length?timings.reduce((a,b)=>a+b,0)/timings.length:0,drawMsMax:Math.max(0,...timings),frameMsMean:frameIntervals.length?frameIntervals.reduce((a,b)=>a+b,0)/frameIntervals.length:0,canvasWidth:canvas.width,canvasHeight:canvas.height,dpr})};
reset();$('intro').showModal();requestAnimationFrame(frame);
})();
