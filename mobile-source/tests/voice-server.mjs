import assert from 'node:assert/strict';
import {createVoiceServer} from '../voice-server/server.mjs';
import Audio from '../voice-audio.js';
const origin='https://heaven2935-code.github.io',token='test-owner-access-token-with-32-characters';let calls=0,count=0;
const server=createVoiceServer({key:'test-secret-not-real',token,origin,limit:2},async(url,init)=>{
  calls++;assert.equal(url,'https://api.openai.com/v1/audio/transcriptions');assert.equal(init.headers.Authorization,'Bearer test-secret-not-real');assert.equal(init.body.get('model'),'gpt-transcribe');assert.equal(init.body.get('languages[]'),'zh');assert(!init.body.has('language'));return{ok:true,json:async()=>({text:'往上1200'})};
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const body=Audio.wav([new Float32Array(48000).fill(.1)],48000);
const post=(extra={})=>fetch(base+'/transcribe',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'audio/wav',...extra},body});
const check=async(name,fn)=>{await fn();count++;console.log('PASS '+name);};
try{
await check('health and CORS preflight do not contact paid provider',async()=>{assert.equal((await fetch(base+'/health')).status,200);assert.equal((await fetch(base+'/transcribe',{method:'OPTIONS',headers:{Origin:origin}})).status,204);assert.equal(calls,0);});
await check('wrong origin and missing owner token reject before transcription',async()=>{assert.equal((await post({Origin:'https://evil.example'})).status,403);assert.equal((await post({Authorization:''})).status,401);assert.equal(calls,0);});
await check('wrong content type and malformed WAV cannot spend quota',async()=>{assert.equal((await post({'Content-Type':'audio/mp4'})).status,415);const r=await fetch(base+'/transcribe',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'audio/wav'},body:'bad wav'});assert.equal(r.status,400);assert.equal(calls,0);});
await check('authenticated valid audio uses fixed provider and never returns key',async()=>{const r=await post();assert.equal(r.status,200);assert.deepEqual(await r.json(),{text:'往上1200'});assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(calls,1);});
await check('hourly attempt cap stops additional paid requests',async()=>{assert.equal((await post()).status,200);assert.equal((await post()).status,429);assert.equal(calls,2);});
console.log(count+' backend verification groups passed (mock provider; no API expense).');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
