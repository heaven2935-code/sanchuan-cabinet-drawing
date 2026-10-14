'use strict';
const assert=require('node:assert/strict'),{boot}=require('./dom-harness.cjs');
const plain=v=>JSON.parse(JSON.stringify(v));
(async()=>{const b=await boot(),{qa:q,document:d,window:w}=b,base=q.state().st;let count=0;
const originalState=q.state,voiceState=q.voice.state,normalize=q.normalize;
q.state=()=>plain(originalState());q.voice.state=()=>plain(voiceState());q.normalize=s=>plain(normalize(s));
const check=async(name,fn)=>{await fn();count++;process.stdout.write('PASS '+name+'\n');};
const click=s=>{assert(d.querySelector(s),s);d.querySelector(s).click();};
const end=()=>{if(q.voice.state().session?.status!=='ended'&&q.voice.state().session)click('#mVoiceEnd');};
const load=(s=base,v='out')=>{end();q.load(plain(s),v);};
const setup=async(lineType='line',x='1800',y='0')=>{load();await q.run('voice');d.querySelector('#mVoiceX').value=x;d.querySelector('#mVoiceY').value=y;d.querySelector('#mVoiceLine').value=lineType;click('#mVoiceBegin');assert(q.voice.state().session);};
const send=text=>{d.querySelector('#mVoiceCommand').value=text;d.querySelector('#mVoiceCommandForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
try{
await check('one session draws three connected lines with dimensions and one undo per segment',async()=>{
  await setup();const before=plain(q.state().st.cols);
  for(const text of ['往上1200','往左1800','往下1200']){const count=q.state().st.ann.length;send(text);assert.equal(q.state().st.ann.length,count);assert(d.querySelector('#voice-preview').textContent.includes(text.includes('左')?'1800 mm':'1200 mm'));send('確認');}
  const s=q.state();assert.equal(s.st.ann.length,3);assert.equal(s.hist,3);assert.deepEqual(s.st.cols,before);assert.deepEqual(q.voice.state().session.point,{x:0,y:2400});assert.equal(s.st.ann[1].x1,s.st.ann[0].x2);assert.equal(s.st.ann[1].y1,s.st.ann[0].y2);assert(q.exportSVG().svg.includes('1800 mm'));assert(q.exportDXF().includes('1200 mm'));
});
await check('interim updates, duplicate finals and stale epochs do not duplicate or confirm drawings',async()=>{
  await setup();const s=q.voice.state(),meta={sessionId:s.session.id,epoch:s.epoch};q.voice.receive('上100',{...meta,final:false});q.voice.receive('上1200確認',{...meta,final:false});assert.equal(q.state().st.ann.length,0);assert.equal(q.voice.state().session.pending,null);q.voice.receive('確認',meta);assert.equal(q.state().st.ann.length,0);
  q.voice.receive('上1200',{...meta,eventId:'recognizer:0'});q.voice.receive('上1200',{...meta,eventId:'recognizer:0'});q.voice.receive('確認',{...meta,eventId:'recognizer:1'});q.voice.receive('確認',{...meta,eventId:'recognizer:1'});assert.equal(q.state().st.ann.length,1);
  q.voice.receive('上1200確認',{...meta,epoch:meta.epoch-1,eventId:'old:0'});assert.equal(q.state().st.ann.length,1);q.voice.receive('上1200確認',{...meta,sessionId:'old-session'});assert.equal(q.state().st.ann.length,1);
});
await check('cancel, undo, global redo and next command maintain one correct endpoint',async()=>{
  await setup();send('上1200確認');send('左500');send('取消');assert.equal(q.state().st.ann.length,1);assert.deepEqual(q.voice.state().session.point,{x:1800,y:1200});send('復原上一段');assert.equal(q.state().st.ann.length,0);assert.equal(q.state().hist,0);assert.deepEqual(q.voice.state().session.point,{x:1800,y:2400});click('#mRedo');assert.equal(q.state().st.ann.length,1);send('繼續');send('左1800確認');assert.equal(q.state().st.ann.length,2);assert.deepEqual(q.voice.state().session.point,{x:0,y:1200});
});
await check('out-of-range, malformed and unknown-unit finals cannot commit stale previews',async()=>{
  await setup();for(const bad of ['左1801','上2401','上一千二','上1公分','上0']){send('上100');send(bad);send('確認');assert.equal(q.state().st.ann.length,0);assert.equal(q.voice.state().session.pending,null);assert.deepEqual(q.voice.state().session.point,{x:1800,y:2400});}
});
await check('pause, resume, end and background protect draft and confirmed geometry',async()=>{
  await setup();send('上1200');send('暫停');send('確認');assert.equal(q.state().st.ann.length,0);send('繼續');send('確認');assert.equal(q.state().st.ann.length,1);
  send('左500');Object.defineProperty(d,'hidden',{configurable:true,value:true});d.dispatchEvent(new w.Event('visibilitychange'));assert.equal(q.voice.state().session.status,'paused');assert.equal(q.voice.state().session.pending,null);const epoch=q.voice.state().epoch;q.voice.receive('左500確認',{epoch:epoch-1});assert.equal(q.state().st.ann.length,1);Object.defineProperty(d,'hidden',{configurable:true,value:false});send('繼續');send('左500');send('結束');assert.equal(q.state().st.ann.length,1);assert(d.querySelector('#voice-preview').innerHTML==='');assert(d.querySelector('#mVoiceDock').hidden);
});
await check('page/file and view switches pause commands rather than draw into a different sheet',async()=>{
  await setup();send('上1200確認');const orig=plain(q.state().st);await q.run('addpage');assert.equal(q.voice.state().session.status,'paused');send('繼續');send('右100確認');assert.equal(q.state().st.ann.length,0);await q.run('page:0');send('繼續');send('左1800確認');assert.equal(q.state().st.ann.length,2);assert.equal(q.state().pj.sheets[1].ann.length,0);
  click('#mView');assert.equal(q.voice.state().session.status,'paused');send('右100確認');assert.equal(q.state().st.ann.length,2);click('#mView');send('繼續');
  // A restored project reusing the same sid is still a different file instance.
  q.load(orig);q.voice.receive('右100確認');assert.equal(q.state().st.ann.length,1);assert.equal(q.voice.state().session.status,'paused');
});
await check('zoom, pan and fit do not change mm endpoints or pending lengths',async()=>{
  await setup();send('上1200');const before=plain(q.voice.state().session),svg=d.querySelector('#dw'),event=(type,x,y)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:8,clientX:x,clientY:y});svg.dispatchEvent(e);};
  const oldZoom=q.state().zoom;event('pointerdown',100,300);event('pointermove',180,370);event('pointerup',180,370);assert.notEqual(q.state().zoom.cx,oldZoom.cx);
  q.zoom(2.5);q.render();click('#mFit');assert.deepEqual(q.voice.state().session.point,before.point);assert.deepEqual(q.voice.state().session.pending,before.pending);assert.equal(q.voice.state().session.status,'pending');send('確認');assert.equal(q.state().st.ann[0].y2,1200);
});
await check('four line types and hundredth-mm start values retain exact saved dimensions',async()=>{
  for(const type of ['line','dashed','arrow','dim']){await setup(type,'1800.05','0.05');send('上1200.05確認');const a=q.state().st.ann[0];assert.equal(a.x1,1800.05);assert.equal(a.y1,2399.95);assert.equal(a.y2,1199.9);assert.equal(a.measure.lineType,type);const svg=q.exportSVG().svg;assert(svg.includes('1200.05 mm'));assert(svg.includes('x1="1800.05" y1="2399.95" x2="1800.05" y2="1199.9"'));if(type==='dashed')assert(svg.includes('stroke-dasharray'));const normalized=q.normalize(plain(q.state().st));assert.deepEqual(normalized.ann,q.state().st.ann);}
});
await check('persisted JSON, IndexedDB, backups and reload keep confirmed lines only',async()=>{
  await setup();send('上1200確認');send('左500');q.save();const saved=JSON.parse(b.memory.get('sc-mobile-proj'));assert.equal(saved.sheets[0].ann.length,1);assert(saved.sheets[0].ann[0].measure);assert(!JSON.stringify(saved).includes('pending'));
  await q.run('save');await new Promise(r=>setTimeout(r,30));const list=await q.storeList();assert(list.some(x=>JSON.parse(x.json).sheets[0].ann.length===1));await q.run('backup');assert(b.downloads.length);const data=JSON.parse(await b.downloads.at(-1).text());assert.equal(data.project.sheets[0].ann.length,1);
  const other=await boot(b.memory);try{assert.equal(other.qa.state().st.ann.length,1);assert.equal(other.qa.voice.state().session,null);assert(other.qa.exportSVG().svg.includes('1200 mm'));}finally{other.dispose();}
});
await check('voice undo refuses to roll back unrelated edits or another operation after the segment',async()=>{
  await setup();send('上1200確認');q.ann({k:'text',s:'保留',x:100,y:100,v:'out'});const r=q.voice.receive('復原上一段');assert.equal(r.error,'history');assert.equal(q.state().st.ann.length,2);assert(q.state().st.ann.some(a=>a.s==='保留'));
});
await check('annotation capacity is checked before commit and never silently truncates saved lines',async()=>{
  load({...plain(base),ann:Array.from({length:199},(_,i)=>({k:'text',s:'T'+i,x:0,y:0}))});await q.run('voice');d.querySelector('#mVoiceX').value='1800';d.querySelector('#mVoiceY').value='0';click('#mVoiceBegin');send('上1200確認');assert.equal(q.state().st.ann.length,200);send('左500確認');assert.equal(q.state().st.ann.length,200);assert.equal(q.voice.state().session.pending,null);assert.equal(q.normalize(q.state().st).ann.length,200);
});
await check('drawing-picked start respects left-bottom origin; invalid starts do not open a session',async()=>{
  load();await q.run('voice');d.querySelector('#mVoiceX').value='2401';click('#mVoiceBegin');assert.equal(q.voice.state().session.status,'ended');assert.equal(q.state().panel,'voiceSetup');click('#mVoicePick');q.tap({x:-1,y:500});assert(q.voice.state().picking);q.tap({x:2000,y:2200});assert.equal(d.querySelector('#mVoiceX').value,'2000');assert.equal(d.querySelector('#mVoiceY').value,'200');click('#mVoiceBegin');assert.deepEqual(q.voice.state().session.point,{x:2000,y:2200});
});
await check('free drawing and interior views keep voice measurements as annotations only',async()=>{
  for(const [state,view] of [[q.toFree(plain(base)),'out'],[base,'in']]){load(state,view);await q.run('voice');d.querySelector('#mVoiceX').value='1800';d.querySelector('#mVoiceY').value='0';click('#mVoiceBegin');const before=plain(q.state().st);send('上1200確認');assert.equal(q.state().st.ann[0].v,view);assert.deepEqual(q.state().st.ln,before.ln);assert.deepEqual(q.state().st.cols,before.cols);assert(q.exportSVG().svg.includes('1200 mm'));}
});
await check('malformed imported measurement metadata cannot break a new session or alter its endpoint',async()=>{
  load({...plain(base),ann:[{k:'line',x1:10,y1:10,x2:20,y2:20,measure:{id:12}}]});await q.run('voice');d.querySelector('#mVoiceX').value='1800';d.querySelector('#mVoiceY').value='0';click('#mVoiceBegin');assert.deepEqual(q.voice.state().session.point,{x:1800,y:2400});send('上1200確認');assert.equal(q.state().st.ann.length,2);assert(!/NaN|Infinity/.test(q.snapshot()));
});
await check('pagehide never saves unrelated unconfirmed annotation-move previews',async()=>{
  load();q.ann({k:'line',x1:150,y1:250,x2:450,y2:250,c:'#147c88',lw:8,v:'out'});q.save();const before=JSON.parse(b.memory.get('sc-mobile-proj')).sheets[0].ann;q.tap({x:300,y:250});await q.run('move');q.point({x:700,y:700});w.dispatchEvent(new w.Event('pagehide'));assert.deepEqual(JSON.parse(b.memory.get('sc-mobile-proj')).sheets[0].ann,before);q.finish();assert.deepEqual(q.state().st.ann,before);
});
process.stdout.write(count+' voice UI verification groups passed.\n');
}finally{b.dispose();}})().catch(e=>{console.error(e);process.exitCode=1;});
