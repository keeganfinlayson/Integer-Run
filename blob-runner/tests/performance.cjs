const {chromium}=require('playwright'),fs=require('fs');
(async()=>{
 const alternate=process.env.BLOB_CHROMIUM_MODULE?require(process.env.BLOB_CHROMIUM_MODULE).default:null;
 if(alternate){fs.chown=(p,u,g,cb)=>cb(null);fs.lchown=(p,u,g,cb)=>cb(null);}
 const browser=await chromium.launch(alternate?{executablePath:await alternate.executablePath(),headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']}:{headless:true});
 const p=await browser.newPage({viewport:{width:1365,height:900}});
 await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname,'../Blob_Runner.html')).href);
 await p.locator('#begin').click();await p.locator('#pause').click();
 const cdp=await p.context().newCDPSession(p);
 async function sample(name,rate){await cdp.send('Emulation.setCPUThrottlingRate',{rate});await p.evaluate(()=>BlobRunner.resetMetrics());await p.waitForTimeout(4000);return {name,cpuThrottle:rate,...await p.evaluate(()=>BlobRunner.metrics())};}
 const normal=await sample('24 blobs, desktop, normal CPU',1);
 // Exact quantity and scene rendering remain independent at ten thousand.
 await p.evaluate(()=>{BlobMath.LEVEL.start=10000;document.getElementById('restart').click();document.getElementById('pause').click();});
 const stress=await sample('10000 quantity, desktop, 4x CPU throttle',4);
 const state=await p.evaluate(()=>BlobRunner.snapshot());if(state.value!==10000)throw Error('Renderer changed quantity');if(stress.drawnSprites>400)throw Error('Sprite cap exceeded');
 await p.setViewportSize({width:390,height:844});const phone=await sample('10000 quantity, phone viewport, 4x CPU throttle',4);
 fs.writeFileSync('blob-runner/docs/performance-results.json',JSON.stringify({browser:await browser.version(),samples:[normal,stress,phone],note:'Headless Linux software rendering, paused world with animated draw loop. CPU throttle is a proxy, not actual Chromebook hardware. Draw timings are rolling 300-frame measurements.'},null,2));
 await browser.close();console.log('Performance sampling complete');
})().catch(e=>{console.error(e);process.exit(1)});
