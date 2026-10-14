/* Stage A: text-verifiable commands. Audio providers must be evaluated/approved separately. */
const voiceUI={session:null,project:null,sid:'',setup:null,picking:false,interim:null,message:'',count:0,epoch:0,internal:false};
M_ICONS.mic='M9 4a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V4zM5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8';
const voiceDock=document.createElement('section');voiceDock.id='mVoiceDock';voiceDock.hidden=true;
voiceDock.setAttribute('aria-label','連續口令丈量，文字驗算');
voiceDock.innerHTML=`<div class="m-voice-heading"><strong id="mVoiceStatus" role="status" aria-live="polite"></strong><button id="mVoiceEnd" type="button">結束</button></div><div id="mVoicePoint"></div><p id="mVoiceMessage" role="status" aria-live="polite"></p><form id="mVoiceCommandForm"><label class="m-voice-input"><span class="m-sr-only">輸入口令，固定公釐 mm</span><input id="mVoiceCommand" type="text" autocomplete="off" maxlength="100" placeholder="往上1200 → 確認"></label><button type="submit" class="m-confirm">送出</button></form><div class="m-voice-controls"><button data-voice="確認" type="button">確認</button><button data-voice="取消" type="button">取消</button><button data-voice="復原上一段" type="button">復原</button><button id="mVoicePause" type="button">暫停</button></div><p class="m-voice-stage-note">文字驗算階段 · 尚未接上收音與耳機回讀</p>`;
mShell.appendChild(voiceDock);

const mVoiceLive=()=>!!voiceUI.session&&voiceUI.session.status!=='ended';
const mVoiceSame=()=>mVoiceLive()&&pj===voiceUI.project&&st.sid===voiceUI.sid&&aview()===voiceUI.session.style.view;
function mVoiceSuspend(message){
  if(!mVoiceLive())return;
  voiceUI.session={...voiceUI.session,status:'paused',pending:null};voiceUI.interim=null;voiceUI.epoch++;
  voiceUI.message=message||'丈量已暫停，返回原分頁後按繼續。';
}
function mVoiceReconcile(){
  if(!mVoiceLive())return;
  if(!mVoiceSame()){
    if(voiceUI.session.status!=='paused'||voiceUI.session.pending)mVoiceSuspend('圖面或視圖已切換。請返回原圖面再繼續；切換檔案需重新設定起點。');
    mobileUI.voiceActive=false;return;
  }
  const s=voiceUI.session,actual=st.ann.filter(a=>typeof a.measure?.id==='string'&&a.measure.id.startsWith(s.id+':')&&['line','arrow','dim'].includes(a.k)&&[a.x1,a.y1,a.x2,a.y2].every(Number.isFinite)).map(a=>({id:a.measure.id,from:{x:a.x1,y:a.y1},to:{x:a.x2,y:a.y2},length:Math.hypot(a.x2-a.x1,a.y2-a.y1),direction:a.x2>a.x1?'right':a.x2<a.x1?'left':a.y2>a.y1?'down':'up',...s.style}));
  const changed=JSON.stringify(actual.map(a=>[a.id,a.from,a.to]))!==JSON.stringify(s.segments.map(a=>[a.id,a.from,a.to]));
  const boundsChanged=s.bounds.width!==st.W||s.bounds.height!==st.H;
  if(changed||boundsChanged){
    const point=actual.length?{...actual.at(-1).to}:{...s.start};
    voiceUI.session={...s,segments:actual,point,pending:null,bounds:{width:st.W,height:st.H},status:boundsChanged?'paused':s.status==='paused'?'paused':'ready'};
    voiceUI.interim=null;voiceUI.epoch++;
    voiceUI.message=boundsChanged?'圖面尺寸已變更，請核對終點後繼續。':'已同步圖面復原／重做後的終點。';
  }
  mobileUI.voiceActive=true;
}
function mVoiceOpenSetup(useSetup=false){
  if(mVoiceLive()){toast('請先結束目前丈量，再重新設定起點與線型。');return;}
  voiceUI.internal=true;mFinish();voiceUI.internal=false;
  const last=mobileUI.lastPoint,seed=last&&last.x>=0&&last.y>=0&&last.x<=st.W&&last.y<=st.H?last:{x:st.W/2,y:st.H/2};
  const a=useSetup&&voiceUI.setup?voiceUI.setup:{x:VoiceMeasure.fmt(seed.x),y:VoiceMeasure.fmt(st.H-seed.y),lineType:'line',color:mobileUI.color};
  voiceUI.setup=a;voiceUI.picking=false;
  const field=(id,label,value,max)=>`<label class="m-field">${label}<input id="${id}" type="number" inputmode="decimal" min="0" max="${max}" step="0.01" required value="${esc(String(value))}"></label>`;
  mOpenSheet('連續丈量 · 文字口令驗算',`<form id="mVoiceSetupForm"><div class="m-form-grid">${field('mVoiceX','起點 X · 距左 mm',a.x,st.W)}${field('mVoiceY','起點 Y · 離底 mm',a.y,st.H)}</div><button type="button" id="mVoicePick" class="m-row-action">${mIcon('mark')}<span>在圖面點選起點</span></button><label class="m-field">線型<select id="mVoiceLine">${[['line','直線＋尺寸'],['dashed','虛線＋尺寸'],['arrow','箭頭＋尺寸'],['dim','量尺＋尺寸']].map(([v,t])=>`<option value="${v}"${a.lineType===v?' selected':''}>${t}</option>`).join('')}</select></label><label class="m-field">線條顏色<input id="mVoiceColor" type="color" value="${esc(a.color)}"></label><p class="m-sheet-note">本次單位固定 mm。原點在圖面左下角：X 向右、Y 向上。起點與線段必須在目前 ${st.W} × ${st.H} mm 範圍內，不自動擴圖或截短。</p><p class="m-sheet-note">這一階段使用文字驗算，尚未收音。輸入「往上1200」→「確認」，再繼續下一段；也可輸入完整「往上1200確認」。支援取消、復原、暫停、繼續與結束。</p><div class="m-form-actions"><button type="button" data-m="cancelForm">取消</button><button type="button" id="mVoiceBegin" class="m-confirm">開始文字丈量</button></div></form>`,'voiceSetup');
  const read=()=>({x:$('#mVoiceX').value,y:$('#mVoiceY').value,lineType:$('#mVoiceLine').value,color:$('#mVoiceColor').value});
  $('#mVoicePick').onclick=()=>{voiceUI.setup=read();mCloseSheet(false);voiceUI.picking=true;voiceUI.message='點圖面設定起點；可拖圖或雙指縮放。';mSync();};
  $('#mVoiceBegin').onclick=()=>mVoiceBegin(read());
  mobileUI.submit=()=>mVoiceBegin(read());
}
function mVoiceBegin(options){
  if(mVoiceLive()){toast('請先結束目前丈量。');return false;}
  const valid=s=>/^\d+(?:\.\d{1,2})?$/.test(String(s).trim());
  if(!valid(options.x)||!valid(options.y)){toast('起點請輸入非負 mm 數值，小數最多兩位。');return false;}
  const x=Number(options.x),y=Number(options.y);
  let session;try{session=VoiceMeasure.create({id:newSid(),start:{x,y:Math.round((st.H-y)*100)/100},bounds:{width:st.W,height:st.H},lineType:options.lineType,color:options.color,width:mobileUI.width,view:aview()});}catch(e){toast(e.message);return false;}
  mCloseSheet(false);voiceUI.internal=true;mFinish();voiceUI.internal=false;pjSync();
  Object.assign(voiceUI,{session,project:pj,sid:st.sid,picking:false,interim:null,message:'輸入方向＋長度，預覽核對後輸入確認。',count:0,epoch:voiceUI.epoch+1});
  mobileUI.hint=false;mobileUI.voiceActive=true;mode='mark';tool=null;render();return true;
}
function mVoiceCanUndo(){
  const s=voiceUI.session,last=s?.segments.at(-1);if(!last||!hist.length)return false;
  try{
    const h=JSON.parse(hist.at(-1));if(h.k!=='s'||h.sid!==st.sid)return false;
    const now=JSON.parse(JSON.stringify(st)),i=now.ann.findIndex(a=>a.measure?.id===last.id);if(i<0)return false;
    now.ann.splice(i,1);now.grid=h.s.grid;now.labels=h.s.labels;
    return JSON.stringify(now)===JSON.stringify(h.s);
  }catch(_){return false;}
}
function mVoiceReceive(text,meta={}){
  if(!mVoiceLive())return{error:'inactive'};
  if(meta.sessionId&&meta.sessionId!==voiceUI.session.id||meta.epoch!=null&&meta.epoch!==voiceUI.epoch)return{duplicate:true};
  mVoiceReconcile();
  if(!mVoiceSame()||document.hidden){mVoiceSuspend('目前不是丈量中的圖面，請返回原分頁後按繼續。');mSync();return{error:'context'};}
  const command=VoiceMeasure.parse(text),s=voiceUI.session;
  if(meta.final===false){const d=VoiceMeasure.preview(s,text);voiceUI.interim=d.ok?d.segment:null;mVoiceDraw();return d;}
  const eventId=meta.eventId||'text:'+ ++voiceUI.count;
  if(s.seen.includes(eventId))return{duplicate:true};
  if(command.ok&&command.type==='undo'&&s.segments.length&&!mVoiceCanUndo()){
    voiceUI.message='上一段之後還有其他編輯，或已超過40筆復原範圍。請先復原後續編輯，不會刪除其他內容。';voiceUI.interim=null;mSync();return{error:'history'};
  }
  const adds=command.type==='confirm'&&s.pending||command.type==='sequence';
  if(adds&&st.ann.length>=200){
    voiceUI.session={...s,pending:null,status:'ready'};voiceUI.interim=null;voiceUI.message='此分頁已達200筆標註上限，沒有加入線段。請結束丈量後另開分頁。';mSync();return{error:'capacity'};
  }
  if(command.type==='resume'){
    const p=s.point;if(p.x<0||p.y<0||p.x>st.W||p.y>st.H){voiceUI.message='目前終點不在圖面範圍內，請結束後重新設定起點。';mSync();return{error:'bounds'};}
  }
  const result=VoiceMeasure.transition(s,command,eventId);if(result.duplicate)return result;
  voiceUI.session=result.state;voiceUI.interim=null;voiceUI.message=result.message;
  if(result.effect?.type==='add'){
    push();st.ann.push(VoiceMeasure.annotation(result.effect.segment,S));saveNow();
  }else if(result.effect?.type==='undo'){
    voiceUI.internal=true;$('#undo').click();voiceUI.internal=false;saveNow();
  }
  if(result.state.status==='ended'){mobileUI.voiceActive=false;voiceUI.epoch++;}
  render();return result;
}
function mVoiceSync(){
  const live=mVoiceLive(),picking=voiceUI.picking,s=voiceUI.session;
  mShell.classList.toggle('has-voice',live||picking);voiceDock.hidden=!live&&!picking;
  if(!live&&!picking)return;
  $('#mVoiceStatus').textContent=picking?'點選丈量起點':'文字丈量 · '+({ready:'待命',pending:'待確認',paused:'暫停'}[s.status]||'');
  $('#mVoicePoint').textContent=live?'已確認 '+s.segments.length+' 段 · 目前終點 X '+VoiceMeasure.fmt(s.point.x)+'／Y '+VoiceMeasure.fmt(s.bounds.height-s.point.y)+' mm':'';
  $('#mVoiceMessage').textContent=voiceUI.message;
  $('#mVoiceCommandForm').hidden=$('.m-voice-controls').hidden=picking;
  $('#mVoiceEnd').textContent=picking?'取消':'結束';
  $('#mVoicePause').textContent=s?.status==='paused'?'繼續':'暫停';
  for(const e of voiceDock.querySelectorAll('[data-voice]'))e.disabled=!mVoiceSame()||e.dataset.voice==='確認'&&(!s?.pending||s.status==='paused')||e.dataset.voice==='復原上一段'&&!s?.segments.length;
  $('#mVoicePause').disabled=live&&!mVoiceSame();
  if(picking||s?.status==='ended')mobileUI.voiceActive=false;
}
function mVoiceDraw(){
  let g=svg.querySelector('#voice-preview');if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='voice-preview';g.setAttribute('pointer-events','none');svg.appendChild(g);}
  g.innerHTML='';if(!mVoiceSame())return;
  const s=voiceUI.session,k=S/zoom.z,d=voiceUI.interim||s.pending,P=[];
  if(d)P.push(...annPrims([{a:VoiceMeasure.annotation(d,k),i:-1}],k));
  const p=s.point,c=displaySettings.selectionColor;
  P.push({t:'l',x1:p.x-8*k,y1:p.y,x2:p.x+8*k,y2:p.y,c:'an',col:c,lw:k},{t:'l',x1:p.x,y1:p.y-8*k,x2:p.x,y2:p.y+8*k,c:'an',col:c,lw:k});
  g.innerHTML=toSVG(P,k,pal).art;
}
const voiceOldSync=mSync;mSync=function(){mVoiceReconcile();voiceOldSync();mVoiceSync();};
const voiceOldPreview=mPreview;mPreview=function(){voiceOldPreview();mVoiceDraw();};
const voiceOldOpen=mOpenSheet;mOpenSheet=function(title,html,kind){if(mVoiceLive()&&kind!=='voiceSetup')mVoiceSuspend('已開啟其他功能。返回圖面後按繼續丈量。');return voiceOldOpen(title,html,kind);};
const voiceOldFinish=mFinish;mFinish=function(){if(!voiceUI.internal)mVoiceSuspend('丈量已暫停，請核對終點後按繼續。');return voiceOldFinish();};
const voiceOldRun=mRun;mRun=async function(id){if(id==='voice'){mVoiceOpenSetup();return;}return voiceOldRun(id);};
const voiceOldTap=mTap;mTap=function(q,el){
  if(voiceUI.picking){if(q.x<0||q.y<0||q.x>st.W||q.y>st.H){toast('請點選目前圖面範圍內的起點。');return;}
    voiceUI.setup.x=VoiceMeasure.fmt(q.x);voiceUI.setup.y=VoiceMeasure.fmt(st.H-q.y);mVoiceOpenSetup(true);return;}
  if(mVoiceSame())return;return voiceOldTap(q,el);
};
const voiceOldFit=$('#mFit').onclick;$('#mFit').onclick=()=>{if(mVoiceSame()){zoom.m=false;render();}else voiceOldFit();};
$('#mVoiceCommandForm').addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();const input=$('#mVoiceCommand'),text=input.value;if(!text.trim())return;input.value='';mVoiceReceive(text);});
$('#mVoiceCommand').addEventListener('input',e=>mVoiceReceive(e.target.value,{final:false}));
voiceDock.addEventListener('click',e=>{const b=e.target.closest('[data-voice]');if(b&&!b.disabled)mVoiceReceive(b.dataset.voice);});
$('#mVoicePause').onclick=()=>mVoiceReceive(voiceUI.session?.status==='paused'?'繼續':'暫停');
$('#mVoiceEnd').onclick=()=>{if(voiceUI.picking){voiceUI.picking=false;mSync();}else{voiceUI.session=VoiceMeasure.transition(voiceUI.session,'結束').state;voiceUI.interim=null;mobileUI.voiceActive=false;voiceUI.epoch++;render();toast('丈量已結束，已確認線段保留。');}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){mVoiceSuspend('頁面進入背景，丈量已暫停。返回後按繼續。');mSync();}});
window.addEventListener('pagehide',()=>mVoiceSuspend('頁面已離開，丈量已暫停。'));
