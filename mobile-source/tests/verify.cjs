'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts.forEach((s,i)=>new vm.Script(s,{filename:`script-${i}.js`}));
function engineFrom(src){const code=[...src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1],sandbox={module:{exports:{}},TextEncoder,TextDecoder,Uint8Array,DataView,ArrayBuffer,Blob,setTimeout,clearTimeout,Date,Math};vm.runInNewContext(code,sandbox);return sandbox.module.exports;}
const engine=engineFrom(html),original=engineFrom(fs.readFileSync(path.join(root,'legacy-source.html'),'utf8'));
const policy=require('../ui-policy.js');let count=0;
const palette={ink:'#203038',sub:'#60727b',mute:'#85949b',sheet:'#ffffff',tint:'#eef3f4',accent:'#147c88'};
function check(label,fn){fn();count++;process.stdout.write('PASS '+label+'\n');}
const sum=(a,k)=>a.reduce((s,x)=>s+x[k],0),plain=x=>JSON.parse(JSON.stringify(x));
check('main scripts parse without errors',()=>assert.equal(scripts.length,3));
check('all 47 original styles remain available',()=>assert.equal(engine.STYLES.length,47));
check('dimensions stay consistent for every style and base width',()=>{
  for(const W of [800,1800,2400,4200])for(const style of engine.STYLES){
    const base={W,H:2400,T:18,kick:100,labels:true,id:'',name:'測試'},s=engine.styleState(style,base),a=original.styleState(original.STYLES.find(x=>x.id===style.id),base);
    const legacy=plain(s);delete legacy.kickSetback;delete legacy.faceGap;assert.deepEqual(legacy,plain(a));assert.equal(s.kickSetback,50);assert.equal(s.faceGap,4);assert.equal(sum(s.cols,'w'),s.W);
    for(const c of s.cols){assert.equal(sum(c.parts,'h'),s.H-s.kick);assert(c.w>0);for(const p of c.parts){assert(p.h>0);if(p.ins)assert.equal(sum(p.ins,'h'),p.h)}}
  }
});
check('net shelf heights plus board thickness equal available height',()=>{
  const cases=[{n:3,gs:[320,350,400],clear:1800},{n:4,clear:2200},{n:0,clear:450}];
  for(const x of cases){const gaps=engine.gapsOf(x,x.clear,18);assert(Math.abs(gaps.reduce((s,v)=>s+v,0)+x.n*18-x.clear)<1e-6);assert(gaps.every(v=>v>0));}
});
check('normalization preserves width/height sums after inconsistent input',()=>{
  const s=engine.normalize({W:2400,H:2400,kick:100,T:18,cols:[{w:700,parts:[{t:'open',h:800,n:2},{t:'drawer',h:400,n:2}]},{w:900,parts:[{t:'door',h:1800,n:1}]}]});
  assert.equal(sum(s.cols,'w'),2400);s.cols.forEach(c=>assert.equal(sum(c.parts,'h'),2300));
});
check('SVG and DXF exports contain finite geometry for both views',()=>{
  for(const style of engine.STYLES){const s=engine.styleState(style,{W:1800,H:2400,T:18,kick:100,labels:true});for(const view of ['out','in']){const g=engine.geom(s,{S:8,view}),svg=engine.toSVG(g.art,8,palette).art;assert(!/\b(?:NaN|Infinity|undefined)\b/.test(svg));}const dxf=engine.toDXF(s);assert(dxf.includes('ENTITIES'));assert(!/\b(?:NaN|Infinity|undefined)\b/.test(dxf));}
});
check('four-point correction maps all corners to exact real dimensions',()=>{
  const a=[[10,20],[210,10],[195,155],[20,160]],b=[[0,0],[2000,0],[2000,1500],[0,1500]],h=engine.homog(a,b);assert(h);a.forEach((q,i)=>{const p=engine.hmap(h,q[0],q[1]);assert(Math.abs(p[0]-b[i][0])<1e-6);assert(Math.abs(p[1]-b[i][1])<1e-6)});
});
check('conversion to free drawing preserves closed cabinet regions',()=>{
  const s=engine.normalize(engine.sample0()),f=engine.toFree(s),faces=engine.freeFaces(f);assert.equal(f.kind,'free');assert.equal(f.W,s.W);assert.equal(f.H,s.H);assert(faces.length>0);faces.forEach(x=>{assert(x.x2>x.x1);assert(x.z2>x.z1)});
});
check('fixed outer lines never offer delete or move',()=>assert.deepEqual(policy.actions({kind:'line',movable:false,removable:false}).map(x=>x.id),['dimensions']));
check('small or locked cells hide unavailable divider actions',()=>assert.deepEqual(policy.actions({kind:'cell',splitV:false,splitH:false,more:true}).map(x=>x.id),['settings','more']));
check('operation mode retracts contextual action buttons',()=>assert.deepEqual(policy.actions({kind:'cell',busy:true,splitV:true,splitH:true}),[]));
check('annotation menu only contains applicable actions',()=>assert.deepEqual(policy.actions({kind:'annotation'}).map(x=>x.id),['move','settings','delete']));
check('single-cell multi-selection hides merge and distribution',()=>assert.deepEqual(policy.actions({kind:'multi',merge:false,evenWidth:false,evenHeight:false,more:true}).map(x=>x.id),['more']));
check('typed offsets retain both minimum compartments',()=>{assert.equal(policy.clampOffset(2000,600),550);assert.equal(policy.clampOffset(-4,600),50);assert.equal(policy.clampOffset('bad',600),null);assert.equal(policy.clampOffset(30,80),null);assert.equal(policy.clampOffset(180.6,600),181)});
check('ruler markers use the same aspect-preserving coordinates as the paper',()=>{
  for(const [w,h,vb] of [[390,700,[0,0,2400,2400]],[780,320,[-300,200,3000,1800]],[390,700,[900,800,600,600]]]){
    const m=policy.viewportMap(w,h,vb);for(const q of [{x:0,y:0},{x:1200,y:1400},{x:2400,y:2300}]){const p=policy.worldToScreen(m,q),back=policy.screenToWorld(m,p);assert(Math.abs(back.x-q.x)<1e-8);assert(Math.abs(back.y-q.y)<1e-8)}
  }
});
check('zoomed ruler drag returns the exact drawing position',()=>{const m=policy.viewportMap(400,800,[900,1000,600,1200]);const q=policy.screenToWorld(m,{x:200,y:400});assert.equal(q.x,1200);assert.equal(q.y,1600);assert.equal(2400-q.y,800);});
check('ruler tick spacing stays legible across zoom levels',()=>{for(const scale of [.03,.12,.8,2,10]){const step=policy.rulerStep(64/scale);assert(step*scale>=64-1e-8);assert(step*scale<=160);assert(step>0)}});
check('touch interface includes direct tap, pan, pinch and cancel handling',()=>{const s=fs.readFileSync(path.join(root,'mobile-ui.js'),'utf8');for(const k of ['pointerdown','pointermove','pointerup','pointercancel','mOnDown','mOnMove','mOnUp','mOperationPoint','mConfirmOperation'])assert(s.includes(k));assert(s.includes('e.stopImmediatePropagation()'));assert(!s.includes('disabled="'));});
check('artifact is self-contained and has every referenced local asset',()=>{assert(!html.includes('fonts.googleapis.com'));for(const f of ['logo.svg','manifest.webmanifest','icon-180.png','icon-512.png'])assert(fs.existsSync(path.join(root,'dist',f)));const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist/manifest.webmanifest')));assert.equal(manifest.display,'standalone');});
const s=engine.styleState(engine.STYLES.find(s=>s.id==='wardrobe'),{W:1800,H:2400,T:18,kick:100,labels:true,name:'衣櫃立面'}),svg=engine.exportSVG(s).svg;
fs.mkdirSync(path.join(root,'qa'),{recursive:true});fs.writeFileSync(path.join(root,'qa/cabinet.svg'),svg);
process.stdout.write(`${count} verification groups passed.\n`);
