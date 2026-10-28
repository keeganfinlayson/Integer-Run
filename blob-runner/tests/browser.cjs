const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const alternate=process.env.BLOB_CHROMIUM_MODULE?require(process.env.BLOB_CHROMIUM_MODULE).default:null;
 if(alternate){fs.chown=(p,u,g,cb)=>cb(null);fs.lchown=(p,u,g,cb)=>cb(null);}
 const browser=await chromium.launch(alternate?{executablePath:await alternate.executablePath(),headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']}:{headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1365,height:900},deviceScaleFactor:1});
 async function initClock(p){await p.addInitScript(()=>{let t=0,queue=[];window.requestAnimationFrame=fn=>{queue.push(fn);return queue.length;};window.__advance=ms=>{const frames=Math.ceil(ms/100);for(let i=0;i<frames;i++){t+=ms/frames;const batch=queue;queue=[];for(const fn of batch)fn(t);}};});}
 async function advance(p,ms){await p.evaluate(ms=>{window.__advance(ms);const {armies,labels}=BlobRunner.labelSnapshot();if(labels.length!==armies.length)throw Error('An army label is missing');for(const l of labels)for(const a of armies)if(l.x1<a.x2&&l.x2>a.x1&&l.y1<a.y2&&l.y2>a.y1)throw Error('Number label overlaps army');},ms);}
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await initClock(page);await page.goto(require('url').pathToFileURL(require('path').resolve(__dirname,'../Blob_Runner.html')).href);
 await page.locator('#begin').click({force:true});await advance(page,100);
 await page.screenshot({path:'blob-runner/docs/desktop-start.png'});
 async function snap(){return page.evaluate(()=>BlobRunner.snapshot());}
 async function lane(side){await page.keyboard.down(side<0?'ArrowLeft':'ArrowRight');await advance(page,800);await page.keyboard.up(side<0?'ArrowLeft':'ArrowRight');}
 async function next(index){let guard=0;while((await snap()).next<index&&!(await snap()).end){await advance(page,250);if(++guard>300)throw Error('Timed out '+index);}}
 await lane(-1);await next(1);const morph=await page.evaluate(()=>BlobRunner.visualSnapshot());if(!(morph.magnitude>24&&morph.magnitude<48))throw Error('Footprint did not ease toward 48');const approachBefore=(await snap()).incoming.map(e=>e.z);const routeX=(await snap()).incoming.map(e=>e.x);await advance(page,500);const approachAfter=(await snap()).incoming.map(e=>e.z);if(!approachAfter.every((z,i)=>z<approachBefore[i]))throw Error('Both swarms must move independently');const routeAfter=(await snap()).incoming.map(e=>e.x);if(!routeAfter.every((x,i)=>x<routeX[i]))throw Error('Incoming armies must head directly left toward the player, with no center-first phase');await next(2);await next(3);
 while((await snap()).cancel)await advance(page,250);
 await page.screenshot({path:'blob-runner/docs/desktop-mid.png'});
 await next(4);await lane(-1);await next(5);while(!(await snap()).cancel&&(await snap()).next<6)await advance(page,50);await advance(page,200);const impact=await snap();if(impact.cancel){const enemy=impact.incoming.find(e=>e.id===impact.cancel.enemyId);if(enemy.z<=impact.position)throw Error('Impact must be from the front');}await page.screenshot({path:'blob-runner/docs/cancellation.png'});
 while((await snap()).cancel)await advance(page,250);
 await advance(page,2500);await page.screenshot({path:'blob-runner/docs/final-choice.png'});
 await next(8);const win=await snap();console.log('win route',win.value);
 if(!win.fieldPassed)throw Error('Winning route did not pass sign forcefield');
 if(!win.end||win.value!==2||!(await page.locator('#resultTitle').innerText()).includes('escape'))throw Error('Winning path failed');
 await page.screenshot({path:'blob-runner/docs/desktop-win.png'});
 const performance={...(await page.evaluate(()=>BlobRunner.metrics())),note:'Deterministic frame injection for functional tests; frame interval is not an FPS benchmark.'};
 // Zero branch, using normal keyboard steering.
 await page.locator('#again').click({force:true});await lane(-1);await next(1);await lane(1);while(!(await snap()).cancel&&!(await snap()).end)await advance(page,50);const waitingRed=(await snap()).incoming.find(e=>e.id==='red').z;await advance(page,200);if((await snap()).incoming.find(e=>e.id==='red').z>=waitingRed)throw Error('Other swarm stopped during impact');await advance(page,2000);
 if((await snap()).value!==0||!(await snap()).end)throw Error('Zero branch failed');
 // Correct route with wrong final circle; whole swarm remains −8.
 await page.locator('#again').click({force:true});await lane(-1);await next(1);await next(2);await next(3);await next(4);await next(5);await next(6);
 while((await snap()).cancel)await advance(page,250);
 await lane(1);await next(8);
 if((await snap()).value!==-8||!(await page.locator('#resultTitle').innerText()).includes('large'))throw Error('Gate fail branch failed');
 // Forcefield blocks a circle without changing the quantity.
 await page.locator('#again').click({force:true});await lane(-1);await next(3);while((await snap()).cancel)await advance(page,250);await lane(1);await next(4);
 let barrierGuard=0;while(!(await snap()).end){await advance(page,250);if(++barrierGuard>100)throw Error('Sign forcefield was bypassed');}
 if((await snap()).value!==-20||!(await page.locator('#resultTitle').innerText()).includes('Wrong sign'))throw Error('Forcefield failed');
 // Outnumbered player stops at zero; surviving enemy never becomes the player.
 await page.evaluate(()=>BlobMath.LEVEL.rows[1].items[1].v=60);await page.locator('#again').click({force:true});await lane(-1);await next(1);await lane(1);let zeroGuard=0;while(!(await snap()).end){await advance(page,100);if(++zeroGuard>200)throw Error('Zero loss did not trigger');}const outnumbered=await snap();if(outnumbered.value!==0||outnumbered.incoming.find(e=>e.id==='blue').v!==12)throw Error('Outnumbered player continued after zero');await page.evaluate(()=>BlobMath.LEVEL.rows[1].items[1].v=48);
 if(await page.locator('#quantity').count())throw Error('Top swarm box remains');
 // Pause and help retain exact position.
 await page.locator('#again').click({force:true});await advance(page,500);await page.locator('#pause').click({force:true});const pos=(await snap()).position;await advance(page,2000);if((await snap()).position!==pos)throw Error('Pause moved');
 await page.locator('#help').click({force:true});await advance(page,500);await page.locator('#closeHelp').click({force:true});if((await snap()).mode!=='paused')throw Error('Help unpaused paused game');
 await page.locator('#pause').click({force:true});await page.locator('#help').click({force:true});await page.locator('#closeHelp').click({force:true});if((await snap()).mode!=='running')throw Error('Help did not restore run');
 await page.keyboard.press('r');if((await snap()).value!==24)throw Error('Restart failed');
 await advance(page,100);const visualBefore=await page.evaluate(()=>BlobRunner.visualSnapshot());await page.keyboard.down('ArrowRight');await advance(page,250);await page.keyboard.up('ArrowRight');const visualAfter=await page.evaluate(()=>BlobRunner.visualSnapshot());const shifts=visualAfter.particleX.map((x,i)=>x-visualBefore.particleX[i]);if(Math.max(...shifts)-Math.min(...shifts)<.002)throw Error('Formation moved rigidly');if((await snap()).value!==24)throw Error('Visual steering changed arithmetic');
 // A lateral camera follows the formation while the road and scenery move oppositely.
 await advance(page,350);
 const cameraRight=await page.evaluate(()=>({c:BlobRunner.cameraSnapshot(),labels:BlobRunner.labelSnapshot()}));
 if(cameraRight.c.x<=.1||cameraRight.c.roadNear.x>=cameraRight.c.width/2)throw Error('Camera did not follow right');
 const playerLabel=cameraRight.labels.labels.find(l=>l.key==='player');
 if(Math.abs((playerLabel.x1+playerLabel.x2)/2-cameraRight.c.width/2)>2)throw Error('Player is not centered under tracking camera');
 if(Math.abs(cameraRight.c.roadFar.x-cameraRight.c.width/2)>=Math.abs(cameraRight.c.roadNear.x-cameraRight.c.width/2))throw Error('Camera depth parallax failed');
 await page.screenshot({path:'blob-runner/docs/camera-right.png'});
 await page.keyboard.down('ArrowLeft');await advance(page,900);await page.keyboard.up('ArrowLeft');await advance(page,350);
 const cameraLeft=await page.evaluate(()=>BlobRunner.cameraSnapshot());
 if(cameraLeft.x>=-.1||cameraLeft.roadNear.x<=cameraLeft.width/2)throw Error('Camera did not follow left');
 await page.screenshot({path:'blob-runner/docs/camera-left.png'});
 await page.locator('#pause').click({force:true});await advance(page,500);
 if(Math.abs((await page.evaluate(()=>BlobRunner.cameraSnapshot())).x-cameraLeft.x)>1e-8)throw Error('Camera moved while paused');
 await page.locator('#pause').click({force:true});
 await page.locator('#full').click({force:true});await page.waitForFunction(()=>!!document.fullscreenElement,null,{polling:100});await page.locator('#full').click({force:true});await page.waitForFunction(()=>!document.fullscreenElement,null,{polling:100});
 // Touch/portrait and landscape resizing, no overflow; pointer steering.
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 mobile.on('pageerror',e=>errors.push(e.message));await initClock(mobile);await mobile.goto(require('url').pathToFileURL(require('path').resolve(__dirname,'../Blob_Runner.html')).href);await mobile.locator('#begin').tap({force:true});
 await mobile.touchscreen.tap(70,650);await advance(mobile,700);if((await mobile.evaluate(()=>BlobRunner.snapshot())).x>=0)throw Error('Touch steering failed');
 await mobile.screenshot({path:'blob-runner/docs/phone-start.png'});
 // Drag targets use a stable camera reference, even as the camera catches up.
 const dragBefore=await mobile.evaluate(()=>BlobRunner.snapshot());
 await mobile.mouse.move(195,620);await mobile.mouse.down();await mobile.mouse.move(285,620);await advance(mobile,500);
 const dragTarget=await mobile.evaluate(()=>BlobRunner.snapshot());
 await mobile.mouse.move(286,620);await advance(mobile,100);await mobile.mouse.up();
 const dragAfter=await mobile.evaluate(()=>BlobRunner.snapshot());
 if(dragAfter.x<=dragBefore.x||Math.abs(dragAfter.target-dragTarget.target)>.012)throw Error('Camera caused touch-drag steering feedback');
 await mobile.locator('#right').tap({force:true}); // pointer held functionality tested below
 const button=await mobile.locator('#right').boundingBox();await mobile.mouse.move(button.x+button.width/2,button.y+button.height/2);await mobile.mouse.down();await advance(mobile,500);await mobile.mouse.up();if((await mobile.evaluate(()=>BlobRunner.snapshot())).x<=0)throw Error('Onscreen arrow failed');
 await mobile.setViewportSize({width:844,height:390});await mobile.waitForTimeout(150);await advance(mobile,200);await mobile.screenshot({path:'blob-runner/docs/phone-landscape.png'});
 const mobileMetrics=await mobile.evaluate(()=>BlobRunner.metrics());
 const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight);if(overflow)throw Error('Mobile overflow');
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync('blob-runner/docs/browser-results.json',JSON.stringify({passed:true,checks:['camera follows right and left','player label stays centered','near/far camera parallax','camera freezes on pause','winning route','outnumbered player loses at zero','army labels avoid every army','top swarm box removed','both incoming swarms advance','direct approach without center waypoint','front impact','other swarm advances during cancellation','smooth footprint growth','differential particle lag','zero failure','wrong final gate stops -8 intact','full-width sign forcefield rejects unchanged -20','positive +20 passes sign forcefield','pause freeze','help pause restoration','keyboard restart','fullscreen enter and exit','touch steering','drag stable under moving camera','portrait and landscape fit','no page errors'],desktop:performance,mobile:mobileMetrics},null,2));
 await browser.close();console.log('Browser checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
