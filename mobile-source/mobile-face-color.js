/* Context-only finish editor. Preview is separate from the saved cabinet model. */
function mFaceKey(){const key=mobileUI.face;if(!key||isFree()||view!=='out')return null;return FaceColor.panels(st).find(f=>FaceColor.same(f,key))||null;}
function mSelectFace(q,t){if(t.t!=='c'||view!=='out'||multi||isFree())return;const f=FaceColor.pick(st,q);if(f&&f.c===t.key.c&&f.p===t.key.p){mobileUI.face={c:f.c,p:f.p,i:f.i};t.k=null;}}
function mFaceTitle(f){return'第 '+(f.c+1)+' 區 · '+(f.type==='door'?'第 '+(f.i+1)+' 片門':'由上第 '+(f.i+1)+' 個抽屜頭');}
function mFaceColorOpen(group=false){
  const f=mFaceKey();if(!f)return;
  const key={c:f.c,p:f.p,i:f.i},part=st.cols[f.c].parts[f.p],swatches=[['#f2eee6','暖白'],['#d5c9b7','米灰'],['#b5a391','淺木色'],['#a8754d','暖木色'],['#704e37','深木色'],['#dedfe1','淺灰'],['#8c9297','灰色'],['#30383f','炭黑'],['#355b64','藍綠'],['#7b8872','灰綠'],['#cba477','沙色'],['#9f6663','灰紅']];
  mOpenSheet('面板配色',`<form id="mForm"><p class="m-paint-target">${esc(mFaceTitle(f))}</p><label class="m-field">套用範圍<select id="mPaintScope"><option value="one"${!group?' selected':''}>${f.type==='door'?'這片門片':'這個抽屜頭'}</option><option value="group"${group?' selected':''}>這組全部（${part.n} ${f.type==='door'?'片':'個'}）</option></select></label><div class="m-paint-swatches" role="group" aria-label="常用面板顏色">${swatches.map(([c,n])=>`<button type="button" data-paint="${c}" title="${n}" aria-label="${n}" style="--swatch:${c}"><span></span><small>${n}</small></button>`).join('')}</div><label class="m-field m-color-field">自訂顏色<input id="mPaintColor" type="color" value="${f.color||(displaySettings.theme==='dark'?'#151f27':'#ffffff')}"></label><button type="button" id="mPaintReset" class="m-row-action">恢復預設面板顏色</button><p id="mPaintStatus" class="m-sheet-note">選色會預覽，按套用才保存。${part.n>1?'整組套色會取代這組原有的跳色。':''}</p>${mFormButtons}</form>`,'faceColor');
  const preview=color=>{mobileUI.paintPreview={key,scope:$('#mPaintScope').value,color};render();$('#mPaintStatus').textContent=color?'預覽 '+color.toUpperCase()+'，按套用保存。':'預覽預設面板顏色，按套用保存。';for(const b of $('#mSheetBody').querySelectorAll('[data-paint]'))b.setAttribute('aria-pressed',b.dataset.paint===color);};
  const colorInput=e=>preview(FaceColor.valid(e.target.value)?e.target.value:null);
  $('#mPaintColor').addEventListener('input',colorInput);$('#mPaintColor').addEventListener('change',colorInput);
  $('#mPaintScope').addEventListener('change',()=>preview(mobileUI.paintPreview?mobileUI.paintPreview.color:f.color));
  $('#mPaintReset').onclick=()=>preview(null);
  $('#mForm').addEventListener('click',e=>{const c=e.target.closest('[data-paint]')?.dataset.paint;if(c){$('#mPaintColor').value=c;preview(c);}},{once:false});
  mobileUI.submit=()=>{const candidate=mobileUI.paintPreview;
    // Opening a panel and applying without picking preserves its existing finish.
    const color=candidate?candidate.color:f.color,scope=$('#mPaintScope').value;
    mTransaction(()=>FaceColor.set(st,key,color,scope));mCloseSheet(true);toast(scope==='group'?'這組面板配色已套用':'面板配色已套用');
  };
}
