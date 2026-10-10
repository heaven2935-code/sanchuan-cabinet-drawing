const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname;
 const file=path.join(root,name==='/'?'index.html':name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
async function run(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({...(process.env.CAD_TEST_CHROME?{executablePath:process.env.CAD_TEST_CHROME}:{}),headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,acceptDownloads:true});
 const page=await context.newPage(),errors=[],answers=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept(answers.shift()??'2'));
 const base=`http://127.0.0.1:${server.address().port}/`;
 await page.goto(base);await page.waitForFunction(()=>!!window.__CAD_TEST__);
 const api=fn=>page.evaluate(fn);
 assert.equal(await api(()=>__CAD_TEST__.getCells().length),12);
 assert(await page.locator('#app').evaluate(e=>e.classList.contains('panel-closed')));
 assert((await page.locator('#stage').boundingBox()).width>330);
 // Inject device safe-area values to verify layout independently of the test device.
 await api(()=>{document.documentElement.style.setProperty('--safe-top','54px');document.documentElement.style.setProperty('--safe-bottom','34px');__CAD_TEST__.fit()});
 assert((await page.locator('.topbar').boundingBox()).y>=54);
 assert((await page.locator('.workspace').boundingBox()).y>=54+70);
 assert(await api(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/tmp/cad-v1.3-portrait.png'});
 await page.locator('#toggleInspector').click();assert(await page.locator('#inspector').isVisible());
 await page.locator('#closeInspector').click();assert(!(await page.locator('#inspector').isVisible()));
 const screen=async(x,y)=>page.evaluate(({x,y})=>{const v=__CAD_TEST__.getView(),r=document.getElementById('drawing').getBoundingClientRect();return {x:r.x+v.x+x*v.scale,y:r.y+v.y+y*v.scale}},{x,y});
 // Actual taps select two adjacent cells then merge without removing lower divider.
 for(const [x,y] of [[290,250],[870,250]]){const p=await screen(x,y);await page.touchscreen.tap(p.x,p.y)}
 assert.equal(await api(()=>__CAD_TEST__.getCellSelection().length),2);
 await page.locator('#mergeCells').click();assert.equal(await api(()=>__CAD_TEST__.getCells().length),11);
 assert(await api(()=>CabinetGrid.lines(__CAD_TEST__.getCells(),2320,2240).some(l=>l.axis==='x'&&l.value===580&&l.a===500)));
 await page.locator('#undo').click();assert.equal(await api(()=>__CAD_TEST__.getCells().length),12);
 await page.locator('#redo').click();assert.equal(await api(()=>__CAD_TEST__.getCells().length),11);
 // Split a selected merged cell and undo.
 let p=await screen(290,250);await page.touchscreen.tap(p.x,p.y);await page.locator('#splitCount').fill('3');await page.locator('#splitColumns').click();assert.equal(await api(()=>__CAD_TEST__.getCells().length),13);
 await page.locator('#undo').click();
 // Header click edits width to 620 mm; other rows follow the same coordinate.
 let header=page.locator('[data-grid-axis="x"][data-grid-start="0"]').first();await header.click();await page.locator('#dimensionInput').fill('620');await page.locator('#applyDimension').click();
 assert(await api(()=>__CAD_TEST__.getCells().some(c=>c.x2===620)));
 await page.locator('#undo').click();
 // Select and drag a real divider; one undo restores it.
 p=await screen(1160,1200);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+25,p.y,{steps:4});await page.mouse.up();
 assert(await api(()=>__CAD_TEST__.getCells().some(c=>c.x1!==1160&&c.x1>1160&&c.x1<1740)));
 await page.locator('#undo').click();assert(await api(()=>__CAD_TEST__.getCells().some(c=>c.x1===1160)));
 // Select a divider by tapping and change exact position in the compact action strip.
 p=await screen(1160,1200);await page.touchscreen.tap(p.x,p.y);await page.locator('#linePosition').fill('1201');await page.locator('#applyLinePosition').click();
 assert(await api(()=>__CAD_TEST__.getCells().some(c=>c.x1===1201)));
 await page.locator('#undo').click();
 // JSON has grid cells; export must omit selection tint and headers.
 await api(()=>__CAD_TEST__.save());let before=await api(()=>__CAD_TEST__.getDoc());
 await page.reload();assert.deepEqual(await api(()=>__CAD_TEST__.getDoc()),before);
 const svg=await api(()=>__CAD_TEST__.exportSVGString());assert(!svg.includes('data-grid-axis'));assert(!svg.includes('#418c8733'));
 await page.locator('#toggleInspector').click();
 const downloadWait=page.waitForEvent('download');await page.locator('#exportJSON').click();const download=await downloadWait;assert(download.suggestedFilename().endsWith('.json'));
 // Legacy JSON/localStorage still opens with shapes and physical dimensions intact.
 await api(()=>{localStorage.setItem('sanchuan_cabinet_cad_v1',JSON.stringify({version:1,name:'舊圖面',width:1200,height:2000,depth:600,vertical:[400,800],horizontal:[{x1:0,x2:400,y:800}],shapes:[{type:'line',x1:100,y1:100,x2:200,y2:200,text:'',color:'#ab624c'}]}))});
 await page.reload();assert.equal(await api(()=>__CAD_TEST__.getDoc().name),'舊圖面');assert.equal(await api(()=>__CAD_TEST__.getDoc().shapes.length),1);assert.equal(await api(()=>__CAD_TEST__.getCells().length),4);
 await api(()=>{__CAD_TEST__.setMode('select');__CAD_TEST__.applySize(2400,4000,600)});assert.equal(await api(()=>__CAD_TEST__.getDoc().shapes[0].x2),400);
 await page.setViewportSize({width:852,height:393});await page.waitForTimeout(350);
 await api(()=>{document.documentElement.style.setProperty('--safe-top','0px');document.documentElement.style.setProperty('--safe-bottom','21px');document.documentElement.style.setProperty('--safe-left','59px');document.documentElement.style.setProperty('--safe-right','59px');__CAD_TEST__.setMode('cells');__CAD_TEST__.fit()});
 assert((await page.locator('.toolbar').boundingBox()).x>=59);
 assert(await api(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/tmp/cad-v1.3-landscape.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: mobile layouts, simulated safe areas, actual cell taps, merge/split, header size edit, line drag, exact line input, undo/redo, old data, save/reload and SVG/JSON export');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
