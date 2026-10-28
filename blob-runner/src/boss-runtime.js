/* Circular arena, integer counterattacks, and cached approved boss sprite. */
(()=>{
const pads=[{x:-.72,y:.08,label:'×(−1)',op:{kind:'mul',n:-1}},{x:.72,y:.08,label:'+16',op:{kind:'add',n:16}},{x:0,y:.77,label:'−16',op:{kind:'sub',n:16}}];
const image=new Image();image.src='assets/boss.png';
function create(){return {x:0,y:.52,tx:0,ty:.52,hits:0,sign:1,pulse:8,timer:5,choice:null,phase:'charge',elapsed:0,round:0,removed:0,exit:0};}
function attack(value,sign,pulse){const opposed=value*sign<0;return {value:opposed&&Math.abs(value)<=pulse?0:value+sign*pulse,hit:opposed&&Math.abs(value)>pulse};}
function project(W,H,x,y){return {x:W*.5+x*W*.44,y:H*.58+y*H*.25};}
function draw(c,W,H,b,value,time,sprites,tag){
 const cx=W*.5,cy=H*.58,rx=W*.47,ry=H*.30;
 const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#9acbdc');bg.addColorStop(.5,'#2f869c');bg.addColorStop(1,'#174b68');c.fillStyle=bg;c.fillRect(0,0,W,H);
 c.fillStyle='#3c555a';c.beginPath();c.ellipse(cx,cy+13,rx,ry,0,0,7);c.fill();
 const floor=c.createLinearGradient(0,cy-ry,0,cy+ry);floor.addColorStop(0,'#c9b18a');floor.addColorStop(1,'#ad895d');c.fillStyle=floor;c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,7);c.fill();
 c.save();c.beginPath();c.ellipse(cx,cy,rx-4,ry-4,0,0,7);c.clip();c.strokeStyle='#806c4c55';c.lineWidth=1;
 for(let i=1;i<5;i++){c.beginPath();c.ellipse(cx,cy,rx*i/5,ry*i/5,0,0,7);c.stroke();}
 for(let i=0;i<20;i++){const a=i*Math.PI/10;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry);c.stroke();}c.restore();
 c.strokeStyle='#d8d8bd';c.lineWidth=9;c.beginPath();c.ellipse(cx,cy,rx-3,ry-3,0,0,7);c.stroke();
 for(const [i,pad] of pads.entries()){const p=project(W,H,pad.x,pad.y),active=b.choice===i;c.fillStyle=active?'#f4d37d':'#257d9d';c.strokeStyle=active?'#fff7cc':'#b6f2ff';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,W*.105,H*.024,0,0,7);c.fill();c.stroke();c.fillStyle=active?'#31414b':'white';c.font=`800 ${Math.max(12,W*.043)}px system-ui`;c.textAlign='center';c.fillText(pad.label,p.x,p.y+5);}
 const boss=project(W,H,0,-.34),h=H*.26,w=h*1.04,bob=Math.sin(time*4)*3;
 c.fillStyle='#163b4940';c.beginPath();c.ellipse(boss.x,boss.y+6,w*.43,10,0,0,7);c.fill();
 c.save();if(b.phase==='exit')c.globalAlpha=Math.max(0,1-b.exit);const squish=1+Math.sin(time*5)*.025;
 if(image.complete&&image.naturalWidth)c.drawImage(image,b.sign>0?0:image.naturalWidth/2,0,image.naturalWidth/2,image.naturalHeight,boss.x-w*.5,boss.y-h+bob,w,h*squish);c.restore();
 tag(boss.x,boss.y-h-22,b.phase==='exit'?'Boss defeated!':`${b.sign>0?'+':'−'}${b.pulse} incoming`,b.sign>0?'#086cb0':'#b92c46',Math.max(13,W*.042));
 for(let i=0;i<3;i++){c.fillStyle=i<b.hits?'#465868':'#ffda6c';c.beginPath();c.arc(boss.x+(i-1)*18,boss.y+18,6,0,7);c.fill();}
 const player=project(W,H,b.x,b.y),n=Math.min(36,Math.abs(value)),r=W*.014;
 for(let i=0;i<n;i++){const a=i*2.4,d=Math.sqrt((i+.5)/Math.max(1,n))*W*.065,px=player.x+Math.cos(a)*d,py=player.y+Math.sin(a)*d*.5; c.drawImage(sprites[value<0?-1:1][i%4],px-r,py-r*2+Math.sin(time*7+i)*r*.15,r*2,r*2);}
 tag(player.x,player.y+W*.07,BlobMath.signed(value),value<0?'#b92c46':'#086cb0',Math.max(15,W*.047));
 if(b.phase==='pulse'||b.phase==='cancel'){const f=b.phase==='pulse'?Math.min(1,b.elapsed/.5):1,x=boss.x+(player.x-boss.x)*f,y=boss.y+(player.y-boss.y)*f;c.strokeStyle=b.sign>0?'#7ce9ff':'#ff889f';c.lineWidth=6;c.beginPath();c.ellipse(x,y,W*.055,H*.012,0,0,7);c.stroke();if(b.phase==='cancel'){c.strokeStyle='#ffffff';c.lineWidth=3;c.beginPath();c.moveTo(player.x-W*.07,player.y-18);c.lineTo(player.x+W*.07,player.y-18);c.stroke();}}
 if(b.phase==='charge'){c.fillStyle='#153a4b';c.font=`800 ${Math.max(14,W*.045)}px system-ui`;c.textAlign='center';c.fillText(b.choice===null?`Choose a circle · ${Math.ceil(b.timer)}`:`Ready · ${Math.ceil(b.timer)}`,cx,H*.94);}
}
window.BlobBoss={pads,create,attack,project,draw};
})();
