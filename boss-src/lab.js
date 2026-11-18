(()=>{'use strict';
const c=document.querySelector('canvas'),g=c.getContext('2d'),$=id=>document.getElementById(id),sprite=new Image();const assetRoot='assets/';sprite.src=assetRoot+'dr-fin-poses.webp';const stone=new Image();stone.src=assetRoot+'mossy-stone.webp';const forest=new Image();forest.src=assetRoot+'forest-chasm.webp';const creatures=BlobArt.creatures(),keys=new Set();let s,W,H,half,near,horizon,clock=0,last=0,paused=false,drag=false,held={x:0,z:0};
const params=new URLSearchParams(location.search),entry=Number(params.get('army')),entryArmy=Number.isSafeInteger(entry)&&entry!==0&&Math.abs(entry)<=1000000?entry:12;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),signed=BlobMath.signed;
function resize(){const r=c.getBoundingClientRect();W=r.width;H=r.height;const d=Math.min(devicePixelRatio||1,1.5);c.width=W*d;c.height=H*d;g.setTransform(d,0,0,d,0,0);half=Math.min(W*.26,H*.7);near=H*.86;horizon=H*.20;}addEventListener('resize',resize);resize();
function project(x,z){const d=z-s.forward,sc=1/(1+Math.max(-130,d)/510),far=1/(1+1100/510);return {x:W/2+(x-s.camera)*half*sc,y:horizon+(near-horizon)*(sc-far)/(1-far),sc};}
// Two additive lights and one multiplication light. All positions are
// independent spots on the stone, selected afresh around the arena.
const roles=['addA','addB','mul'];
const random=(a,b)=>a+Math.random()*(b-a);
function locationForPad(role){
 const other=(s.pads||[]).filter(p=>p.role!==role);
 const older=(s.pads||[]).find(p=>p.role===role);
 let best=null,bestScore=-Infinity;
 for(let attempt=0;attempt<90;attempt++){
  const sector={addA:3.65,addB:5.75,mul:1.75}[role];
  const angle=attempt<12?sector+random(-.56,.56):random(0,2*Math.PI);
  const radial=random(.57,.77),x=1.75*radial*Math.cos(angle),z=680+235*radial*Math.sin(angle);
  const bossDist=Math.hypot(x,(z-850)/240);
  const playerDist=Math.hypot(x-s.x,(z-s.z)/240);
  const peerDist=other.length?Math.min(...other.map(p=>Math.hypot(x-p.x,(z-p.z)/240))):3;
  const oldDist=older?Math.hypot(x-older.x,(z-older.z)/240):3;
  const score=Math.min(peerDist*1.2,oldDist*.9,playerDist*.85,bossDist);
  if(score>bestScore){bestScore=score;best={x,z};}
  if(peerDist>.78&&oldDist>.68&&playerDist>.5&&bossDist>.48)return {x,z};
 }
 return best;
}
const padDistance=(p)=>Math.hypot((p.x-s.x)/.23,(p.z-s.z)/47);
const crossesZero=(value,op)=>{
 if(op.kind!=='add'&&op.kind!=='sub')return false;
 const result=BlobMath.operation(value,op);
 return result===0||Math.sign(result)!==Math.sign(value);
};
function additive(delta){
 const op=delta>0?{kind:'add',n:delta}:{kind:'sub',n:-delta};
 return {...op,label:delta>0?'+'+delta:'−'+(-delta)};
}
function options(value){
 const sign=Math.sign(value)||1,mag=Math.abs(value);
 // Examples: −8 → (−8 is safe), (+16 crosses zero), (×(−1) is safe).
 // If only two lights are available, *both* remaining lights are safe.
 const safeChange=(s.round%3===1&&mag>4)?-sign*Math.min(4,mag-1):sign*8;
 const unsafeChange=-sign*(mag+8);
 const twoActive=s.pads.filter(p=>p.active).length<3;
 const a=additive(safeChange);
 const b=additive(twoActive?sign*6:unsafeChange);
 const factor=(s.round+s.padVisits.mul)%3===0?2:-1;
 const mult={kind:'mul',n:factor,label:factor<0?'×(−1)':'×2'};
 const byRole={addA:a,addB:b,mul:mult};
 return Object.keys(byRole).map(role=>{
  const item=byRole[role];
  const result=BlobMath.operation(value,item);
  return {role,kind:item.kind,op:{kind:item.kind,n:item.n},label:item.label,result,safe:!crossesZero(value,item)};
 });
}
function nextPad(role){
 const turn=s.padVisits[role]++;
 return {...locationForPad(role),role,id:`${role}-${turn}`,active:true,
  readyAt:0,warnAt:0,bornAt:s.arenaClock};
}
function refreshPads(){
 s.padVisits={addA:0,addB:0,mul:0};
 s.pads=[]; for(const role of roles)s.pads.push(nextPad(role));
 s.padReady=true;
 syncPads();
}
function syncPads(){
 const optionsByRole=Object.fromEntries(options(s.value).map(p=>[p.role,p]));
 for(const pad of s.pads){
  const o=optionsByRole[pad.role];
  Object.assign(pad,{op:o.op,result:o.result,label:o.label,safe:o.safe});
 }
}
function updatePads(){
 for(const pad of s.pads){
  if(!pad.active&&s.arenaClock>=pad.readyAt){
   pad.active=true;
   pad.bornAt=s.arenaClock;
   // A pad forming under the army must not activate without a new entry.
   if(padDistance(pad)<1)s.padReady=false;
   note('A new operation light has appeared.');
  }
 }
}
function note(text){$('notice').textContent=text;s.log.push(text);if(s.log.length>20)s.log.shift();}
function reset(){paused=false;$('pause').textContent='Pause';s={mode:'battle',forward:330,camera:0,x:0,z:460,tx:0,tz:460,value:entryArmy,hp:100,visualHP:100,sign:1,nextSign:-1,phase:'warn',timer:2.2,round:0,padVisits:{addA:0,addB:0,mul:0},padReady:true,arenaClock:0,pads:[],pulses:[],padGhosts:[],log:[],flip:0,wave:null,hit:0,placeAnim:0,poseMix:0,end:false,contact:0,canceling:false,absorbing:false,visualArmy:Math.abs(entryArmy)};refreshPads();note('Boss checkpoint · Dr. Fin starts at +100.');beginPhase('warn');$('result').hidden=true;}
function deploy(){
 s.placeAnim=.95;
 // Four independently moving armies enter from four separate parts of the
 // arena's outer rim: exactly two blue/positive and two red/negative.
 // Every group has a different value; none is a multiplication token.
 const values=[4,8,12,16,20,24];
 for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
 values.length=4;
 const signs=Math.random()<.5?[1,-1,1,-1]:[-1,1,-1,1];
 const newPulses=[];
 for(let i=0;i<4;i++){
  const theta=Math.PI*(.25+i*.5)+random(-.13,.13),radius=.89;
  const x=1.75*radius*Math.cos(theta),z=680+235*radius*Math.sin(theta);
  const waypoint={x:.58*Math.cos(theta+1.3),z:680+235*.45*Math.sin(theta+1.3)};
  const dx=waypoint.x-x,dz=(waypoint.z-z)/240,len=Math.hypot(dx,dz)||1;
  const speed=random(.46,.56),value=signs[i]*values[i];
  newPulses.push({id:`${s.round}-${i}`,x,z,vx:dx/len*speed,vz:dz/len*speed,
   speed,value,life:20,age:0,offsetX:random(-.48,.48),offsetZ:random(-.35,.35)});
 }
 s.pulses=newPulses; // Exactly four entering groups at a time.
 note('Four groups entered from the arena edge: two blue (+), two red (−), each a different value.');
}
function beginPhase(name){s.phase=name;s.nextSign=-s.sign;s.timer=({warn:1.9,wave:1.4,attack:3.0,open:5.8,recover:1.0})[name];
 const messages={warn:`SIGN WAVE INCOMING: Dr. Fin is turning ${s.nextSign>0?'positive':'negative'}. ×(−1) flips your army on contact.`,wave:'The sign wave is moving toward you — touching it multiplies your army by −1.',attack:'Four different armies enter from the arena edge: two blue and two red. Same signs add; opposite signs cancel.',open:'Dr. Fin is exposed. Opposite signs hurt him; matching signs heal him.',recover:'Recover and prepare for the next sign wave.'};note(messages[name]);}

function pulseResult(v,p){return v*p<0&&Math.abs(v)<=Math.abs(p)?0:v+p;}
function noteOnce(text){if(!s.contactNote){note(text);s.contactNote=true;}}
function stop(win,reason){if(win&&params.has('embedded'))parent.postMessage({type:'integer-boss-win',value:s.value},location.origin);s.end=true;s.mode=win?'victory':'lost';$('result').hidden=false;$('outcome').textContent=win?'Boss defeated!':(reason||'Zero — your swarm is gone.');note(win?'You canceled the boss body. Forward running resumes.':(reason||'Retry: absorb matching pulses, then grow before touching the opposite boss.'));}
function step(dt){if(paused||s.end)return;clock+=dt;s.arenaClock+=dt;s.placeAnim=Math.max(0,s.placeAnim-dt);s.hit=Math.max(0,s.hit-dt);s.visualHP+=(s.hp-s.visualHP)*Math.min(1,dt*7);s.visualArmy+=(Math.abs(s.value)-s.visualArmy)*Math.min(1,dt*9);
 if(s.mode==='approach'){s.forward+=150*dt;s.z=s.forward+100;s.tz=s.z;if(s.forward>=330){s.forward=330;s.z=430;s.tz=430;s.mode='battle';beginPhase('place');deploy();}return;}
 if(s.mode==='exit'){s.forward+=150*dt;s.timer-=dt;if(s.timer<=0)stop(true);return;}
 const dx=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0)+held.x,dz=(keys.has('ArrowUp')||keys.has('w')?1:0)-(keys.has('ArrowDown')||keys.has('s')?1:0)+held.z;
 if(dx||dz){const l=Math.hypot(dx,dz)||1;s.tx=s.x+dx/l*dt*1.8;s.tz=s.z+dz/l*dt*400;}
 let vx=s.tx-s.x,vz=(s.tz-s.z)/240,len=Math.hypot(vx,vz),travel=Math.min(len,dt*1.8);if(len){s.x+=vx/len*travel;s.z+=vz/len*travel*240;}
 let radius=Math.hypot(s.x/1.75,(s.z-680)/235);if(radius>.93){s.x*=.93/radius;s.z=680+(s.z-680)*.93/radius;}
 const dist=Math.hypot(s.x,(s.z-850)/240);
 if(dist<.35){const factor=.35/Math.max(.001,dist);s.x*=factor;s.z=850+(s.z-850)*factor;}
 s.camera+=(s.x*.55-s.camera)*Math.min(1,dt*9);
 updatePads();
 const tile=s.pads.findIndex(p=>p.active&&padDistance(p)<1);
 if(tile<0)s.padReady=true;
 if(s.padReady&&tile>=0){
  const pad=s.pads[tile],old=s.value,result=BlobMath.operation(old,pad.op);
  s.padReady=false;
  if(crossesZero(old,pad.op)){
   // Crossing zero is a loss even when the signed answer is nonzero.
   // Thus −8 + 16 = +8 loses on the way through zero.
   s.value=0;
   stop(false,`${signed(old)} ${pad.label} would pass through zero. Army lost!`);
   return;
  }
  s.value=result;
  if(!s.value){stop(false);return;}
  // If another light is still relocating, finish its arrival before
  // deactivating this one. This keeps two usable choices at all times,
  // even when the player reaches consecutive spots rapidly.
  const previous=s.pads.find(p=>!p.active);
  if(previous){previous.active=true;previous.readyAt=0;previous.bornAt=s.arenaClock;}
  // After use, the light fades from its old location; the new random
  // location starts glowing before that operation becomes available.
  s.padGhosts.push({...pad,expires:s.arenaClock+.52});
  const next=nextPad(pad.role);
  s.pads[tile]={...next,active:false,warnAt:s.arenaClock+.27,readyAt:s.arenaClock+1.58};
  syncPads(); // With only two active spots, BOTH are guaranteed safe.
  note(`${signed(old)} ${pad.label} = ${signed(s.value)}. A new light is forming elsewhere.`);
 }


 const contactAllowed=s.phase==='attack'||s.phase==='open';s.canceling=contactAllowed&&dist<.43&&s.value*s.sign<0;s.absorbing=contactAllowed&&dist<.43&&s.value*s.sign>0;
 if(s.canceling||s.absorbing){s.contact+=dt*10;const amount=Math.min(Math.floor(s.contact),Math.abs(s.value),s.absorbing?Infinity:s.hp);if(amount){s.contact-=amount;s.hp+=s.absorbing?amount:-amount;s.value=Math.sign(s.value)*(Math.abs(s.value)-amount);s.hit=.12;if(!s.value){stop(false);return;}if(!s.hp){s.mode='exit';s.timer=2.2;note('Boss canceled completely. Forward travel resumes.');return;}}noteOnce(s.absorbing?'Same sign: the boss absorbs your army and grows. Retreat!':'Opposite signs: both shrink. Retreat before zero.');}else{s.contact=0;s.contactNote=false;}
 s.padGhosts=s.padGhosts.filter(p=>p.expires>s.arenaClock);
 s.timer-=dt;
 if(s.timer<=0){
  const next={warn:'wave',wave:'attack',attack:'open',open:'recover',recover:'warn'}[s.phase];
  if(next==='wave'){
   s.sign=-s.sign;s.round++;
   s.wave={z:850,hit:false};s.hit=.5;
  }
  beginPhase(next);
  if(next==='attack')deploy();
 }
 if(s.phase==='wave')s.flip+=dt*9;
 if(s.wave){
  const previous=s.wave.z;
  s.wave.z-=320*dt;
  const crossed=(previous>=s.z&&s.wave.z<=s.z)||Math.abs(s.wave.z-s.z)<15;
  if(!s.wave.hit&&crossed){
   s.value=-s.value;s.wave.hit=true;syncPads();
   note(`Sign wave: ${signed(-s.value)} × (−1) = ${signed(s.value)}. Size unchanged.`);
  }
  if(s.wave.z<398)s.wave=null;
 }


 for(const p of s.pulses){
  p.age+=dt;p.life-=dt;
  // The first moment is an independent diagonal arrival, not a beeline at
  // the player's center. Later each group gently homes toward a DIFFERENT
  // offset near the army, so groups do not stack on one another.
  if(p.age>1.15){
   const targetX=s.x+p.offsetX,targetZ=s.z+p.offsetZ*240;
   const dx=targetX-p.x,dz=(targetZ-p.z)/240,len=Math.hypot(dx,dz)||1;
   const steer=Math.min(1,dt*.72);
   const vx=p.vx*(1-steer)+(dx/len)*p.speed*steer;
   const vz=p.vz*(1-steer)+(dz/len)*p.speed*steer;
   const norm=Math.hypot(vx,vz)||1;
   p.vx=vx/norm*p.speed;p.vz=vz/norm*p.speed;
  }
  p.x+=p.vx*dt;p.z+=p.vz*240*dt;
  const boundary=Math.hypot(p.x/1.75,(p.z-680)/235);
  if(boundary>.9){p.x*=.9/boundary;p.z=680+(p.z-680)*.9/boundary;
   const dx=-p.x,dz=(680-p.z)/240,len=Math.hypot(dx,dz)||1;
   p.vx=dx/len*p.speed;p.vz=dz/len*p.speed;}
  if(Math.hypot(p.x-s.x,(p.z-s.z)/240)<.22&&p.life>0){
   const old=s.value;s.value=pulseResult(old,p.value);
   note(`${signed(old)} + (${signed(p.value)}) = ${signed(s.value)} ${old*p.value>0?'· absorbed':'· canceled'}`);
   p.life=0;if(!s.value){stop(false,'Zero crossed while meeting an opposing swarm.');return;}
  }
 }
 s.pulses=s.pulses.filter(p=>p.life>0);syncPads();
}
function poly(points,color){g.fillStyle=color;g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fill();}
function label(x,y,text,color,size=15){g.font=`800 ${size}px system-ui`;const w=g.measureText(text).width+14;g.fillStyle=color;g.beginPath();g.roundRect(x-w/2,y-size*.7,w,size+10,6);g.fill();g.fillStyle='#fff';g.textAlign='center';g.fillText(text,x,y+4);}
function line(points,color,width=1){g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();}
// Fixed distant scenery; only world geometry uses the traveling projection.
function scenery(){
 if(forest.complete&&forest.naturalWidth){g.drawImage(forest,0,0,W,H);return;}
 const sky=g.createLinearGradient(0,0,0,H*.3);sky.addColorStop(0,'#75a9c5');sky.addColorStop(1,'#e5d9be');g.fillStyle=sky;g.fillRect(0,0,W,H);
 g.fillStyle='#fff0c166';g.beginPath();g.arc(W*.76,H*.17,W*.08,0,7);g.fill();
 for(let layer=0;layer<3;layer++){const y=H*(.19+layer*.035);const points=[{x:0,y:H*.36}];for(let i=0;i<=12;i++)points.push({x:i*W/12,y:y-Math.abs(Math.sin(i*2.7+layer))*H*(.06-layer*.012)});points.push({x:W,y:H*.36});poly(points,['#a5b8bb','#849fa8','#657e8d'][layer]);}
 const abyss=g.createLinearGradient(0,H*.29,0,H);abyss.addColorStop(0,'#75838c');abyss.addColorStop(.45,'#384659');abyss.addColorStop(1,'#101a2b');g.fillStyle=abyss;g.fillRect(0,H*.3,W,H*.7);
 for(const side of [-1,1]){const edge=side<0?0:W;for(let i=0;i<8;i++){const y=H*(.29+i*.095),w=W*(.12+.05*Math.sin(i*3+side));poly([{x:edge,y},{x:edge-side*w,y:y+H*.02},{x:edge-side*w*.55,y:y+H*.22},{x:edge,y:y+H*.25}],i%2?'#3b4859':'#4c5967');line([{x:edge-side*w,y:y+H*.02},{x:edge-side*w*.55,y:y+H*.22}],'#73808a55',1);}}
}
function paving(bounds,start,end,arena=false){g.save();g.beginPath();bounds.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.clip();
 if(stone.complete&&stone.naturalWidth){for(let z=Math.floor(start/4)*4;z<end;z+=4){const l=project(-2,z),r=project(2,z),far=project(-2,z+4),sy=((z%280)+280)%280/280*stone.naturalHeight,sh=Math.min(stone.naturalHeight-sy,stone.naturalHeight*4/280);for(let t=0;t<2;t++)g.drawImage(stone,0,sy,stone.naturalWidth,Math.max(1,sh),l.x+t*(r.x-l.x)/2,far.y,(r.x-l.x)/2+1,Math.max(1,l.y-far.y+1));}g.restore();return;}
 for(let z=Math.floor(start/42)*42;z<end;z+=42){const row=Math.floor(z/42);for(let col=-6;col<7;col++){const x=col*.3+(row%2)*.15,shade=Math.sin(row*18.3+col*42.1);const tile=[project(x,z),project(x+.29,z),project(x+.29,z+40),project(x,z+40)];poly(tile,`hsl(37,${arena?36:32}%,${65+shade*6}%)`);line([...tile,tile[0]],'#6d624f99',.8);line([tile[3],tile[2]],'#eee1bf88',1);
 if((row+col)%3===0){const q=project(x+.03,z+4);g.fillStyle='#536c31';g.beginPath();g.ellipse(q.x,q.y,5*q.sc,2.2*q.sc,shade,0,7);g.fill();g.fillStyle='#839643';g.beginPath();g.ellipse(q.x+2*q.sc,q.y-1,2.8*q.sc,1.4*q.sc,0,0,7);g.fill();}
 if((row+col)%4===0){const q=project(x+.12,z+12),r=project(x+.19,z+23);line([q,{x:q.x+2,y:r.y},r,{x:r.x+3*r.sc,y:r.y+2}],'#675b48aa',1);}}
 }g.restore();}
// Map the floor material onto masonry faces with a lightweight affine transform.
function masonryFace(points,tint=0){poly(points,'#b29b73');if(stone.complete&&stone.naturalWidth){const [a,b,c,d]=points;g.save();g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.clip();g.transform((b.x-a.x)/256,(b.y-a.y)/256,(d.x-a.x)/128,(d.y-a.y)/128,a.x,a.y);g.drawImage(stone,0,0,256,128);g.restore();}if(tint){g.save();g.globalAlpha=tint;poly(points,'#182b30');g.restore();}}
function pier(x,z,width,depth){const q=project(x,z),w=width*q.sc,h=depth*q.sc,off=w*.42;
 for(let y=0;y<h;y+=22*q.sc){const dh=Math.min(22*q.sc,h-y),t=y/h,flare=1+t*.16;
 const a={x:q.x-w*flare,y:q.y+y},b={x:q.x+w*.3*flare,y:q.y+y},c={x:b.x,y:b.y+dh},d={x:a.x,y:a.y+dh};
 masonryFace([a,b,c,d],.22+t*.20);masonryFace([b,{x:b.x+off,y:b.y-4*q.sc},{x:c.x+off,y:c.y-4*q.sc},c],.45+t*.15);
 line([d,c],'#3e493b66',.8);}
 // Mist follows the silhouette, without rectangular overlays across the scenery.
 g.save();g.globalAlpha=.3;g.strokeStyle='#587347';g.lineWidth=2*q.sc;g.beginPath();g.moveTo(q.x-w*.7,q.y);g.bezierCurveTo(q.x-w*.3,q.y+h*.1,q.x-w*.9,q.y+h*.25,q.x-w*.5,q.y+h*.4);g.stroke();g.restore();}
function supports(){for(let z=1300;z>-120;z-=190){if(z>410&&z<950)continue;pier(0,z,34,620);}
 for(const x of [-1.18,1.18]){const z=680-Math.sqrt(1-(x/1.75)**2)*235;pier(x,z,40,620);}}
// Small masonry segments remain attached to world coordinates as the camera moves.
function wallSegment(x1,z1,x2,z2,index,low=false){
 const a=project(x1,z1),b=project(x2,z2),height=low?14:30;
 const at={x:a.x,y:a.y-height*a.sc},bt={x:b.x,y:b.y-height*b.sc};
 masonryFace([at,bt,b,a],.10);
 line([a,b],'#6a604b99',1);line([at,bt],'#e3cea2',2);
 const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},sc=(a.sc+b.sc)/2;
 line([{x:mid.x,y:mid.y},{x:mid.x,y:mid.y-height*sc}],'#645a4699',1);
 line([{x:a.x,y:a.y-height*a.sc*.5},{x:b.x,y:b.y-height*b.sc*.5}],'#6f604a99',.8);
 // Cap has a visible lit upper surface and darker outward face.
 masonryFace([at,bt,{x:bt.x+3*b.sc,y:bt.y-3*b.sc},{x:at.x+3*a.sc,y:at.y-3*a.sc}]);
 if(index%3===0){g.fillStyle='#577238';g.beginPath();g.ellipse(mid.x,mid.y-height*sc,4*sc,1.8*sc,0,0,7);g.fill();line([{x:mid.x,y:mid.y-height*sc},{x:mid.x+2*sc,y:mid.y+5*sc}],'#536a35',1.3*sc);}
 if(index%4===0){line([{x:mid.x+3*sc,y:mid.y-height*sc*.8},{x:mid.x,y:mid.y-height*sc*.55},{x:mid.x+2*sc,y:mid.y-height*sc*.25}],'#6e614d',.8);}
 if(index%4===0&&!low){const pw=8*sc,ph=40*sc;g.fillStyle='#817054';g.fillRect(mid.x-pw,mid.y-ph,pw*2,ph);g.fillStyle='#b7a17a';g.fillRect(mid.x-pw,mid.y-ph,pw*1.3,ph);g.fillStyle='#ead8af';g.fillRect(mid.x-pw-2*sc,mid.y-ph-3*sc,pw*2+4*sc,5*sc);line([{x:mid.x-pw,y:mid.y-ph*.5},{x:mid.x+pw,y:mid.y-ph*.5}],'#746348',1);}
}
function bridgeWalls(){for(let z=1440;z>-150;z-=36){if(z>410&&z<950)continue;for(const side of [-1,1])wallSegment(side*.46,z,side*.46,z+36,Math.floor(z/36));}}
function arenaWalls(){for(let i=0;i<72;i++){const a=i*Math.PI*2/72,b=(i+1)*Math.PI*2/72;
 // Entrance and exit stay open; foreground walls are lower for visibility.
 if(Math.abs(Math.cos(a))<.28)continue;
 wallSegment(Math.cos(a)*1.75,680+Math.sin(a)*235,Math.cos(b)*1.75,680+Math.sin(b)*235,i,Math.sin(a)<-.3);}}
function draw(){scenery();supports();
 const path=[project(-.45,-150),project(.45,-150),project(.45,1500),project(-.45,1500)];poly(path.map(p=>({x:p.x,y:p.y+18*p.sc})),'#514b43');poly(path,'#b5a07a');paving(path,Math.max(-150,s.forward-140),s.forward+1400);
 bridgeWalls();
 const outline=Array.from({length:81},(_,i)=>{const a=i*Math.PI*2/80;return project(Math.cos(a)*1.75,680+Math.sin(a)*235);});
 poly(outline.map(p=>({x:p.x,y:p.y+35*p.sc})),'#4b4e3c');
 for(let i=0;i<40;i++){const a=outline[i],b=outline[i+1];masonryFace([a,b,{x:b.x,y:b.y+34*b.sc},{x:a.x,y:a.y+34*a.sc}],.26);}
 poly(outline,'#c5aa80');paving(outline,440,930,true);line(outline,'#d8c49b',3);
 arenaWalls();
 // The operations are glowing words *on* the stone floor, not floating
 // labels or physical button discs. Spots fade out, then respawn elsewhere.
 if(s.mode!=='approach')for(const pad of [...s.padGhosts,...s.pads]){
  const ghost=pad.expires!==undefined;
  const warning=!ghost&&!pad.active&&s.arenaClock>=pad.warnAt&&s.arenaClock<pad.readyAt;
  if(!ghost&&!pad.active&&!warning)continue;
  const p=project(pad.x,pad.z),rx=half*.225*p.sc,ry=rx*.50;
  // The sign of the *operation* determines the light color.
  const negative=/[−-]/.test(pad.label);
  const light=negative?{
   inner:'255,215,223',mid:'255,71,111',outer:'255,34,70',
   rim:'255,129,146',shadow:'#ff4969',ink:'#fff7f7',outline:'#52182c'
  }:{
   inner:'215,251,255',mid:'60,206,249',outer:'27,112,229',
   rim:'128,225,255',shadow:'#41cfff',ink:'#f9ffff',outline:'#103957'
  };
  const timeIn=ghost?clamp((pad.expires-s.arenaClock)/.52,0,1):
   warning?clamp((s.arenaClock-pad.warnAt)/(pad.readyAt-pad.warnAt),0,1):
   clamp((s.arenaClock-pad.bornAt)/.65,0,1);
  const power=timeIn*(.95+.05*Math.sin(clock*6+pad.x*3));
  // Measure the operation so long values like ×(−1) fit within the light.
  const fontPx=Math.max(38,54*p.sc);
  g.save();g.translate(p.x,p.y);g.scale(1,.61);
  g.font=`italic 900 ${fontPx}px system-ui`;
  const radiusX=Math.max(rx,g.measureText(pad.label).width*.61);
  // Keep the light vivid at the edges without whitening the center
  // enough to hide the letters.
  g.globalCompositeOperation='screen';
  const glow=g.createRadialGradient(0,0,0,0,0,radiusX*2.25);
  glow.addColorStop(0,`rgba(${light.inner},${.34*power})`);
  glow.addColorStop(.24,`rgba(${light.mid},${.40*power})`);
  glow.addColorStop(.57,`rgba(${light.outer},${.20*power})`);
  glow.addColorStop(1,`rgba(${light.outer},0)`);
  g.fillStyle=glow;g.beginPath();g.arc(0,0,radiusX*2.25,0,Math.PI*2);g.fill();
  g.shadowColor=light.shadow;g.shadowBlur=12*power;
  g.strokeStyle=`rgba(${light.rim},${.85*power})`;
  g.lineWidth=Math.max(1.5,2.6*p.sc);
  g.beginPath();g.ellipse(0,0,radiusX*(.98+.04*Math.sin(clock*5)),rx*.74,0,0,Math.PI*2);g.stroke();
  g.strokeStyle=`rgba(${light.inner},${.40*power})`;
  g.lineWidth=Math.max(.8,1.3*p.sc);
  g.beginPath();g.ellipse(0,0,radiusX*1.15,rx*.87,0,0,Math.PI*2);g.stroke();
  if(!warning){
   // Switch away from screen blending for the letters themselves:
   // luminous white lettering needs a crisp, dark boundary on light stone.
   g.save();g.scale(1,1.16);
   g.globalCompositeOperation='source-over';
   g.globalAlpha=power;
   g.textAlign='center';g.textBaseline='middle';
   g.font=`italic 900 ${fontPx}px system-ui`;
   g.lineJoin='round';
   g.shadowBlur=0;
   g.strokeStyle=light.outline;
   g.lineWidth=7.2;
   g.strokeText(pad.label,0,0);
   g.strokeStyle=negative?'#ef4968':'#208ec5';
   g.lineWidth=3.2;
   g.strokeText(pad.label,0,0);
   g.fillStyle=light.ink;
   g.fillText(pad.label,0,0);
   g.restore();
  }
  g.restore();
  // Brief tongues of energy announce a forming spot without an icon.
  if(warning){
   g.save();g.globalAlpha=power*.95;g.strokeStyle=negative?'#ff9aa8':'#b2f5ff';g.shadowColor=light.shadow;g.shadowBlur=14*power;g.lineWidth=1.8*p.sc;
   for(let i=0;i<6;i++){
    const a=i*Math.PI/3+clock*2.3,x=Math.cos(a)*rx,y=Math.sin(a)*ry;
    g.beginPath();g.moveTo(p.x+x,p.y+y);
    g.lineTo(p.x+x*.92+Math.sin(clock*7+i)*3,p.y+y-8*p.sc);
    g.stroke();
   }g.restore();
  }
 }


 const boss=project(0,850),scale=.4+.6*Math.sqrt(Math.max(0,s.visualHP)/100),h=H*.34*boss.sc*scale,w=h*1.05;
 g.fillStyle='#25332d44';g.beginPath();g.ellipse(boss.x+4,boss.y+2,w*.38,h*.07,0,0,7);g.fill();
 // Transform around the feet, never the canvas origin. Each pose shares a cell baseline.
 const placing=s.placeAnim>0,stomping=s.phase==='warn'||s.phase==='wave',hurting=s.canceling&&s.hit>0;
 const pose=hurting?3:stomping?2:placing?1:0;
 const squash=stomping?1-.07*Math.sin(Math.min(1,s.timer/1.2)*Math.PI):1;
 const twist=s.phase==='wave'?Math.sin(clock*9)*.12:0;
 const wobble=hurting?Math.sin(clock*28)*.045:s.absorbing?Math.sin(clock*10)*.025:Math.sin(clock*4)*.012;
 g.save();g.translate(boss.x,boss.y);g.rotate(twist+wobble);g.scale(1/squash,squash);
 if(s.mode==='exit'||s.mode==='victory')g.globalAlpha=Math.max(0,s.timer/2.2);
 if(sprite.complete&&sprite.naturalWidth){const cw=sprite.naturalWidth/4,ch=sprite.naturalHeight/2;
 const imageSign=s.sign;
 if(s.renderPose!==pose){s.previousPose=s.renderPose??pose;s.renderPose=pose;s.poseStarted=clock;}
 const blend=Math.min(1,(clock-s.poseStarted)/.14),alpha=g.globalAlpha;
 if(blend<1){g.globalAlpha=alpha*(1-blend);g.drawImage(sprite,s.previousPose*cw+24,imageSign>0?0:ch,cw-48,ch,-w/2,-h,w,h);}
 g.globalAlpha=alpha*blend;g.drawImage(sprite,pose*cw+24,imageSign>0?0:ch,cw-48,ch,-w/2,-h,w,h);
 }else{g.drawImage(creatures[s.sign][pose%4],-w/2,-h,w,h);}g.restore();

 label(boss.x,boss.y-h-20,`${signed(s.sign*s.hp)} BOSS`,s.sign>0?'#126caa':'#b93451',Math.max(12,16*boss.sc));
 if(s.phase==='warn')label(boss.x,boss.y-h-45,`Turning: ${s.nextSign>0?'+':'−'}`,s.nextSign>0?'#126caa':'#b93451',14);
 if(s.wave){const q=project(0,s.wave.z),swell=.78+.22*Math.sin(clock*10);g.strokeStyle='#dff8ff';g.lineWidth=6;g.beginPath();g.ellipse(q.x,q.y,half*1.32*q.sc,16*q.sc*swell,0,0,7);g.stroke();g.strokeStyle='#7be7ff';g.lineWidth=2.2;g.beginPath();g.ellipse(q.x,q.y,half*1.22*q.sc,10*q.sc*swell,0,0,7);g.stroke();label(q.x,q.y-8,'×(−1)','#794c97',14);}
 if(s.phase==='wave'){g.strokeStyle=s.sign>0?'#7ae7ff':'#ff8eaf';g.lineWidth=4;g.beginPath();g.ellipse(boss.x,boss.y-h*.5,w*.7,h*.55,s.flip*.3,0,Math.PI*1.8);g.stroke();}
 for(const p of [...s.pulses].sort((a,b)=>b.z-a.z)){
  const q=project(p.x,p.z),count=Math.min(22,Math.abs(p.value));
  const r=Math.max(4.5,7.4*q.sc),spread=Math.sqrt(count)*r*1.1;
  const sign=p.value<0?-1:1;
  for(let i=0;i<count;i++){
   const a=i*2.399963,d=Math.sqrt((i+.5)/count)*spread;
   const bx=q.x+Math.cos(a)*d,by=q.y+Math.sin(a)*d*.45;
   g.drawImage(creatures[sign][i%4],bx-r,by-r*2+Math.sin(clock*8+i)*r*.18,r*2,r*2);
  }
  label(q.x,q.y-spread*.55-22*r/8,signed(p.value),sign>0?'#176bb0':'#bb304f',Math.max(11,14*q.sc));
 }
 const player=project(s.x,s.z),n=Math.min(65,Math.max(0,Math.round(s.visualArmy))),r=Math.min(10,H*.016)*player.sc,spread=Math.min(H*.10,Math.sqrt(n)*r*1.1);
 g.fillStyle='#25332d44';g.beginPath();g.ellipse(player.x+3,player.y+2,spread+5,spread*.5,0,0,7);g.fill();
 for(let i=0;i<n;i++){const a=i*2.4,d=Math.sqrt((i+.5)/n)*spread,x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d*.45;g.drawImage(creatures[s.value<0?-1:1][i%4],x-r,y-r*2+Math.sin(clock*7+i)*r*.15,r*2,r*2);}
 if(s.canceling||s.absorbing){const mid={x:(player.x+boss.x)/2,y:(player.y+boss.y)/2};line([{x:mid.x-W*.06,y:mid.y},{x:mid.x+W*.06,y:mid.y}],'#f1fbff',5);for(let i=0;i<8;i++){g.fillStyle=i%2?'#8de7ff':'#ffa1b6';g.beginPath();g.arc(mid.x+Math.sin(i*9+clock*8)*W*.05,mid.y-i%3*4,2,0,7);g.fill();}}
 label(player.x,player.y+spread*.5+23,signed(s.value),s.value>0?'#147bbb':'#c33953',18);
 $('phase').textContent=s.mode==='approach'?'Approaching arena':s.mode==='exit'?'Boss defeated':paused?'Paused':({warn:'SIGN WAVE INCOMING',wave:'×(−1) WAVE',attack:'FOUR EDGE SWARMS',open:'BOSS EXPOSED',recover:'RECOVERY'})[s.phase];
 $('health').textContent=`Dr. Fin · ${s.hp}`;
}
function frame(t){const dt=Math.min(.05,last?(t-last)/1000:0);last=t;step(dt);draw();requestAnimationFrame(frame);}function pointer(e){const r=c.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,far=1/(1+1100/510),sc=clamp(far+(py-horizon)*(1-far)/(near-horizon),.4,1.2);s.tx=(px-W/2)/(half*sc)+s.camera;s.tz=s.forward+510*(1/sc-1);}
c.onpointerdown=e=>{drag=true;c.setPointerCapture(e.pointerId);pointer(e);};c.onpointermove=e=>{if(drag)pointer(e);};c.onpointerup=c.onpointercancel=()=>drag=false;
function pause(){paused=!paused;$('pause').textContent=paused?'Resume':'Pause';} $('pause').onclick=pause;$('restart').onclick=$('retry').onclick=reset;
$('help').onclick=()=>{paused=true;$('pause').textContent='Resume';$('helpDialog').showModal();};$('closeHelp').onclick=()=>{$('helpDialog').close();};$('start').onclick=()=>{$('intro').close();reset();};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else note('Use Safari’s Add to Home Screen for a full-screen view.');}catch(e){note('Fullscreen is unavailable in this browser.');}};
for(const button of document.querySelectorAll('[data-x]')){button.onpointerdown=e=>{e.preventDefault();held={x:+button.dataset.x,z:+button.dataset.z};button.setPointerCapture(e.pointerId);};button.onpointerup=button.onpointercancel=()=>held={x:0,z:0};}
addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key))e.preventDefault();if(key===' '&&!e.repeat)pause();if(key==='r'&&!e.repeat)reset();keys.add(key);});addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));addEventListener('blur',()=>{keys.clear();held={x:0,z:0};if(!s.end){paused=true;$('pause').textContent='Resume';}});
$('menu').onclick=()=>{if(params.has('embedded'))parent.postMessage({type:'integer-boss-menu'},location.origin);else location.href='https://keeganfinlayson.github.io/Integer-Run/';};
window.BossLab={snapshot:()=>JSON.parse(JSON.stringify(s)),project:(x,z)=>project(x,z),options,crossesZero,pulseResult,draw,test:(patch)=>Object.assign(s,patch),step};reset();if(params.has('embedded')||params.has('autostart')){$('intro').close();}else paused=true;requestAnimationFrame(frame);
})();
