'use strict';
const assert=require('node:assert/strict'),v=require('../voice-measure.js');let count=0;
const check=(name,fn)=>{fn();count++;process.stdout.write('PASS '+name+'\n');};
const start=()=>v.create({id:'test',start:{x:1800,y:2400},bounds:{width:2400,height:2400},lineType:'line',color:'#147c88'});
check('cardinal directions and fixed mm parse fullwidth, grouped and Chinese numerals exactly',()=>{
  for(const [text,direction,length] of [['往上1200','up',1200],['往左一千八百','left',1800],['向下１２００毫米','down',1200],['右1,200 mm','right',1200],['往上壹仟貳佰公釐','up',1200],['左一八零零','left',1800],['往右兩千零五十','right',2050],['往上一千二百點零五','up',1200.05],['上12.5','up',12.5],['往上十','up',10]]){
    const p=v.parse(text);assert(p.ok,text);assert.equal(p.direction,direction,text);assert.equal(p.length,length,text);
  }
});
check('missing, malformed, shorthand, negative and unknown-unit lengths cannot be guessed',()=>{
  for(const text of ['1200','往上','上零','左-100','下NaN','上Infinity','上1e3','上12.005','上十二三','上一千二','上一百五','上一千零','上一百零二十','上2公分','上2米','上3尺','上12001','上1200左1800','往斜上1200','上1200或1800','上1,20'])assert(!v.parse(text).ok,text);
});
check('all seven control commands and direction-plus-confirm parse deterministically',()=>{
  for(const [text,type] of [['確認','confirm'],['取消','cancel'],['復原上一段','undo'],['暫停','pause'],['繼續','resume'],['結束','end'],['往上1200，確認','sequence']])assert.equal(v.parse(text).type,type,text);
});
check('three segments join prior confirmed endpoints with SVG Y reversal and no automatic closure',()=>{
  let s=start();const expect=[{x:1800,y:1200},{x:0,y:1200},{x:0,y:2400}];
  ['往上1200','往左1800','往下1200'].forEach((text,i)=>{let r=v.transition(s,text);assert(!r.effect);assert.deepEqual(r.state.point,s.point);s=r.state;r=v.transition(s,'確認');assert.equal(r.effect.type,'add');s=r.state;assert.deepEqual(s.point,expect[i]);});
  assert.equal(s.segments.length,3);assert.equal(s.segments[1].from.x,1800);assert.equal(s.segments[1].from.y,1200);
});
check('interim corrections only preview and explicit final confirmation commits once',()=>{
  const s=start(),before=JSON.stringify(s);assert.equal(v.preview(s,'上100').segment.length,100);assert.equal(v.preview(s,'上1200確認').segment.length,1200);assert.equal(JSON.stringify(s),before);
  let r=v.transition(s,'上1200','run:0');r=v.transition(r.state,'上1200','run:0');assert(r.duplicate);
  r=v.transition(r.state,'確認','run:1');assert.equal(r.state.segments.length,1);r=v.transition(r.state,'確認','run:1');assert(r.duplicate);assert.equal(r.state.segments.length,1);
  // Identical lengths in new turns are legitimate, so dedup is by callback identity, not text.
  r=v.transition(r.state,'上1200','next:0');r=v.transition(r.state,'確認','next:1');assert.equal(r.state.segments.length,2);assert.equal(r.state.point.y,0);
});
check('cancel and undo restore exact point; identifiers are never reused after undo',()=>{
  let s=v.transition(start(),'上1200確認').state,id=s.segments[0].id;s=v.transition(s,'左500').state;s=v.transition(s,'取消').state;assert.equal(s.pending,null);assert.deepEqual(s.point,{x:1800,y:1200});
  s=v.transition(s,'復原上一段').state;assert.deepEqual(s.point,s.start);s=v.transition(s,'右100確認').state;assert.notEqual(s.segments[0].id,id);
});
check('pause blocks drawing and confirm; resume retains explicit draft; end never commits it',()=>{
  let s=v.transition(start(),'上1200').state;s=v.transition(s,'暫停').state;assert(v.transition(s,'確認').error);assert(v.transition(s,'右100').error);s=v.transition(s,'繼續').state;assert.equal(s.status,'pending');
  s=v.transition(s,'結束').state;assert.equal(s.segments.length,0);assert.equal(s.pending,null);assert.equal(s.status,'ended');assert(v.transition(s,'繼續').error);
});
check('out-of-bounds and invalid final commands invalidate old drafts without clipping or moving point',()=>{
  let s=v.transition(start(),'上100').state;let r=v.transition(s,'上2500');assert.equal(r.error,'bounds');assert.equal(r.state.pending,null);assert.deepEqual(r.state.point,s.start);assert(v.transition(r.state,'確認').error);
  s=v.transition(start(),'上100').state;r=v.transition(s,'亂七八糟');assert.equal(r.state.pending,null);assert(v.transition(r.state,'確認').error);
  for(const p of [{x:-1,y:0},{x:0,y:2401},{x:NaN,y:0}])assert.throws(()=>v.create({start:p,bounds:{width:2400,height:2400}}));
});
check('hundredth-mm arithmetic and all line types save dimensions as one annotation',()=>{
  for(const lineType of ['line','dashed','arrow','dim']){
    let s=v.create({...start().style,id:'decimal',start:{x:1.05,y:100},bounds:{width:2400,height:2400},lineType});s=v.transition(s,'右12.05確認').state;
    assert.deepEqual(s.point,{x:13.1,y:100});const a=v.annotation(s.segments[0],5);assert.equal(a.x2,13.1);assert.equal(a.measure.lineType,lineType);assert.equal(a.k,lineType==='arrow'?'arrow':lineType==='dim'?'dim':'line');
  }
});
check('saved dimension labels use actual geometry instead of stale metadata',()=>{
  const a=v.annotation(v.transition(start(),'上1200確認').effect.segment,5),P=v.primitives(a,5,[{t:'l'}]);assert.equal(P.at(-1).s,'1200 mm');a.y2-=50;assert.equal(v.primitives(a,5,[{t:'l'}]).at(-1).s,'1250 mm');
});
process.stdout.write(count+' voice core verification groups passed.\n');
