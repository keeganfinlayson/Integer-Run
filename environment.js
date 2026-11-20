(()=>{const stone=new Image();stone.src='assets/mossy-stone.webp';
function draw(g,{W,H,project,position=0,pair=null,arena=false}){const poly=(p,c)=>{g.fillStyle=c;g.beginPath();p.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.fill()};
// Quiet jungle ravine: broad silhouettes and atmospheric depth, no detailed bitmap.
const sky=g.createLinearGradient(0,0,0,H);
sky.addColorStop(0,'#a5c4ca');sky.addColorStop(.36,'#8faeb5');sky.addColorStop(.70,'#5d8790');sky.addColorStop(1,'#355c69');
g.fillStyle=sky;g.fillRect(0,0,W,H);
const horizonY=H*.27;
function ridge(side,depth){
 const right=side>0,edge=right?W:0,sgn=right?-1:1;
 const width=W*(depth===0?.31:depth===1?.25:.19);
 const top=horizonY+H*(depth===0?-.12:depth===1?-.025:.12);
 const drift=Math.sin(position*.00032+depth*2+side)*W*.007;
 g.fillStyle=[['#78999a','#6b8d8e'],['#587f7e','#527777'],['#426b68','#416662']][depth][right?1:0];
 g.beginPath();g.moveTo(edge,top-H*.16);
 for(let j=0;j<=9;j++){
  const t=j/9;
  const x=edge+sgn*(width*t+drift);
  const y=top+Math.sin(t*5.3+side*2+depth)*H*.022+t*t*H*.16;
  g.lineTo(x,y);
 }
 g.lineTo(edge+sgn*width*.88,H);g.lineTo(edge,H);g.closePath();g.fill();
 // Grouped canopy silhouettes, not individual leaves.
 g.fillStyle=depth===0?'#668e80':depth===1?'#476f65':'#355b54';
 for(let k=0;k<5;k++){
  const t=(k+.45)/5,x=edge+sgn*(width*t+drift),y=top+Math.sin(t*5.3+side*2+depth)*H*.022+t*t*H*.16;
  const rad=W*(depth===0?.038:.028)*(1+.12*Math.sin(k*3+side));
  g.beginPath();g.ellipse(x,y,rad,rad*.38,0,0,Math.PI*2);g.fill();
 }
}
for(const depth of [0,1,2])for(const side of [-1,1])ridge(side,depth);
// Chasm deepens toward the bottom, while distant vegetation dissolves in mist.
const valley=g.createLinearGradient(0,H*.28,0,H);
valley.addColorStop(0,'rgba(171,203,203,.10)');
valley.addColorStop(.35,'rgba(140,181,188,.23)');
valley.addColorStop(.72,'rgba(118,164,173,.56)');
valley.addColorStop(1,'rgba(119,164,174,.87)');
g.fillStyle=valley;g.fillRect(0,H*.28,W,H*.72);
for(let i=0;i<3;i++){
 const y=H*(.49+i*.17),mist=g.createRadialGradient(W*.5,y,0,W*.5,y,W*(.54+i*.13));
 mist.addColorStop(0,'rgba(173,205,207,.21)');mist.addColorStop(1,'rgba(173,205,207,0)');
 g.fillStyle=mist;g.fillRect(0,y-H*.2,W,H*.4);
}
// A few restrained hanging vines at the near cliffs.
g.lineWidth=Math.max(1,W*.0018);g.strokeStyle='rgba(42,89,69,.48)';
for(const side of [-1,1])for(let i=0;i<3;i++){
 const x=side<0?W*(.035+i*.027):W*(.965-i*.027);
 const y=H*(.19+i*.075);
 g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+side*W*.01,y+H*.09,x-side*W*.012,y+H*.13,x,y+H*(.16+i*.025));g.stroke();
}
const hole=z=>pair&&z>pair.z-120&&z<pair.z+160?.38*Math.sin(Math.PI*(z-pair.z+120)/280):0;
function face(a,b,h){poly([a,b,{x:b.x,y:b.y+h*b.sc},{x:a.x,y:a.y+h*a.sc}],'#777e76');g.strokeStyle='#616a63';g.lineWidth=1;for(let t=12;t<h;t+=12){g.beginPath();g.moveTo(a.x,a.y+t*a.sc);g.lineTo(b.x,b.y+t*b.sc);g.stroke()}}
function wall(a,b,i){const h=22;face({...a,y:a.y-h*a.sc},{...b,y:b.y-h*b.sc},h);g.strokeStyle='#c0c5b7';g.lineWidth=3;g.beginPath();g.moveTo(a.x,a.y-h*a.sc);g.lineTo(b.x,b.y-h*b.sc);g.stroke();}
// Masonry spandrels, rounded arch openings and tapered load-bearing piers.
for(let z=position+1200;z>position-100;z-=160){for(const side of [-1,1]){const a=project(side,z),b=project(side,z+160),h=120;g.fillStyle='#7c837b';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(b.x,b.y+70*b.sc);g.bezierCurveTo(b.x,b.y+10*b.sc,a.x,a.y+10*a.sc,a.x,a.y+70*a.sc);g.closePath();g.fill();face(a,{...a,x:a.x+side*14*a.sc},400);}}
for(let z=position+1200,i=0;z>position-130;z-=12,i++){const za=z+12,a=project(-1,z),b=project(1,z),c=project(1,za),d=project(-1,za);const gap=hole(z),gap2=hole(za);const ranges=gap?[[-1,-gap,-1,-gap2],[gap,1,gap2,1]]:[[-1,1,-1,1]];for(const [l,r,lf,rf]of ranges){const pts=[project(l,z),project(r,z),project(rf,za),project(lf,za)];poly(pts,'#a6a69a');if(stone.complete&&stone.naturalWidth){g.save();g.beginPath();pts.forEach((p,k)=>k?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.clip();const sy=((z%280)+280)%280/280*stone.naturalHeight;g.globalAlpha=.34;g.drawImage(stone,0,sy,stone.naturalWidth,Math.min(55,stone.naturalHeight-sy),a.x,d.y,b.x-a.x,Math.max(1,a.y-d.y+1));g.restore()}}
for(const side of [-1,1]){wall(project(side,z),project(side,za),i);if(gap)wall(project(side*gap,z),project(side*gap2,za),i)}
// Posts only at fixed 60-world-unit marks; no camera-relative indexing.
const postZ=Math.ceil(z/60)*60;
if(postZ>=z&&postZ<za)for(const side of [-1,1]){
 const p=project(side,postZ);g.fillStyle='#847f70';
 g.fillRect(p.x-5*p.sc,p.y-32*p.sc,10*p.sc,32*p.sc);
 g.fillStyle='#b3afa0';g.fillRect(p.x-7*p.sc,p.y-35*p.sc,14*p.sc,5*p.sc);
}}
}
window.RunEnvironment={draw};})();
