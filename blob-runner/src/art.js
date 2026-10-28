/* Original lightweight Canvas artwork. Cached sprites; no network assets. */
(()=>{
 const TAU=Math.PI*2,fract=n=>n-Math.floor(n),noise=n=>fract(Math.sin(n*127.1+31.7)*43758.5453);
 function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
 function creatures(){
  const frames={};
  for(const sign of [1,-1]){frames[sign]=[];for(let v=0;v<4;v++){
   const image=document.createElement('canvas');image.width=image.height=64;const c=image.getContext('2d');
   const shadow=c.createRadialGradient(32,54,1,32,54,25);shadow.addColorStop(0,'#122f4760');shadow.addColorStop(1,'#122f4700');c.fillStyle=shadow;c.beginPath();c.ellipse(32,54,25,7,0,0,TAU);c.fill();
   const color=c.createRadialGradient(20,16,2,35,34,33);color.addColorStop(0,sign>0?'#a8f3ff':'#ffd0c8');color.addColorStop(.32,sign>0?'#45c9fc':'#ff7c87');color.addColorStop(.74,sign>0?'#088bd9':'#e83260');color.addColorStop(1,sign>0?'#085c9f':'#9c2147');
   const tip=[0,3,-2,1][v];c.fillStyle=color;c.beginPath();c.moveTo(9,38);c.bezierCurveTo(7,20,17,12,25,11);c.bezierCurveTo(29,10,30,6-tip,33,7-tip);c.bezierCurveTo(37,8,35,11,41,13);c.bezierCurveTo(57,18,60,40,50,49);c.bezierCurveTo(39,59,11,56,9,38);c.fill();
   c.strokeStyle=sign>0?'#086db5aa':'#a8234daa';c.lineWidth=1;c.stroke();
   c.fillStyle='#ffffff90';c.beginPath();c.ellipse(22,20,6.5,4.5,-.65,0,TAU);c.fill();c.fillStyle='#ffffffbf';c.beginPath();c.ellipse(18.5,24,2,1.5,-.4,0,TAU);c.fill();
   c.strokeStyle=sign>0?'#9deeff88':'#ffb5bf88';c.lineWidth=1.2;c.beginPath();c.ellipse(34,40,18,12,.05,.15,1.7);c.stroke();frames[sign].push(image);
  }}return frames;
 }
 function block(c,x,y,w,h,color='#7c8c91',light='#bac7c6',shade='#4f646b'){
  c.fillStyle=shade;c.fillRect(x,y,w,h);c.fillStyle=color;c.fillRect(x+1,y+1,Math.max(0,w-2),Math.max(0,h-2));
  c.fillStyle=light;c.fillRect(x+1,y+1,Math.max(0,w-2),Math.min(3,h*.16));c.fillStyle='#193e462b';c.fillRect(x+w-Math.max(2,w*.13),y+3,Math.max(1,w*.13-1),Math.max(0,h-4));
 }
 let backdrop=null,backdropKey='';
 const plank=document.createElement('canvas');plank.width=384;plank.height=64;
 {const c=plank.getContext('2d');c.fillStyle='#a88251';c.fillRect(0,0,384,64);
 for(let i=0;i<90;i++){const y=noise(i+5)*64,x=noise(i+6)*384,len=12+noise(i+7)*180;c.strokeStyle=i%3?'#422b1520':'#f1d29242';c.lineWidth=.5+noise(i+9);c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+len*.3,y+1,x+len*.6,y-1,x+len,y);c.stroke();}
 c.strokeStyle='#503a2eaa';c.lineWidth=2;c.beginPath();c.moveTo(0,63);c.lineTo(384,63);c.stroke();c.strokeStyle='#efd6a45a';c.beginPath();c.moveTo(0,1);c.lineTo(384,1);c.stroke();}
 const post=document.createElement('canvas');post.width=64;post.height=100;
 {const c=post.getContext('2d');block(c,7,10,50,84,'#8c9a90','#ced0b4','#526d72');c.fillStyle='#d9d7b6';c.fillRect(2,5,60,14);}
 function scene(c,{W,H,half,project,position,view,time,unit,cameraX=0}){
  if(backdropKey!==W+','+H){backdrop=document.createElement('canvas');backdrop.width=Math.ceil(W);backdrop.height=Math.ceil(H);const c=backdrop.getContext('2d');
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#a7ccd6');sky.addColorStop(.28,'#d4e5dc');sky.addColorStop(.6,'#3d8fa3');sky.addColorStop(1,'#236879');c.fillStyle=sky;c.fillRect(0,0,W,H);
  const water=c.createLinearGradient(0,H*.19,0,H);water.addColorStop(0,'#5599aa');water.addColorStop(.5,'#27798e');water.addColorStop(1,'#205d74');c.fillStyle=water;c.fillRect(0,H*.19,W,H*.81);
  // Quiet rocky shores outside the roadway; the road stays visually uncluttered.
  for(const side of [-1,1]){
   const edge=side<0?0:W;const dir=-side;
   poly(c,[{x:edge,y:H*.18},{x:edge+dir*W*.14,y:H*.16},{x:edge+dir*W*.26,y:H*.26},{x:edge+dir*W*.20,y:H*.39},{x:edge,y:H*.43}],'#758f8d');
   poly(c,[{x:edge,y:H*.17},{x:edge+dir*W*.13,y:H*.145},{x:edge+dir*W*.25,y:H*.255},{x:edge+dir*W*.12,y:H*.29},{x:edge,y:H*.28}],'#6c977f');
   poly(c,[{x:edge+dir*W*.08,y:H*.3},{x:edge+dir*W*.15,y:H*.285},{x:edge+dir*W*.20,y:H*.30},{x:edge+dir*W*.17,y:H*.355},{x:edge+dir*W*.09,y:H*.37}],'#9bada0');
   for(let i=0;i<4;i++){const x=edge+dir*W*(.025+i*.047),y=H*(.17+i*.013),r=W*.022;poly(c,[{x,y:y-r*2},{x:x-r,y:y+r},{x:x+r,y:y+r}],'#527b6d');}
  }
   backdropKey=W+','+H;
  }
  // Distant scenery shifts less than nearby road edges: translational parallax.
  c.drawImage(backdrop,-W*.08-cameraX*W*.075,0,W*1.16,H);
  // Low-cost faceted rock stacks give the bridge real surrounding depth.
  for(let d=Math.floor((position+view)/210)*210-position;d>-200;d-=210){
   for(const side of [-1,1]){
    const index=Math.round((d+position)/210),p=project(side*(1.75+noise(index+side*9)*.5),d);
    const width=(35+noise(index+8)*25)*p.sc*unit,height=(65+noise(index+11)*75)*p.sc*unit;
    poly(c,[{x:p.x-width,y:p.y},{x:p.x-width*.8,y:p.y-height},{x:p.x+width*.25,y:p.y-height*1.04},{x:p.x+width*.55,y:p.y}], '#718b87');
    poly(c,[{x:p.x+width*.25,y:p.y-height*1.04},{x:p.x+width,y:p.y-height*.86},{x:p.x+width,y:p.y},{x:p.x+width*.55,y:p.y}], '#506e75');
    poly(c,[{x:p.x-width*.8,y:p.y-height},{x:p.x-width*.35,y:p.y-height*1.13},{x:p.x+width,y:p.y-height*.86},{x:p.x+width*.25,y:p.y-height*1.04}], '#a5b6a0');
    c.fillStyle='#78977d';c.beginPath();c.ellipse(p.x-width*.15,p.y-height*1.035,width*.65,width*.16,0,0,TAU);c.fill();
   }
  }
  c.lineCap='round';for(let i=0;i<14;i++){const y=H*(.28+i*.054),x=noise(i+8)*W+Math.sin(time*.32+i)*W*.006,w=(9+noise(i+20)*23)*unit;c.strokeStyle=i%3?'#b6e3dc30':'#e3eee55c';c.lineWidth=i%3?1:1.8;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.stroke();}
  const front=project(0,-160),back=project(0,view);
  // Visible slab sides beneath the deck, rather than a paper-thin surface.
  for(const side of [-1,1]){const a=project(side,view),b=project(side,-160);
   poly(c,[a,b,{x:b.x,y:b.y+20*b.sc*unit},{x:a.x,y:a.y+20*a.sc*unit}],side<0?'#695f4e':'#4b514b');
  }
  poly(c,[{x:back.x-half*back.sc,y:back.y},{x:back.x+half*back.sc,y:back.y},{x:front.x+half*front.sc,y:front.y},{x:front.x-half*front.sc,y:front.y}],'#ac8253');
  // Cached grain mapped in receding board strips; no per-frame grain generation.
  c.save();c.beginPath();c.moveTo(back.x-half*back.sc,back.y);c.lineTo(back.x+half*back.sc,back.y);c.lineTo(front.x+half*front.sc,front.y);c.lineTo(front.x-half*front.sc,front.y);c.closePath();c.clip();
  for(let d=Math.ceil((position-160)/32)*32-position;d<view;d+=32){const id=Math.round((d+position)/32),a=project(-1,d),b=project(1,d),far=project(0,d+32);c.drawImage(plank,a.x,far.y,b.x-a.x,Math.max(1,a.y-far.y+1));if(id%3===0){c.fillStyle='#654c2e0a';c.fillRect(a.x,far.y,b.x-a.x,a.y-far.y+1);}}
  c.restore();
  // Raised parapets: lit top, shaded wall, and world-anchored segment seams.
  for(const side of [-1,1]){
   poly(c,[project(side*.91,view),project(side,view),project(side,-160),project(side*.91,-160)],'#183a4938');
   for(let d=Math.floor((position+view)/64)*64-position;d>-224;d-=64){
    const far=Math.min(view,d+64),near=Math.max(-160,d);if(far<=near)continue;
    const a=project(side,far),b=project(side,near),ao=project(side*1.09,far),bo=project(side*1.09,near);
    const lift=p=>({x:p.x,y:p.y-8*p.sc*unit});
    poly(c,[a,b,lift(b),lift(a)],side<0?'#708482':'#536e72');
    poly(c,[lift(a),lift(b),lift(bo),lift(ao)],'#b6bea9');
    c.strokeStyle='#465d5e60';c.lineWidth=Math.max(.6,b.sc*.8);c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x,b.y-8*b.sc*unit);c.lineTo(bo.x,bo.y-8*bo.sc*unit);c.stroke();
    if(d>=-160){const p=project(side*1.035,d),size=19*p.sc;c.drawImage(post,p.x-size*.6,p.y-size*1.5,size*1.2,size*1.7);}
   }
  }
  c.lineCap='butt';
 }
 window.BlobArt={creatures,block,scene};
})();
