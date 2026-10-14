/* Foreground utterance capture. No recognition credentials or drawing state here. */
const VoiceAudio=(()=>{
  'use strict';
  class Segmenter{
    constructor(rate,threshold=.02){this.rate=rate;this.threshold=threshold;this.reset();}
    reset(){this.pre=[];this.frames=[];this.total=0;this.speech=0;this.quiet=0;}
    feed(frame){
      const a=new Float32Array(frame),ms=a.length/this.rate*1000;
      const rms=Math.sqrt(a.reduce((s,n)=>s+n*n,0)/a.length),loud=rms>=this.threshold;
      if(!this.frames.length){
        this.pre.push(a);while(this.pre.length>1&&this.pre.reduce((n,f)=>n+f.length,0)>this.rate*.25)this.pre.shift();
        if(!loud)return null;this.frames=this.pre;this.pre=[];this.total=this.frames.reduce((n,f)=>n+f.length,0)/this.rate*1000;
      }else{this.frames.push(a);this.total+=ms;}
      this.speech+=loud?ms:0;this.quiet=loud?0:this.quiet+ms;
      if(this.total>8000){this.reset();return{error:'收音超過八秒，可能環境太吵。請降低靈敏度或移近麥克風後重試。'};}
      if(this.quiet<900)return null;
      const frames=this.frames,valid=this.speech>=180;this.reset();return valid?{frames}:null;
    }
  }
  function wav(frames,rate){
    // Preserve native sample rate; no lossy codec or naive downsampling of numbers.
    const n=frames.reduce((s,f)=>s+f.length,0),b=new ArrayBuffer(44+n*2),v=new DataView(b);
    const str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
    str(0,'RIFF');v.setUint32(4,36+n*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*2,true);
    let o=44;for(const f of frames)for(const x of f){const s=Math.max(-1,Math.min(1,x));v.setInt16(o,Math.round(s*(s<0?32768:32767)),true);o+=2;}
    return new Blob([b],{type:'audio/wav'});
  }
  const processor=`class MeasureCapture extends AudioWorkletProcessor{constructor(){super();this.a=new Float32Array(2048);this.n=0;}process(inputs){const a=inputs[0]?.[0];if(a)for(const x of a){this.a[this.n++]=x;if(this.n===2048){this.port.postMessage(this.a,[this.a.buffer]);this.a=new Float32Array(2048);this.n=0;}}return true;}}registerProcessor('measure-capture',MeasureCapture);`;
  class Capture{
    constructor(options,env=globalThis){this.o=options;this.e=env;this.active=false;this.generation=0;}
    state(s){this.o.status?.(s);}
    async start(){
      this.stop();const e=this.e,g=++this.generation;this.active=true;this.busy=true;this.state('正在啟動麥克風…');
      try{
        if(!e.isSecureContext||!e.navigator?.mediaDevices?.getUserMedia||!e.AudioWorkletNode||!e.speechSynthesis)throw Error('此瀏覽器不支援安全收音或回讀，請使用支援的 HTTPS 瀏覽器。');
        const AC=e.AudioContext||e.webkitAudioContext;this.ctx=new AC();await this.ctx.resume();
        if(!this.active||g!==this.generation)return;
        const stream=await e.navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:false},video:false});
        if(!this.active||g!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
        this.stream=stream;const ctx=this.ctx;
        for(const track of stream.getAudioTracks()){track.onended=()=>this.fail('麥克風已中斷，請重新啟動收音。');track.onmute=()=>this.fail('收音被系統暫停，請返回頁面後重新啟動。');}
        ctx.onstatechange=()=>{if(this.active&&ctx.state!=='running')this.fail('音訊被系統中斷，已保留終點。請重新啟動收音。');};
        const url=e.URL.createObjectURL(new e.Blob([processor],{type:'text/javascript'}));
        try{await ctx.audioWorklet.addModule(url);}finally{e.URL.revokeObjectURL(url);}
        if(!this.active||g!==this.generation)return;
        this.segmenter=new Segmenter(ctx.sampleRate,this.o.threshold);
        this.node=new e.AudioWorkletNode(ctx,'measure-capture');this.source=ctx.createMediaStreamSource(stream);this.mute=ctx.createGain();this.mute.gain.value=0;
        this.source.connect(this.node);this.node.connect(this.mute);this.mute.connect(ctx.destination);
        this.node.port.onmessage=event=>this.frame(event.data);
        await this.say('語音丈量已啟動。請說方向及公釐數值。');
        if(!this.active||g!==this.generation)return;
        this.busy=false;this.state('聆聽中 · 請說方向與長度');
      }catch(err){if(g===this.generation)this.fail(err.name==='NotAllowedError'?'未取得麥克風權限。請在瀏覽器設定允許後再試。':err.message);}
    }
    frame(data){
      if(!this.active||this.busy||Date.now()<this.settle)return;
      const r=this.segmenter.feed(data);if(r?.error){this.fail(r.error);return;}if(r?.frames)this.turn(r.frames);
    }
    async turn(frames){
      if(!this.active||this.busy)return;this.busy=true;const g=this.generation,meta=this.o.context();this.state('辨識中 · 請稍候');
      try{
        this.abort=new this.e.AbortController();const controller=this.abort,timer=this.e.setTimeout(()=>controller.abort(),20000);
        let result;try{
          const response=await this.e.fetch(this.o.endpoint+'/transcribe',{method:'POST',headers:{'Content-Type':'audio/wav',Authorization:'Bearer '+this.o.token},body:wav(frames,this.ctx.sampleRate),signal:controller.signal,credentials:'omit',redirect:'error'});
          if(!this.active||g!==this.generation)return;
          if(!response.ok)throw Error(({401:'試用通行碼無效。',429:'已達本次服務額度，請稍後再試。',503:'語音服務尚未設定完成。'})[response.status]||'辨識服務連線失敗，請重試。');
          result=await response.json();
        }finally{this.e.clearTimeout(timer);}
        if(!this.active||g!==this.generation)return;
        if(typeof result.text!=='string'||result.text.length>200)throw Error('辨識結果無效，請重說。');
        const reply=this.o.transcript(result.text,meta);
        if(!this.active||g!==this.generation)return;
        await this.say(reply?.message||'沒有聽清楚，請重說。');
        if(!this.active||g!==this.generation)return;
        reply?.readBack?.();this.segmenter.reset();this.busy=false;this.state('聆聽中 · 請等回讀完再說話');
      }catch(err){if(this.active&&g===this.generation)this.fail(err.name==='AbortError'?'辨識連線逾時，已保留終點。請重新收音並重說。':err.message);}
    }
    say(text){
      const e=this.e;this.state('回讀中 · 暫不接收口令');
      return new Promise((resolve,reject)=>{
        const u=new e.SpeechSynthesisUtterance(text);u.lang='zh-TW';u.rate=.92;
        const voice=e.speechSynthesis.getVoices().find(v=>/^zh[-_]TW$/i.test(v.lang));if(voice)u.voice=voice;
        let settled=false;const done=err=>{if(settled)return;settled=true;u.onend=u.onerror=null;e.clearTimeout(timer);this.cancelSpeech=null;err?reject(err):resolve();};
        const timer=e.setTimeout(()=>{e.speechSynthesis.cancel();done(Error('回讀未完成，請檢查聲音輸出後重新啟動。'));},20000);
        this.cancelSpeech=()=>done(Error('收音已停止'));u.onend=()=>{this.settle=Date.now()+450;done();};u.onerror=()=>done(Error('回讀失敗，未開放語音確認。請檢查音量或耳機。'));
        e.speechSynthesis.speak(u);
      });
    }
    fail(message){this.stop();this.state(message);this.o.error?.(message);}
    stop(){
      this.active=false;this.busy=false;this.generation++;this.abort?.abort();this.abort=null;
      this.cancelSpeech?.();this.e.speechSynthesis?.cancel();
      if(this.node){this.node.port.onmessage=null;this.node.disconnect();this.node=null;}
      this.source?.disconnect();this.mute?.disconnect();
      this.stream?.getTracks().forEach(t=>{t.onended=t.onmute=null;t.stop();});this.stream=null;
      if(this.ctx){this.ctx.onstatechange=null;this.ctx.close().catch(()=>{});this.ctx=null;}
      this.segmenter?.reset();
    }
  }
  return{Segmenter,wav,Capture};
})();
if(typeof module!=='undefined')module.exports=VoiceAudio;
