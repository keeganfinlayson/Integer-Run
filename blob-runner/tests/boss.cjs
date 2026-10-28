const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{
 const a=require(process.env.BLOB_CHROMIUM_MODULE).default;fs.chown=(p,u,g,cb)=>cb(null);fs.lchown=(p,u,g,cb)=>cb(null);
 const b=await chromium.launch({executablePath:await a.executablePath(),headless:true,args:['--no-sandbox','--disable-gpu']});const p=await b.newPage({viewport:{width:1100,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{let t=0,q=[];requestAnimationFrame=f=>q.push(f);window.tick=ms=>{for(let i=0;i<ms/50;i++){t+=50;const batch=q;q=[];batch.forEach(f=>f(t));}};});
 await p.goto(require('url').pathToFileURL(path.resolve(__dirname,'../Blob_Runner.html')).href);await p.locator('#begin').click();
 const level=await p.evaluate(()=>BlobRunner.course()),plan=await p.evaluate(()=>BlobMath.solve(BlobRunner.course()).wins[0]);let held=null,arenaPosition=null,hits=0;
 for(let t=0;t<900;t++){
  const s=await p.evaluate(()=>BlobRunner.snapshot());if(s.end){assert(s.won,JSON.stringify(s));break;}
  if(s.boss){if(held){await p.keyboard.up(held);held=null;}if(arenaPosition===null){arenaPosition=s.position;await p.screenshot({path:'qa/boss-arena.png'});await p.locator('#pause').click();await p.evaluate(()=>tick(500));assert.equal((await p.evaluate(()=>BlobRunner.snapshot())).boss.timer,s.boss.timer);await p.locator('#pause').click();}
   if(s.boss.phase!=='exit')assert.equal(s.position,arenaPosition);
   if(s.boss.phase==='charge'&&s.boss.choice===null){const pad=await p.evaluate(()=>{const s=BlobRunner.snapshot(),b=s.boss;return BlobBoss.pads.find(p=>{const v=BlobMath.operation(s.value,p.op);return v*b.sign<0&&Math.abs(v)>b.pulse;});});assert(pad);const rect=await p.locator('#game').boundingBox();await p.mouse.click(rect.x+rect.width*(.5+pad.x*.44),rect.y+rect.height*(.58+pad.y*.25));}
   hits=Math.max(hits,s.boss.hits);
  }else{const row=level.rows[s.next],action=plan.actions.find(a=>a.row===row?.id),key=action?.x<0?'ArrowLeft':action?.x>0?'ArrowRight':null;if(key!==held){if(held)await p.keyboard.up(held);held=key;if(key)await p.keyboard.down(key);}}
  await p.evaluate(()=>tick(200));
 }
 const final=await p.evaluate(()=>BlobRunner.snapshot());assert(final.won);assert.equal(final.boss.hits,3);assert(final.position>arenaPosition);assert.equal(errors.length,0);
 assert.deepEqual(await p.evaluate(()=>BlobBoss.attack(-12,1,8)),{value:-4,hit:true});assert.deepEqual(await p.evaluate(()=>BlobBoss.attack(-4,1,8)),{value:0,hit:false});assert.deepEqual(await p.evaluate(()=>BlobBoss.attack(12,1,8)),{value:20,hit:false});
 fs.writeFileSync('blob-runner/docs/boss-results.json',JSON.stringify({passed:true,checks:['complete course into arena','forward progression freezes','pause freezes countdown','mouse steering to pads','three exact signed counterattacks','zero/exhaustion result','same sign merge gives no hit','boss defeated','forward movement resumes','no page errors'],ending:final.value},null,2));await b.close();console.log('Boss playthrough and arithmetic passed');
})().catch(e=>{console.error(e);process.exit(1)});
