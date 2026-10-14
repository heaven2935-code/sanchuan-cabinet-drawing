'use strict';
const assert=require('node:assert/strict'),{Segmenter,wav,Capture}=require('../voice-audio.js'),{boot}=require('./dom-harness.cjs');
let count=0;const check=async(name,fn)=>{await fn();count++;console.log('PASS '+name);};
const frame=(level=0,n=480)=>new Float32Array(n).fill(level);
(async()=>{
await check('VAD ignores silence and clicks; preserves preroll; finishes one complete utterance',()=>{
  const s=new Segmenter(48000);for(let i=0;i<100;i++)assert.equal(s.feed(frame()),null);
  s.feed(frame(.2));for(let i=0;i<100;i++)assert.equal(s.feed(frame()),null);
  for(let i=0;i<100;i++)s.feed(frame());let result;for(let i=0;i<30;i++)assert.equal(s.feed(frame(.2)),null);for(let i=0;i<90;i++)result=s.feed(frame())||result;
  assert(result.frames.length>=140);assert.equal(s.frames.length,0);
});
await check('continuous loud noise is rejected rather than truncated into a plausible command',()=>{
  const s=new Segmenter(48000);let result;for(let i=0;i<801;i++)result=s.feed(frame(.3))||result;assert(result.error);assert(!result.frames);
});
await check('lossless mono PCM WAV preserves sample rate, duration, clipping and signed amplitude',async()=>{
  const b=Buffer.from(await wav([Float32Array.from([-2,-.5,0,.5,2])],48000).arrayBuffer());assert.equal(b.readUInt32LE(24),48000);assert.equal(b.readUInt32LE(40),10);assert.deepEqual([0,1,2,3,4].map(i=>b.readInt16LE(44+i*2)),[-32768,-16384,0,16384,32767]);
});
await check('same-utterance confirm becomes preview; separate confirmation needs completed readback',async()=>{
  const b=await boot();try{const q=b.qa;q.voice.begin({x:1800,y:0,lineType:'line',color:'#147c88'});
    let r=q.audio.reply('上1200確認',q.audio.context());assert.equal(q.state().st.ann.length,0);assert.equal(q.voice.state().session.pending.length,1200);
    q.audio.reply('確認',q.audio.context());assert.equal(q.state().st.ann.length,0);r.readBack();q.audio.reply('確認',q.audio.context());assert.equal(q.state().st.ann.length,1);
    r=q.audio.reply('左1800',q.audio.context());r.readBack();q.audio.reply('確認',q.audio.context());assert.equal(q.state().st.ann.length,2);
  }finally{b.dispose();}
});
await check('readback cannot arm replaced draft; stale transcripts and old confirmations cannot draw',async()=>{
  const b=await boot();try{const q=b.qa;q.voice.begin({x:1800,y:0});const old=q.audio.context(),r=q.audio.reply('上100',old);q.audio.reply('上200',q.audio.context());r.readBack();q.audio.reply('確認',q.audio.context());assert.equal(q.state().st.ann.length,0);q.audio.reply('上300確認',old);assert.equal(q.voice.state().session.pending.length,200);
    q.voice.receive('取消');q.audio.reply('確認',q.audio.context());assert.equal(q.state().st.ann.length,0);
  }finally{b.dispose();}
});
await check('audio pause accepts resume but never commits paused draft; cancel/undo/end preserve geometry',async()=>{
  const b=await boot();try{const q=b.qa;q.voice.begin({x:1800,y:0});let r=q.audio.reply('上100',q.audio.context());r.readBack();q.audio.reply('暫停',q.audio.context());q.audio.reply('確認',q.audio.context());assert.equal(q.state().st.ann.length,0);
    r=q.audio.reply('繼續',q.audio.context());r.readBack();q.audio.reply('確認',q.audio.context());assert.equal(q.state().st.ann.length,1);q.audio.reply('復原',q.audio.context());assert.equal(q.state().st.ann.length,0);q.audio.reply('上200',q.audio.context());q.audio.reply('取消',q.audio.context());assert.equal(q.voice.state().session.pending,null);q.audio.reply('結束',q.audio.context());assert.equal(q.voice.state().session.status,'ended');
  }finally{b.dispose();}
});
await check('ending capture during a response invalidates it; no automatic paid retry',async()=>{
  let release,calls=0,received=0;const response=new Promise(r=>release=r),env={AbortController,setTimeout,clearTimeout,fetch:()=>{calls++;return response;}};
  const c=new Capture({endpoint:'https://example.test',token:'x',context:()=>({}),transcript:()=>received++},env);c.active=true;c.ctx={sampleRate:48000,close:async()=>{}};const task=c.turn([frame(.2)]);c.stop();release({ok:true,json:async()=>({text:'上100確認'})});await task;assert.equal(received,0);assert.equal(calls,1);
});
await check('readback failure closes capture and never invokes the confirmation arming callback',async()=>{
  let armed=0,errors=0;const env={AbortController,setTimeout,clearTimeout,fetch:async()=>({ok:true,json:async()=>({text:'上100'})}),speechSynthesis:{getVoices:()=>[],speak:u=>u.onerror(),cancel(){}},SpeechSynthesisUtterance:class{}};
  const c=new Capture({endpoint:'https://example.test',token:'x',context:()=>({}),transcript:()=>({message:'上100',readBack:()=>armed++}),error:()=>errors++},env);c.active=true;c.ctx={sampleRate:48000,close:async()=>{}};await c.turn([frame(.2)]);assert.equal(armed,0);assert.equal(errors,1);assert.equal(c.active,false);
});
await check('pending microphone permission resolved after stop releases tracks without starting capture',async()=>{
  let release,stopped=0;const permission=new Promise(r=>release=r),env={isSecureContext:true,AudioWorkletNode:class{},speechSynthesis:{cancel(){}},AudioContext:class{resume(){return Promise.resolve()}close(){return Promise.resolve()}},navigator:{mediaDevices:{getUserMedia:()=>permission}}};
  const c=new Capture({},env);const task=c.start();await Promise.resolve();c.stop();release({getTracks:()=>[{stop:()=>stopped++}]});await task;assert.equal(stopped,1);assert.equal(c.active,false);
});
await check('busy/readback and settling audio never enters a new utterance',()=>{
  let frames=0;const c=new Capture({});c.segmenter={feed:()=>{frames++;return null;}};c.active=true;c.busy=true;c.frame(frame(.2));c.busy=false;c.settle=Date.now()+500;c.frame(frame(.2));assert.equal(frames,0);c.settle=0;c.frame(frame(.2));assert.equal(frames,1);
});
await check('external history and background changes close active audio and invalidate confirmation',async()=>{
  const b=await boot();try{const q=b.qa;q.voice.begin({x:1800,y:0});let stops=0;
    q.audio.state.capture={active:true,stop(){this.active=false;stops++;}};q.audio.state.binding=q.audio.context();
    Object.defineProperty(b.document,'hidden',{configurable:true,value:true});b.document.dispatchEvent(new b.window.Event('visibilitychange'));assert.equal(stops,1);assert.equal(q.audio.state.capture,null);assert.equal(q.voice.state().session.status,'paused');
  }finally{b.dispose();}
});
console.log(count+' audio verification groups passed (mocked audio; not hardware accuracy).');
})().catch(e=>{console.error(e);process.exitCode=1;});
