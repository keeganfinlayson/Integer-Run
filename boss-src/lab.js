(()=>{'use strict';
const c=document.querySelector('canvas'),g=c.getContext('2d'),$=id=>document.getElementById(id),sprite=new Image();sprite.src='assets/dr-fin-poses.webp';const stone=new Image();stone.src='assets/mossy-stone.webp';const forest=new Image();forest.src='assets/forest-chasm.webp';const creatures=BlobArt.creatures(),keys=new Set();let s,W,H,half,near,horizon,clock=0,last=0,paused=false,drag=false,held={x:0,z:0};
const params=new URLSearchParams(location.search),entry=Number(params.get('army')),entryArmy=Number.isSafeInteger(entry)&&entry!==0&&Math.abs(entry)<=1000000?entry:12;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),signed=BlobMath.signed;
function resize(){const r=c.getBoundingClientRect();W=r.width;H=r.height;const d=Math.min(devicePixelRatio||1,1.5);c.width=W*d;c.height=H*d;g.setTransform(d,0,0,d,0,0);half=W*.38;near=H*.88;horizon=H*.22;}addEventListener('resize',resize);resize();
function project(x,z){const d=z-s.forward,sc=1/(1+Math.max(-130,d)/510),far=1/(1+1100/510);return {x:W/2+(x-s.camera)*half*sc,y:horizon+(near-horizon)*(sc-far)/(1-far),sc};}
const locations=[{x:-1.38,z:720,kind:'mul',bank:-1},{x:-.83,z:515,kind:'add',bank:-1},{x:.83,z:515,kind:'add',bank:1},{x:1.38,z:720,kind:'mul',bank:1}];
function options(value){return locations.map(p=>{const n=p.kind==='add'?(p.bank<0?-Math.max(8,value+8):Math.max(8,8-value)):Math.sign(value)===p.bank?2:-1;const op={kind:p.kind,n};return {...p,op,result:BlobMath.operation(value,op),label:p.kind==='add'?(n<0?'−'+Math.abs(n):'+'+n):(n<0?`×(−${Math.abs(n)})`:'×'+n)};});}
function refreshPads(){s.pads=options(s.value);s.used=false;s.dwell=0;s.hover=-1;s.padReady=!locations.some(p=>Math.hypot(p.x-s.x,(p.z-s.z)/240)<.24);}
function note(text){$('notice').textContent=text;s.log.push(text);if(s.log.length>20)s.log.shift();}
function reset(){paused=false;$('pause').textContent='Pause';s={mode:'approach',forward:0,camera:0,x:0,z:100,tx:0,tz:100,value:entryArmy,hp:100,visualHP:100,sign:1,nextSign:-1,phase:'place',timer:1.2,shotTimer:2.4,shotCount:0,round:0,used:false,touched:false,pads:[],pulses:[],log:[],flip:0,wave:null,hit:0,placeAnim:0,poseMix:0,end:false,contact:0,canceling:false,visualArmy:Math.abs(entryArmy)};s.mode='battle';s.forward=330;s.z=460;s.tz=460;refreshPads();note('Boss checkpoint · Dr. Fin starts at 100.');deploy();$('result').hidden=true;}
function deploy(){s.placeAnim=.9;for(let i=0;i<3;i++)s.pulses.push({x:(i-1)*.25,z:805,value:s.sign*4,life:30});s.shotTimer=2.4;}
function beginPhase(name){s.phase=name;s.nextSign=-s.sign;s.timer=({place:1.2,feint:2.5,flip:.6,open:4,stompwarn:1.2,stomp:.65})[name];refreshPads();
 const messages={plan:'Prepare: choose your sign and size.',place:'Dr. Fin places three blobs on the floor.',feint:`Boss will turn ${s.sign>0?'NEGATIVE −':'POSITIVE +'}; placed blobs keep their color.`,flip:'Quick sign change!',open:'Approach with the opposite sign. Retreat before zero.',stompwarn:'Sign wave coming: ×(−1). Your size will stay the same.',stomp:'The wave flips your army once.',recover:'Recover and plan your next approach.'};note(messages[name]);}
function pulseResult(v,p){return v*p<0&&Math.abs(v)<=Math.abs(p)?0:v+p;}
function noteOnce(text){if(!s.contactNote){note(text);s.contactNote=true;}}
function stop(win){if(win&&params.has('embedded'))parent.postMessage({type:'integer-boss-win',value:s.value},location.origin);s.end=true;s.mode=win?'victory':'lost';$('result').hidden=false;$('outcome').textContent=win?'Boss defeated!':'Zero — your swarm is gone.';note(win?'You canceled the boss body. Forward running resumes.':'Retry: absorb matching pulses, then grow before touching the opposite boss.');}
function step(dt){if(paused||s.end)return;clock+=dt;s.placeAnim=Math.max(0,s.placeAnim-dt);s.hit=Math.max(0,s.hit-dt);s.visualHP+=(s.hp-s.visualHP)*Math.min(1,dt*7);s.visualArmy+=(Math.abs(s.value)-s.visualArmy)*Math.min(1,dt*9);
 if(s.mode==='approach'){s.forward+=150*dt;s.z=s.forward+100;s.tz=s.z;if(s.forward>=330){s.forward=330;s.z=430;s.tz=430;s.mode='battle';beginPhase('place');deploy();}return;}
 if(s.mode==='exit'){s.forward+=150*dt;s.timer-=dt;if(s.timer<=0)stop(true);return;}
 const dx=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0)+held.x,dz=(keys.has('ArrowUp')||keys.has('w')?1:0)-(keys.has('ArrowDown')||keys.has('s')?1:0)+held.z;
 if(dx||dz){const l=Math.hypot(dx,dz)||1;s.tx=s.x+dx/l*dt*1.8;s.tz=s.z+dz/l*dt*400;}
 let vx=s.tx-s.x,vz=(s.tz-s.z)/240,len=Math.hypot(vx,vz),travel=Math.min(len,dt*1.8);if(len){s.x+=vx/len*travel;s.z+=vz/len*travel*240;}
 let radius=Math.hypot(s.x/1.75,(s.z-680)/235);if(radius>.93){s.x*=.93/radius;s.z=680+(s.z-680)*.93/radius;}
 const dist=Math.hypot(s.x,(s.z-850)/240);
 if(dist<.35){const factor=.35/Math.max(.001,dist);s.x*=factor;s.z=850+(s.z-850)*factor;}
 s.camera+=(s.x*.55-s.camera)*Math.min(1,dt*9);
 const tile=s.pads.findIndex(p=>Math.hypot(p.x-s.x,(p.z-s.z)/240)<.16);
 if(tile<0){s.padReady=true;s.dwell=0;s.hover=-1;}
 if(s.padReady&&tile>=0){const pad=s.pads[tile],old=s.value;s.value=BlobMath.operation(old,pad.op);s.padReady=false;note(`${signed(old)} ${pad.label} = ${signed(s.value)}. Leave the circle to activate another.`);if(!s.value){stop(false);return;}s.pads=options(s.value);}

 s.canceling=s.phase!=='flip'&&dist<.43&&s.value*s.sign<0;s.absorbing=s.phase!=='flip'&&dist<.43&&s.value*s.sign>0;
 if(s.canceling||s.absorbing){s.contact+=dt*10;const amount=Math.min(Math.floor(s.contact),Math.abs(s.value),s.absorbing?Infinity:s.hp);if(amount){s.contact-=amount;s.hp+=s.absorbing?amount:-amount;s.value=Math.sign(s.value)*(Math.abs(s.value)-amount);s.hit=.12;if(!s.value){stop(false);return;}if(!s.hp){s.mode='exit';s.timer=2.2;note('Boss canceled completely. Forward travel resumes.');return;}}noteOnce(s.absorbing?'Same sign: the boss absorbs your army and grows. Retreat!':'Opposite signs: both shrink. Retreat before zero.');}else{s.contact=0;s.contactNote=false;}
 s.shotTimer-=dt;if(s.shotTimer<=0&&s.phase!=='stomp'&&s.phase!=='flip')deploy();
 s.timer-=dt;
 if(s.timer<=0){
  const next={place:'feint',feint:'flip',flip:'open',open:'stompwarn',stompwarn:'stomp',stomp:'place'}[s.phase];
  if(s.phase==='flip'){s.sign=-s.sign;s.round++;}
  beginPhase(next);
  if(next==='place')deploy();
  if(next==='stomp')s.wave={z:850,hit:false};
 }
 if(s.phase==='flip')s.flip+=dt*9;
 if(s.wave){s.wave.z-=180*dt;if(!s.wave.hit&&s.wave.z<=s.z){s.value=-s.value;s.wave.hit=true;s.pads=options(s.value);note(`×(−1): your army is now ${signed(s.value)}. Magnitude unchanged.`);}if(s.wave.z<360)s.wave=null;}

 for(const p of s.pulses){const dx=s.x-p.x,dz=(s.z-p.z)/240,l=Math.hypot(dx,dz)||1;p.x+=dx/l*.24*dt;p.z+=dz/l*58*dt;p.life-=dt;if(Math.hypot(p.x-s.x,(p.z-s.z)/240)<.2&&p.life>0){const old=s.value;s.value=pulseResult(old,p.value);note(`${signed(old)} + (${signed(p.value)}) = ${signed(s.value)} ${old*p.value>0?'· absorbed':'· canceled'}`);p.life=0;if(!s.value){stop(false);return;}}}s.pulses=s.pulses.filter(p=>p.life>0);s.pads=options(s.value);
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
 if(s.mode!=='approach')for(const [i,pad] of s.pads.entries()){const p=project(pad.x,pad.z),rx=W*.12*p.sc,ry=rx*.52;g.globalAlpha=1;g.fillStyle='#152c3544';g.beginPath();g.ellipse(p.x+2,p.y+6,rx+4,ry+3,0,0,7);g.fill();g.fillStyle='#8a7b5e';g.beginPath();g.ellipse(p.x,p.y+3,rx+3,ry+3,0,0,7);g.fill();const padLight=g.createLinearGradient(p.x-rx,p.y-ry,p.x+rx,p.y+ry);padLight.addColorStop(0,pad.bank<0?'#d66b66':'#529eaf');padLight.addColorStop(1,pad.bank<0?'#9c3445':'#246382');g.fillStyle=padLight;g.strokeStyle='#e7d9b6';g.lineWidth=2;g.beginPath();g.ellipse(p.x,p.y,rx,ry,0,0,7);g.fill();g.stroke();g.fillStyle='#fff';g.font=`800 ${Math.max(13,22*p.sc)}px system-ui`;g.textAlign='center';g.fillText(pad.label,p.x,p.y+4);g.font=`700 ${Math.max(10,14*p.sc)}px system-ui`;g.fillText(`→ ${pad.result<0?"−"+Math.abs(pad.result):pad.result}`,p.x,p.y+ry+16);g.globalAlpha=1;}
 const boss=project(0,850),scale=.4+.6*Math.sqrt(Math.max(0,s.visualHP)/100),h=H*.34*boss.sc*scale,w=h*1.05;
 g.fillStyle='#25332d44';g.beginPath();g.ellipse(boss.x+4,boss.y+2,w*.38,h*.07,0,0,7);g.fill();
 // Transform around the feet, never the canvas origin. Each pose shares a cell baseline.
 const placing=s.placeAnim>0,stomping=s.phase==='stompwarn'||s.phase==='stomp',hurting=s.canceling&&s.hit>0;
 const pose=hurting?3:stomping?2:placing?1:0;
 const squash=stomping?1-.07*Math.sin(Math.min(1,s.timer/1.2)*Math.PI):1;
 const twist=s.phase==='flip'?Math.sin((.6-s.timer)/.6*Math.PI)*.18:0;
 const wobble=hurting?Math.sin(clock*28)*.045:s.absorbing?Math.sin(clock*10)*.025:Math.sin(clock*4)*.012;
 g.save();g.translate(boss.x,boss.y);g.rotate(twist+wobble);g.scale(1/squash,squash);
 if(s.mode==='exit'||s.mode==='victory')g.globalAlpha=Math.max(0,s.timer/2.2);
 if(sprite.complete&&sprite.naturalWidth){const cw=sprite.naturalWidth/4,ch=sprite.naturalHeight/2;
 const imageSign=s.phase==='flip'&&s.timer<.3?-s.sign:s.sign;
 if(s.renderPose!==pose){s.previousPose=s.renderPose??pose;s.renderPose=pose;s.poseStarted=clock;}
 const blend=Math.min(1,(clock-s.poseStarted)/.14),alpha=g.globalAlpha;
 if(blend<1){g.globalAlpha=alpha*(1-blend);g.drawImage(sprite,s.previousPose*cw+24,imageSign>0?0:ch,cw-48,ch,-w/2,-h,w,h);}
 g.globalAlpha=alpha*blend;g.drawImage(sprite,pose*cw+24,imageSign>0?0:ch,cw-48,ch,-w/2,-h,w,h);
 }g.restore();

 label(boss.x,boss.y-h-20,`${signed(s.sign*s.hp)} BOSS`,s.sign>0?'#126caa':'#b93451',Math.max(12,16*boss.sc));
 if(s.phase==='feint')label(boss.x,boss.y-h-45,`Next: ${s.sign>0?'−':'+'}`,s.sign>0?'#b93451':'#126caa',14);
 if(s.wave){const q=project(0,s.wave.z);g.strokeStyle='#fff';g.lineWidth=5;g.beginPath();g.ellipse(q.x,q.y,half*1.28*q.sc,14*q.sc,0,0,7);g.stroke();label(q.x,q.y-8,'×(−1)','#794c97',14);}
 if(s.phase==='flip'){g.strokeStyle=-s.sign>0?'#7ae7ff':'#ff8eaf';g.lineWidth=4;g.beginPath();g.ellipse(boss.x,boss.y-h*.5,w*.7,h*.55,s.flip*.3,0,Math.PI*1.8);g.stroke();}
 for(const p of s.pulses){const q=project(p.x,p.z),r=13*q.sc;g.drawImage(creatures[p.value<0?-1:1][0],q.x-r,q.y-r*2,r*2,r*2);label(q.x,q.y+12,signed(p.value),p.value>0?'#147bbb':'#c33953',11);}
 const player=project(s.x,s.z),n=Math.min(65,Math.max(0,Math.round(s.visualArmy))),r=10*player.sc,spread=Math.min(W*.10,Math.sqrt(n)*r*1.1);
 g.fillStyle='#25332d44';g.beginPath();g.ellipse(player.x+3,player.y+2,spread+5,spread*.5,0,0,7);g.fill();
 for(let i=0;i<n;i++){const a=i*2.4,d=Math.sqrt((i+.5)/n)*spread,x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d*.45;g.drawImage(creatures[s.value<0?-1:1][i%4],x-r,y-r*2+Math.sin(clock*7+i)*r*.15,r*2,r*2);}
 if(s.canceling||s.absorbing){const mid={x:(player.x+boss.x)/2,y:(player.y+boss.y)/2};line([{x:mid.x-W*.06,y:mid.y},{x:mid.x+W*.06,y:mid.y}],'#f1fbff',5);for(let i=0;i<8;i++){g.fillStyle=i%2?'#8de7ff':'#ffa1b6';g.beginPath();g.arc(mid.x+Math.sin(i*9+clock*8)*W*.05,mid.y-i%3*4,2,0,7);g.fill();}}
 label(player.x,player.y+spread*.5+23,signed(s.value),s.value>0?'#147bbb':'#c33953',18);
 $('phase').textContent=s.mode==='approach'?'Approaching arena':s.mode==='exit'?'Boss defeated':paused?'Paused':`${s.phase==='open'?'KEEP MOVING':s.phase==='flip'?'SIGN SWITCH':s.phase.toUpperCase()}`;
 $('health').textContent=`Dr. Fin · ${s.hp}`;
}
function frame(t){const dt=Math.min(.05,last?(t-last)/1000:0);last=t;step(dt);draw();requestAnimationFrame(frame);}function pointer(e){const r=c.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,far=1/(1+1100/510),sc=clamp(far+(py-horizon)*(1-far)/(near-horizon),.4,1.2);s.tx=(px-W/2)/(half*sc)+s.camera;s.tz=s.forward+510*(1/sc-1);}
c.onpointerdown=e=>{drag=true;c.setPointerCapture(e.pointerId);pointer(e);};c.onpointermove=e=>{if(drag)pointer(e);};c.onpointerup=c.onpointercancel=()=>drag=false;
function pause(){paused=!paused;$('pause').textContent=paused?'Resume':'Pause';} $('pause').onclick=pause;$('restart').onclick=$('retry').onclick=reset;
$('help').onclick=()=>{paused=true;$('pause').textContent='Resume';$('helpDialog').showModal();};$('closeHelp').onclick=()=>{$('helpDialog').close();};$('start').onclick=()=>{$('intro').close();reset();};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else note('Use Safari’s Add to Home Screen for a full-screen view.');}catch(e){note('Fullscreen is unavailable in this browser.');}};
for(const button of document.querySelectorAll('[data-x]')){button.onpointerdown=e=>{e.preventDefault();held={x:+button.dataset.x,z:+button.dataset.z};button.setPointerCapture(e.pointerId);};button.onpointerup=button.onpointercancel=()=>held={x:0,z:0};}
addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key))e.preventDefault();if(key===' '&&!e.repeat)pause();if(key==='r'&&!e.repeat)reset();keys.add(key);});addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));addEventListener('blur',()=>{keys.clear();held={x:0,z:0};if(!s.end){paused=true;$('pause').textContent='Resume';}});
$('menu').onclick=()=>{if(params.has('embedded'))parent.postMessage({type:'integer-boss-menu'},location.origin);else location.href='index.html';};
window.BossLab={snapshot:()=>JSON.parse(JSON.stringify(s)),project:(x,z)=>project(x,z),options,pulseResult,draw,test:(patch)=>Object.assign(s,patch),step};reset();if(params.has('embedded')){$('intro').close();}else paused=true;requestAnimationFrame(frame);
})();
