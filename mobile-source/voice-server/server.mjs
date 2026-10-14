import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Single-owner pilot. No audio/transcript logs, files, public keys or arbitrary upstream URLs.
export function createVoiceServer(config={},upstream=fetch){
  const key=config.key||'',token=config.token||'',origin=config.origin||'https://heaven2935-code.github.io';
  const requested=Number(config.limit||120),limit=Number.isInteger(requested)&&requested>0?Math.min(requested,120):120,windowMs=3600000;let used=0,windowStart=Date.now(),busy=false;
  const authorized=value=>{const a=Buffer.from(value||''),b=Buffer.from('Bearer '+token);return token.length>=32&&a.length===b.length&&timingSafeEqual(a,b);};
  return http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
    const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
    if(req.method==='GET'&&req.url==='/health'){send(200,{ready:!!key&&token.length>=32});return;}
    if(req.headers.origin!==origin){send(403,{error:'origin'});return;}
    res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
    if(req.url!=='/transcribe'||req.method!=='POST'){send(404,{error:'not_found'});return;}
    if(!authorized(req.headers.authorization)){send(401,{error:'unauthorized'});return;}
    if(!key){send(503,{error:'not_configured'});return;}
    if(Date.now()-windowStart>=windowMs){windowStart=Date.now();used=0;}
    if(busy||used>=limit){send(429,{error:'quota'});return;}
    if(req.headers['content-type']!=='audio/wav'){send(415,{error:'wav_required'});return;}
    busy=true;const controller=new AbortController(),timeout=setTimeout(()=>{controller.abort();if(!req.complete)req.destroy();},18000);
    const disconnected=()=>{if(!res.writableEnded)controller.abort();};res.on('close',disconnected);
    try{
      const chunks=[];let size=0;const max=44+96000*2*8;
      for await(const chunk of req){size+=chunk.length;if(size>max){send(413,{error:'too_large'});return;}chunks.push(chunk);}
      const audio=Buffer.concat(chunks);
      if(!validWav(audio)){send(400,{error:'invalid_audio'});return;}
      used++; // Count attempts, including failures; never auto-retry billable audio.
      const body=new FormData();body.append('file',new Blob([audio],{type:'audio/wav'}),'command.wav');body.append('model','gpt-transcribe');body.append('languages[]','zh');
      body.append('prompt','台灣中文現場丈量口令。逐字轉錄實際聲音，不補充沒有說出的方向、數字或單位。');
      const response=await upstream('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+key},body,signal:controller.signal});
      if(!response.ok){send(502,{error:'transcription_failed'});return;}
      const result=await response.json();if(typeof result.text!=='string'||result.text.length>200){send(502,{error:'invalid_transcript'});return;}
      send(200,{text:result.text});
    }catch(_){if(!res.destroyed&&!res.writableEnded)send(502,{error:'transcription_unavailable'});}
    finally{clearTimeout(timeout);res.off('close',disconnected);busy=false;}
  });
}
export function validWav(b){
  if(b.length<44||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE'||b.toString('ascii',12,16)!=='fmt '||b.toString('ascii',36,40)!=='data')return false;
  const rate=b.readUInt32LE(24),size=b.readUInt32LE(40);
  return b.readUInt32LE(4)===b.length-8&&b.readUInt32LE(16)===16&&b.readUInt16LE(20)===1&&b.readUInt16LE(22)===1&&b.readUInt16LE(32)===2&&b.readUInt16LE(34)===16&&rate>=8000&&rate<=96000&&b.readUInt32LE(28)===rate*2&&size===b.length-44&&size%2===0&&size>=rate*.18*2&&size<=rate*8*2;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const server=createVoiceServer({key:process.env.OPENAI_API_KEY,token:process.env.VOICE_OWNER_TOKEN,origin:process.env.VOICE_ALLOWED_ORIGIN,limit:process.env.VOICE_HOURLY_LIMIT});
  server.requestTimeout=20000;server.headersTimeout=10000;server.listen(Number(process.env.PORT||8787),'0.0.0.0');
}
