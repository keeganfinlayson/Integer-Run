const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{
 const a=process.env.BLOB_CHROMIUM_MODULE?require(process.env.BLOB_CHROMIUM_MODULE).default:null;
 if(a){fs.chown=(p,u,g,cb)=>cb(null);fs.lchown=(p,u,g,cb)=>cb(null);}
 const b=await chromium.launch(a?{executablePath:await a.executablePath(),headless:true,args:['--no-sandbox','--disable-gpu']}:{headless:true});
 const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true});
 await p.goto(require('url').pathToFileURL(path.resolve(__dirname,'../Blob_Runner.html')).href);await p.locator('#begin').click();await p.waitForTimeout(500);await p.locator('#pause').click();
 fs.mkdirSync('qa',{recursive:true});await p.screenshot({path:'qa/landscape-final.png'});
 for(const viewport of [{width:844,height:390},{width:390,height:844},{width:1024,height:768},{width:320,height:568}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(100);
  const m=await p.evaluate(()=>({ratio:document.getElementById('stage').getBoundingClientRect().width/document.getElementById('stage').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,noticeBottom:document.getElementById('notice').getBoundingClientRect().bottom,buttons:[...document.querySelectorAll('header button')].map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};})}));
  if(Math.abs(m.ratio-9/16)>.002)throw Error('Playfield is not portrait');
  if(m.overflow||m.buttons.some(b=>b.left<0||b.right>viewport.width||b.top<0||b.bottom>viewport.height))throw Error('Viewport clipped: '+JSON.stringify(viewport));
 }
 await p.setContent('<iframe id="frame" sandbox="allow-scripts" style="width:800px;height:600px"></iframe>');
 await p.evaluate(html=>document.getElementById('frame').srcdoc=html,fs.readFileSync(path.resolve(__dirname,'../Blob_Runner.html'),'utf8'));
 const frame=p.frameLocator('#frame');await frame.locator('#begin').click();await p.waitForTimeout(200);const value=await frame.locator('#game').getAttribute('aria-label');if(!value.includes('Current army +24'))throw Error('Sandbox embed failed');
 fs.writeFileSync('blob-runner/docs/layout-results.json',JSON.stringify({passed:true,viewports:['844x390','390x844','1024x768','320x568'],checks:['9:16 portrait field in every viewport','No document overflow','Header buttons within viewport','Script-only sandbox iframe loads and starts']},null,2));
 await b.close();console.log('Layout and iframe checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
