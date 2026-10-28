const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{
 const alternate=process.env.BLOB_CHROMIUM_MODULE?require(process.env.BLOB_CHROMIUM_MODULE).default:null;
 if(alternate){fs.chown=(p,u,g,cb)=>cb(null);fs.lchown=(p,u,g,cb)=>cb(null);}
 const browser=await chromium.launch(alternate?{executablePath:await alternate.executablePath(),headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']}:{headless:true});
 const p=await browser.newPage({viewport:{width:1365,height:900},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{let t=0,queue=[];window.requestAnimationFrame=fn=>{queue.push(fn);return queue.length;};window.__advance=ms=>{const n=Math.ceil(ms/50);for(let i=0;i<n;i++){t+=ms/n;const q=queue;queue=[];for(const fn of q)fn(t);}};window.__gateWords=[];const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(text==='POSITIVE +'||text==='NEGATIVE −')window.__gateWords.push(text);return f.call(this,text,...args);};});
 await p.goto(require('url').pathToFileURL(path.resolve(__dirname,'../Blob_Runner.html')).href);
 async function advance(ms=200){await p.evaluate(ms=>{__advance(ms);const {armies,labels}=BlobRunner.labelSnapshot();if(labels.length!==armies.length)throw Error('Missing army number');for(const l of labels)for(const a of armies)if(l.x1<a.x2&&l.x2>a.x1&&l.y1<a.y2&&l.y2>a.y1)throw Error('Army label overlap');},ms);}
 async function snapshot(){return p.evaluate(()=>BlobRunner.snapshot());}
 async function setup(index,mode='standard'){
  if(await p.locator('#result').isVisible())await p.locator('#chooseLevel').click();
  else if(!await p.locator('#intro').isVisible())await p.locator('#levels').click();
  await p.locator('#levelSelect').selectOption(String(index));await p.locator('#difficultySelect').selectOption(mode);await p.locator('#begin').click();await advance(50);
 }
 async function play(index,mode,choice=0,override=null){
  await setup(index,mode);const level=await p.evaluate(()=>BlobRunner.course());
  const wins=await p.evaluate(()=>BlobMath.solve(BlobRunner.course()).wins);
  const plan=wins[choice%wins.length];let key=null,guard=0,seen=new Set();
  while(!(await snapshot()).end){const state=await snapshot(),row=level.rows[state.next];let action=plan.actions.find(a=>a.row===row?.id);
   if(override)action=override(row,action,level)||action;
   let desired=action?.x??0;
   const wanted=desired<-.1?'ArrowLeft':desired>.1?'ArrowRight':null;
   if(key!==wanted){if(key)await p.keyboard.up(key);key=wanted;if(key)await p.keyboard.down(key);}
   if(!seen.has(row?.id)&&row?.id==='positiveChoice'){await p.screenshot({path:`blob-runner/docs/level-${index+1}-gate.png`});seen.add(row.id);}
   await advance();if(++guard>600)throw Error('Course stalled: '+JSON.stringify(await snapshot()));
  }
  if(key)await p.keyboard.up(key);return {state:await snapshot(),level,plan};
 }
 const results=[];
 for(let i=0;i<3;i++){
  for(const route of [0,3]){const r=await play(i,'standard',route);if(!r.state.won)throw Error('Route failed '+JSON.stringify(r));if(r.state.value!==r.plan.value)throw Error('Route arithmetic mismatch');if(r.state.passed.length!==2)throw Error('Both sign gates not passed');results.push({level:i+1,mode:'standard',value:r.state.value,seed:r.level.seed,nominalTravelSeconds:r.level.length/r.level.speed});}
  await p.screenshot({path:`blob-runner/docs/level-${i+1}-win.png`});
  if(i<2){await p.locator('#nextLevel').click();await advance(50);if((await p.evaluate(()=>BlobRunner.course())).index!==i+1)throw Error('Next course failed');}else if(await p.locator('#nextLevel').isVisible())throw Error('Next course shown after final course');
 }
 for(const mode of ['relaxed','fast']){const r=await play(0,mode);if(!r.state.won)throw Error('Difficulty route failed '+mode);results.push({level:1,mode,value:r.state.value});}
 const badSign=await play(0,'standard',0,(row,a)=>row?.id==='positiveChoice'?{x:-a.x}:null);if(badSign.state.won||!(await p.locator('#resultTitle').innerText()).includes('Wrong sign'))throw Error('Sign gate failure missing');
 const badSize=await play(0,'standard',0,(row,a)=>row?.id==='final'?{x:-a.x}:null);if(badSize.state.won||Math.abs(badSize.state.value)<5)throw Error('Whole army size failure missing');
 const zero=await play(0,'standard',0,(row,a,level)=>{
  if(row?.id==='start')return {x:row.items.find(i=>i.op.kind==='mul').x};
  if(row?.id==='pair')return {x:row.items.find(i=>i.id==='blue').x};
 });if(zero.state.value!==0||zero.state.won)throw Error('Exhausted player did not lose');
 // Retry keeps the layout; new runs use a new shuffled seed.
 await p.locator('#again').click();await advance(50);const before=await p.evaluate(()=>BlobRunner.course());await p.locator('#restart').click();const after=await p.evaluate(()=>BlobRunner.course());if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Restart shuffled the run');
 const pos=(await snapshot()).position;await p.locator('#pause').click();await advance(500);if((await snapshot()).position!==pos)throw Error('Pause advanced');await p.locator('#help').click();await p.locator('#closeHelp').click();if((await snapshot()).mode!=='paused')throw Error('Help lost pause');await p.locator('#pause').click();
 await p.keyboard.press('r');await p.keyboard.down('ArrowRight');await advance(650);await p.keyboard.up('ArrowRight');await advance(350);
 const c=await p.evaluate(()=>({camera:BlobRunner.cameraSnapshot(),labels:BlobRunner.labelSnapshot()})),label=c.labels.labels.find(l=>l.key==='player');if(c.camera.x<=.1||Math.abs((label.x1+label.x2)/2-c.camera.width/2)>2)throw Error('Camera tracking lost');
 await p.screenshot({path:'blob-runner/docs/camera-right.png'});
 await p.locator('#full').click();await p.waitForFunction(()=>!!document.fullscreenElement,null,{polling:100});await p.locator('#full').click();await p.waitForFunction(()=>!document.fullscreenElement,null,{polling:100});
 await p.keyboard.press('r');const canvas=await p.locator('#game').boundingBox();await p.touchscreen.tap(canvas.x+canvas.width*.2,canvas.y+canvas.height*.6);await advance(500);if((await snapshot()).x>=0)throw Error('Touch failed');
 await p.keyboard.press('r');const rect=await p.locator('#game').boundingBox();await p.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.6);await p.mouse.down();await p.mouse.move(rect.x+rect.width*.7,rect.y+rect.height*.6);await advance(400);const target=(await snapshot()).target;await p.mouse.move(rect.x+rect.width*.702,rect.y+rect.height*.6);await advance(100);await p.mouse.up();if(Math.abs((await snapshot()).target-target)>.012)throw Error('Drag camera feedback');
 const words=await p.evaluate(()=>[...new Set(__gateWords)]);if(words.length!==2)throw Error('Sign gate labels were not rendered');
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync('blob-runner/docs/browser-results.json',JSON.stringify({passed:true,results,checks:['two winning routes per course','next course progression','three difficulty speeds','positive and negative sign gates','wrong sign stops unchanged army','zero loses','whole army fails size gate','seeded restart stable','keyboard','touch','drag stable with camera','pause','Help restores pause','fullscreen','camera centered','army number separation','no page errors'],signLabels:words},null,2));
 await browser.close();console.log('Browser gameplay checks passed:',results.length,'wins, zero/sign/size failures, controls and camera');
})().catch(e=>{console.error(e);process.exit(1)});
