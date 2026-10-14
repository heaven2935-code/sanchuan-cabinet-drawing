/* Audio adapter: capture is separate from deterministic geometry and saved data. */
const voiceAudioUI={capture:null,handling:false,armed:null,binding:null};
const voiceAudioPanel=document.createElement('div');voiceAudioPanel.className='m-voice-audio';
voiceAudioPanel.innerHTML=`<details id="mVoiceConnection"><summary>語音試用設定（尚需連接服務）</summary><label class="m-field">語音服務網址<input id="mVoiceEndpoint" type="url" inputmode="url" placeholder="https://你的語音服務" autocomplete="off"></label><label class="m-field">本人試用通行碼<input id="mVoiceToken" type="password" autocomplete="off" placeholder="不是 OpenAI API 金鑰"></label><label class="m-field">收音靈敏度<select id="mVoiceSensitivity"><option value="0.012">高（小聲）</option><option value="0.02" selected>一般</option><option value="0.04">低（環境較吵）</option></select></label><p class="m-sheet-note">開始後會將每句錄音送至你設定的服務及 OpenAI 辨識，產生 API 費用。本工具後端不保存錄音；供應商處理依其政策。通行碼僅保留本頁記憶體。請先連耳機並確認音量，回讀走系統目前的聲音輸出。</p><label class="m-voice-consent"><input id="mVoiceConsent" type="checkbox">同意本次收音與雲端辨識</label></details><div class="m-voice-audio-actions"><button id="mVoiceMic" type="button">啟動語音（試用）</button><button id="mVoiceMicStop" type="button" disabled>關閉麥克風</button></div><p id="mVoiceAudioStatus" role="status" aria-live="polite">未連接語音服務；文字口令可用。</p>`;
voiceDock.appendChild(voiceAudioPanel);
voiceDock.querySelector('.m-voice-stage-note').textContent='文字口令可用 · 語音需設定服務，準確率待真機驗收';
voiceDock.setAttribute('aria-label','連續口令丈量');
const audioFingerprint=()=>JSON.stringify(voiceUI.session?.pending||null);
const audioContext=()=>({sessionId:voiceUI.session?.id,epoch:voiceUI.epoch,pending:audioFingerprint()});
function audioStatus(message){$('#mVoiceAudioStatus').textContent=message;$('#mVoiceMic').disabled=!!voiceAudioUI.capture?.active;$('#mVoiceMicStop').disabled=!voiceAudioUI.capture?.active;}
function audioStop(message){voiceAudioUI.capture?.stop();voiceAudioUI.capture=null;voiceAudioUI.armed=null;voiceAudioUI.binding=null;if(message)audioStatus(message);}
function audioReply(message){
  const context=audioContext();return{message,readBack(){
    if(mVoiceSame()&&context.sessionId===voiceUI.session.id&&context.epoch===voiceUI.epoch&&context.pending===audioFingerprint()&&voiceUI.session.pending&&voiceUI.session.status==='pending')voiceAudioUI.armed=context;
  }};
}
function audioTranscript(text,meta){
  if(!mVoiceSame()||document.hidden||meta.sessionId!==voiceUI.session.id||meta.epoch!==voiceUI.epoch||meta.pending!==audioFingerprint())return{message:'圖面已變更，請重說。'};
  const command=VoiceMeasure.parse(text),armed=voiceAudioUI.armed;
  // A same-utterance 確認 must NEVER skip the readback of a new number.
  if(command.type==='sequence')text=command.commands[0].text;
  if(command.type==='confirm'&&(!armed||armed.sessionId!==meta.sessionId||armed.epoch!==meta.epoch||armed.pending!==meta.pending))return audioReply('請先聽完目前方向及尺寸，再說確認。'+(voiceUI.session.pending?'往'+VoiceMeasure.names[voiceUI.session.pending.direction]+VoiceMeasure.fmt(voiceUI.session.pending.length)+'公釐。':''));
  voiceAudioUI.armed=null;voiceAudioUI.handling=true;
  let result;try{result=mVoiceReceive(text,{...meta,eventId:'audio:'+ ++voiceUI.count});}finally{voiceAudioUI.handling=false;}
  if(!mVoiceLive()){audioStop('丈量已結束，麥克風已關閉。');return{message:'丈量已結束。'};}
  voiceAudioUI.binding=audioContext();
  let message=result?.message||voiceUI.message||'請重說口令。';
  if(command.type==='resume'&&voiceUI.session.pending){const p=voiceUI.session.pending;message+='往'+VoiceMeasure.names[p.direction]+VoiceMeasure.fmt(p.length)+'公釐，請說確認或取消。';}
  return audioReply(message);
}
$('#mVoiceMic').onclick=async()=>{
  if(!mVoiceSame()){toast('請先設定丈量起點。');return;}
  const raw=$('#mVoiceEndpoint').value.trim().replace(/\/+$/,''),token=$('#mVoiceToken').value.trim();
  let endpoint;try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Error();endpoint=u.href.replace(/\/+$/,'');}catch(_){audioStatus('請設定有效的 HTTPS 語音服務網址。');$('#mVoiceConnection').open=true;return;}
  if(token.length<32||/^sk-/.test(token)){audioStatus('請輸入後端的本人試用通行碼，不能輸入 OpenAI API 金鑰。');$('#mVoiceConnection').open=true;return;}
  if(!$('#mVoiceConsent').checked){audioStatus('請先閱讀並同意本次收音與雲端辨識。');$('#mVoiceConnection').open=true;return;}
  audioStop();voiceAudioUI.handling=true;
  try{mVoiceReceive('取消');mVoiceReceive('繼續');}finally{voiceAudioUI.handling=false;}
  voiceAudioUI.binding=audioContext();
  const capture=new VoiceAudio.Capture({endpoint,token,threshold:Number($('#mVoiceSensitivity').value),context:audioContext,transcript:audioTranscript,status:audioStatus,error:message=>{voiceAudioUI.armed=null;mVoiceSuspend(message);mSync();}});
  voiceAudioUI.capture=capture;$('#mVoiceConnection').open=false;await capture.start();audioStatus($('#mVoiceAudioStatus').textContent);
};
$('#mVoiceMicStop').onclick=()=>{audioStop('麥克風已關閉。已確認的終點保留。');mVoiceSuspend('收音已關閉，丈量暫停。');mSync();};
const audioOldReceive=mVoiceReceive;mVoiceReceive=function(text,meta={}){
  if(voiceAudioUI.capture?.active&&!voiceAudioUI.handling)audioStop('已改用文字／按鍵操作，麥克風關閉。');
  return audioOldReceive(text,meta);
};
const audioOldSync=mVoiceSync;mVoiceSync=function(){
  audioOldSync();voiceAudioPanel.hidden=!mVoiceLive()||voiceUI.picking;
  const b=voiceAudioUI.binding;
  if(voiceAudioUI.capture?.active&&!voiceAudioUI.handling&&(!mVoiceSame()||document.hidden||b?.epoch!==voiceUI.epoch||b?.sessionId!==voiceUI.session?.id||b?.pending!==audioFingerprint()))audioStop('圖面或頁面已變更，收音停止。終點保留，請重新啟動。');
};
window.addEventListener('pagehide',()=>audioStop('頁面離開，收音已停止。'));
