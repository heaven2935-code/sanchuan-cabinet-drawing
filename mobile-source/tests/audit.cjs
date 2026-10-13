'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./dom-harness.cjs');
const plain=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>assert.deepEqual(plain(a),plain(b));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const b=await boot(),{qa:q,document:d,window:w}=b,base=q.state().st,report={styles:47,widths:[800,2400,4200],cellPicks:0,framePicks:0,groups:[]};
  const check=async(name,fn)=>{await fn();report.groups.push(name);fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,process.env.AUDIT_SKIP_SWEEP?'../qa/audit-report-partial.json':'../qa/audit-report.json'),JSON.stringify(report,null,2));process.stdout.write('PASS '+name+'\n')};
  const click=id=>{const e=d.querySelector(id);assert(e,id);e.click()};
  const submit=()=>d.querySelector('#mForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  const load=(s=base,v='out')=>q.load(plain(s),v);
  const pickCell=(s,ci,pi,si,y0,h,x0,ww)=>{for(const frac of [.371,.233,.617,.811]){q.tap({x:x0+ww*.41,y:y0+h*frac});const a=q.state();if(a.sel&&a.sel.g==null&&a.sel.c===ci&&a.sel.p===pi&&(si==null||a.sel.s===si)){report.cellPicks++;return;}q.finish();}throw Error('Unselectable cell '+JSON.stringify({ci,pi,si,y0,h,W:s.W}));};
  await check('complete app boots with functioning mobile controls',()=>{assert.equal(q.state().st.W,2400);assert(d.querySelector('#mTitle strong').textContent);assert(d.querySelector('#dw #art').childNodes.length>0);assert(!d.querySelector('#mDepth').hidden===false);});
  if(!process.env.AUDIT_SKIP_SWEEP)await check('all 47 styles at three widths have selectable cells in both views',()=>{
    for(const W of report.widths)for(const style of q.styles){const s=q.styleState(style,{W,H:2400,T:18,kick:100,labels:false});
      for(const view of ['out','in']){load(s,view);let x=0;s.cols.forEach((c,ci)=>{let y=0;c.parts.forEach((p,pi)=>{
        if(view==='in'&&p.t==='door'&&p.ins&&c.w>4*s.T&&p.h>4*s.T){let sy=y;p.ins.forEach((a,si)=>{pickCell(s,ci,pi,si,sy,a.h,x,c.w);q.finish();sy+=a.h});}
        else{pickCell(s,ci,pi,null,y,p.h,x,c.w);q.finish();}y+=p.h});x+=c.w});}
      if(W===2400&&q.styles.indexOf(style)%10===0)process.stdout.write('AUDIT styles '+q.styles.indexOf(style)+' / 47\n');
    }
  });
  if(!process.env.AUDIT_SKIP_SWEEP)await check('structural dividers and interior shelf lines can be selected in every style',()=>{
    const matches=(a,h)=>a.hsel&&a.hsel.k===h.k&&(h.k==='r'?Math.abs(a.hsel.y-h.y)<.5:h.k==='c'?a.hsel.i===h.i:h.k==='s'?a.hsel.c===h.c&&a.hsel.p===h.p&&a.hsel.i===h.i:true);
    report.linePicks=0;for(const style of q.styles){const s=q.styleState(style,{W:2400,H:2400,T:18,kick:100});load(s);const H=q.handles().filter(h=>!h.fixed);for(const h of H){const seg=q.segment(h);let found=false;for(const f of [.271,.371,.613]){q.tap({x:seg.x1+(seg.x2-seg.x1)*f,y:seg.y1+(seg.y2-seg.y1)*f});if(matches(q.state(),h)){found=true;break;}q.finish();}assert(found,style.id+' '+h.k);report.linePicks++;q.finish();}
      load(s,'in');for(const r of q.regions()){if(r.type!=='shelf'&&r.type!=='open')continue;const state=q.state().st,c=state.cols[r.ci],p=c.parts[r.pi],x=r.si==null?p:p.ins[r.si];if(!x.n||r.layer==null||r.layer>=x.n)continue;const pt={x:r.x+r.w*.31,y:r.y+r.h+state.T/2};q.tap(pt);assert(q.state().sel?.g!=null,style.id+' shelf');report.linePicks++;q.finish();}
    }
  });
  await check('all four cabinet frames can be selected and fixed baselines expose only dimensions',()=>{
    load();for(const [point,key]of [[{x:0,y:400},'left'],[{x:800,y:2400},'bottom'],[{x:2400,y:400},'right'],[{x:300,y:0},'top']]){q.tap(point);const a=q.selection();assert.equal(a.kind,'line');if(key==='left'||key==='bottom'){assert.equal(a.movable,false);assert.equal(a.removable,false);assert(d.querySelector('[data-m="dimensions"]'));assert(!d.querySelector('#mActions [data-m="delete"]'));}report.framePicks++;q.finish();}
    load({...plain(base),kick:400});q.tap({x:300,y:2200});assert.equal(q.state().hsel.k,'k');
  });
  await check('centered horizontal grip keeps its own selection at a crossing with a vertical divider',()=>{
    const s=q.normalize({W:1200,H:2400,kick:100,T:18,cols:[{w:600,parts:[{t:'open',h:1150,n:0},{t:'drawer',h:1150,n:2}]},{w:600,parts:[{t:'open',h:1150,n:0},{t:'drawer',h:1150,n:2}]}]});load(s);q.tap({x:180,y:1150});assert.equal(q.state().hsel.k,'r');const el=d.querySelector('#ui [data-h="r"]');assert(el);q.tap({x:600,y:1150},el);assert.equal(q.state().hsel.k,'r');
  });
  await check('precise moves and splits keep typed millimeters, clamp limits, cancel cleanly and undo/redo',async()=>{
    load();const before=q.state().st;q.tap({x:600,y:400});await q.run('move');q.offset(537);q.confirm();assert.equal(q.state().st.cols[0].w,537);assert.equal(q.state().st.W,2400);assert.equal(q.state().hist,1);click('#mUndo');same(q.state().st.cols,before.cols);click('#mRedo');assert.equal(q.state().st.cols[0].w,537);
    q.tap({x:537,y:400});await q.run('move');q.offset(590);q.finish();assert.equal(q.state().st.cols[0].w,537);
    load();q.tap({x:200,y:500});await q.run('splitV');q.offset(337);q.confirm();assert.equal(q.state().st.cols[0].w,337);assert.equal(q.state().st.cols[1].w,263);click('#mUndo');same(q.state().st.cols,base.cols);
    q.tap({x:200,y:500});await q.run('splitH');q.offset(873);q.confirm();assert.equal(q.state().st.cols[0].parts[0].h,873);assert.equal(q.state().st.H,2400);
  });
  await check('cell settings form creates one undo record and dimensions stay balanced',async()=>{
    load();q.tap({x:200,y:500});await q.run('settings');d.querySelector('#mCW').value='650';submit();assert.equal(q.state().st.cols[0].w,650);assert.equal(q.state().st.cols[1].w,550);assert.equal(q.state().hist,1);click('#mUndo');same(q.state().st.cols,base.cols);
    await q.run('overall');d.querySelector('#mW').value='-5';submit();assert.equal(q.state().st.W,2400);assert.equal(q.state().panel,'overall');d.querySelector('#mW').value='2700';submit();assert.equal(q.state().st.W,2700);assert.equal(q.state().st.cols.reduce((a,c)=>a+c.w,0),2700);
  });
  await check('depth toggle persists, planar editing suspends depth and completion restores it',async()=>{
    load(base,'in');click('#mDepth');assert.equal(q.state().prefs.interiorView,'depth');assert(q.snapshot().includes('#ccd9e0'));const saved=JSON.parse(b.memory.get('sc-mobile-display-v1'));assert.equal(saved.interiorView,'depth');
    q.tap({x:200,y:500});await q.run('settings');assert.equal(q.state().runtime.editing,true);assert(!q.snapshot().includes('#ccd9e0'));click('#mSheetClose');assert.equal(q.state().runtime.editing,false);assert(q.snapshot().includes('#ccd9e0'));
    q.tap({x:1400,y:300});assert.equal(q.state().view,'out');assert.equal(q.state().sel.c,2);await q.run('settings');submit();assert.equal(q.state().view,'in');assert(q.snapshot().includes('#ccd9e0'));
  });
  await check('annotations can be selected on their strokes without stealing taps inside empty rectangles',()=>{
    load();q.ann({k:'rect',x1:100,y1:100,x2:1000,y2:1500,c:'#147c88',lw:16,v:'out'});q.tap({x:300,y:500});assert.equal(q.selection().kind,'cell');q.tap({x:100,y:600});assert.equal(q.selection().kind,'annotation');q.finish();q.zoom(4);q.tap({x:220,y:600});assert.equal(q.selection().kind,'cell');
    q.ann({k:'pen',pts:[[180,180],[900,180]],c:'#147c88',lw:8,v:'out'});q.tap({x:400,y:180});assert.equal(q.selection().kind,'annotation');
  });
  await check('annotation move cancellation restores original geometry and confirmation can be undone',async()=>{
    load();q.ann({k:'line',x1:150,y1:250,x2:450,y2:250,c:'#147c88',lw:8,v:'out'});const original=plain(q.state().st.ann);q.tap({x:300,y:250});await q.run('move');q.point({x:700,y:700});q.finish();same(q.state().st.ann,original);q.tap({x:300,y:250});await q.run('move');q.point({x:700,y:700});q.confirm();assert.notDeepEqual(plain(q.state().st.ann),original);click('#mUndo');same(q.state().st.ann,original);
    q.tap({x:300,y:250});await q.run('move');q.point({x:900,y:800});click('#mMenu');same(q.state().st.ann,original);q.finish();
  });
  await check('free drawing uses nearest line selection and cells remain selectable at high zoom',()=>{
    const s=q.toFree(plain(base));load(s);q.zoom(4);q.tap({x:0,y:400});assert.equal(q.state().fsel.k,'l');q.tap({x:300,y:400});assert.equal(q.state().fsel.k,'c');assert(d.querySelector('#mDepth').hidden);
  });
  await check('free line endpoint dragging edits once and pointer cancellation restores the original',()=>{
    load(q.toFree(plain(base)));q.tap({x:600,y:300});const before=q.state().st,sel=q.state().fsel;assert.equal(sel.k,'l');const line=before.ln[sel.i],el=d.querySelector('#ui [data-fe="0"]');assert(el);
    const a=q.pixel({x:line.x1,y:before.H-line.z1}),z=q.pixel({x:line.x1,y:before.H-line.z1-100}),event=(target,type,xy)=>{const ev=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(ev,{pointerId:17,clientX:xy.x,clientY:xy.y});target.dispatchEvent(ev)};
    event(el,'pointerdown',a);event(w,'pointermove',z);assert.notDeepEqual(plain(q.state().st.ln),plain(before.ln));event(w,'pointercancel',z);same(q.state().st.ln,before.ln);assert.equal(q.state().hist,0);
  });
  await check('single-finger pan and two-finger pinch change only the viewport and release all pointers',()=>{
    load();const original=q.state().st,svg=d.querySelector('#dw'),event=(type,id,x,y)=>{const ev=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(ev,{pointerId:id,clientX:x,clientY:y});svg.dispatchEvent(ev)};
    const start=q.state().zoom;event('pointerdown',1,100,300);event('pointermove',1,150,350);event('pointerup',1,150,350);assert.notEqual(q.state().zoom.cx,start.cx);
    const z=q.state().zoom.z;event('pointerdown',1,100,300);event('pointerdown',2,200,300);event('pointermove',2,300,300);event('pointerup',2,300,300);event('pointerup',1,100,300);assert(q.state().zoom.z>z);assert.equal(q.state().pointerCount,0);same(q.state().st.cols,original.cols);assert.equal(q.state().hist,0);
  });
  await check('copy/paste, divider deletion, locking and multi-cell merge keep valid geometry and undo records',async()=>{
    load();q.tap({x:200,y:500});await q.run('copy');q.tap({x:1400,y:300});await q.run('paste');assert.equal(q.state().st.cols[2].parts[0].t,'door');assert.equal(q.state().st.W,2400);click('#mUndo');assert.equal(q.state().st.cols[2].parts[0].t,'open');
    load();q.tap({x:600,y:400});await q.run('delete');assert.equal(q.state().st.cols.length,3);assert.equal(q.state().st.W,2400);click('#mUndo');same(q.state().st.cols,base.cols);
    load();q.tap({x:200,y:500});await q.run('lock');q.tap({x:200,y:500});assert.equal(q.selection().splitV,false);await q.run('settings');assert(!d.querySelector('#mCW'));click('#mSheetClose');q.tap({x:600,y:400});assert.equal(q.selection().movable,false);assert(!d.querySelector('#mActions [data-m="move"]'));
    load();q.tap({x:200,y:500});await q.run('multi');q.tap({x:800,y:500});assert.equal(q.selection().kind,'multi');assert(d.querySelector('#mActions [data-m="merge"]'));await q.run('merge');assert.equal(q.state().st.cols.length,3);assert.equal(q.state().st.W,2400);click('#mUndo');same(q.state().st.cols,base.cols);
    load();q.tap({x:200,y:500});await q.run('multi');q.tap({x:1400,y:300});assert(!d.querySelector('#mActions [data-m="merge"]'));
    load(base,'in');q.tap({x:200,y:500});await q.run('multi');q.tap({x:800,y:500});assert(!d.querySelector('#mActions [data-m="merge"]'));assert(!d.querySelector('#mActions [data-m="evenHeight"]'));
  });
  await check('pending annotation previews never replace the saved device draft before confirmation',async()=>{
    load();q.ann({k:'line',x1:150,y1:250,x2:450,y2:250,c:'#147c88',lw:8,v:'out'});q.save();const original=plain(q.state().st.ann);q.tap({x:300,y:250});await q.run('move');q.point({x:700,y:700});await pause(450);same(JSON.parse(b.memory.get('sc-mobile-proj')).sheets[0].ann,original);q.confirm();await pause(450);assert.notDeepEqual(JSON.parse(b.memory.get('sc-mobile-proj')).sheets[0].ann,original);
  });
  await check('duplicate pages, editable backup import, device draft and saved-file list preserve dimensions',async()=>{
    load();await q.run('pageDuplicate');assert.equal(q.state().pj.sheets.length,2);assert.notEqual(q.state().pj.sheets[0].sid,q.state().pj.sheets[1].sid);q.save();assert.equal(JSON.parse(b.memory.get('sc-mobile-proj')).sheets.length,2);
    await q.run('backup');const backup=await b.downloads.at(-1).text(),data=JSON.parse(backup);assert.equal(data.project.sheets.length,2);load();const input=d.querySelector('#mImport');input.files=[{text:async()=>backup}];input.dispatchEvent(new w.Event('change',{bubbles:true}));await pause(40);assert.equal(q.state().pj.sheets.length,2);await q.run('save');await pause(40);assert((await q.storeList()).some(x=>JSON.parse(x.json).sheets.length===2));
  });
  fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,process.env.AUDIT_SKIP_SWEEP?'../qa/audit-report-partial.json':'../qa/audit-report.json'),JSON.stringify(report,null,2));b.dispose();process.stdout.write(report.groups.length+' app audit groups passed; '+report.cellPicks+' successful cell selections.\n');
})().catch(e=>{console.error(e);process.exit(1)});
