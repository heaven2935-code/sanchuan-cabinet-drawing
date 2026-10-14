/* This layer uses the existing cabinet model, geometry, history and exports. */
const M_ICONS={
  menu:'M4 6h16M4 12h16M4 18h16',more:'M5 12h.01M12 12h.01M19 12h.01',close:'M6 6l12 12M18 6L6 18',plus:'M12 5v14M5 12h14',
  undo:'M9 5L4 10l5 5M4 10h10a5 5 0 0 1 0 10',redo:'M15 5l5 5-5 5M20 10H10a5 5 0 0 0 0 10',
  fit:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M9 9h6v6H9z',view:'M4 8h15l-3-3M20 16H5l3 3',
  vertical:'M4 4h16v16H4zM12 4v16',horizontal:'M4 4h16v16H4zM4 12h16',move:'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3',
  settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',size:'M4 7v10M20 7v10M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3',
  trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',copy:'M8 8h12v12H8zM4 16V4h12',paste:'M9 5H5v16h14V5h-4M9 3h6v4H9z',
  merge:'M4 4h16v16H4zM8 12h8M11 9l-3 3 3 3M13 9l3 3-3 3',lock:'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4',
  save:'M4 3h13l4 4v14H3V3h1M7 3v6h9V3M7 21v-8h10v8',files:'M3 6h7l2 2h9v12H3zM3 6V3h7l2 3',
  export:'M12 16V3M8 7l4-4 4 4M4 12v9h16v-9',import:'M12 3v13M8 12l4 4 4-4M4 12v9h16v-9',
  style:'M3 4h8v8H3zM15 4h6v6h-6zM3 16h6v5H3zM13 14h8v7h-8z',photo:'M3 4h18v16H3zM3 17l6-6 4 4 4-6 4 5M8 8h.01',
  mark:'M4 20l1-5L17 3l4 4L9 19zM14 6l4 4M5 15l4 4',line:'M4 20L20 4',arrow:'M4 20L20 4M12 4h8v8',rect:'M4 5h16v14H4z',
  circle:'M12 4a8 8 0 1 1-.01 0',text:'M4 5h16M12 5v15M8 20h8',pen:'M3 17c4-12 6 6 10-5s4-2 8-7',hl:'M13 3l7 7-8 8H7l-3 3H2l4-5v-4zM9 9l6 6',
  grid:'M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16',preview:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7M12 9a3 3 0 1 1-.01 0',
  mirror:'M12 3v18M3 6l6 3v6l-6 3zM21 6l-6 3v6l6 3z',multi:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  info:'M12 11v7M12 7h.01M12 3a9 9 0 1 1-.01 0',new:'M4 3h11l5 5v13H4zM15 3v6h5M8 15h8M12 11v8'
};
const mIcon=k=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(M_ICONS[k]||M_ICONS.more)+'"/></svg>';
const mobileUI={panel:false,panelKind:'',native:[],op:null,tool:null,first:null,preview:null,target:null,pointers:new Map(),gesture:null,hint:true,submit:null,freeDrawing:false,color:'#147c88',width:2};
const mShell=document.createElement('div');mShell.id='mShell';
mShell.innerHTML=`
  <header class="m-header"><span class="m-brand" aria-hidden="true"><img src="./logo.svg" alt=""></span><button id="mTitle" aria-label="編輯檔名"><strong></strong><span id="mSubtitle"></span></button><button id="mView" aria-label="切換櫃外與櫃內"></button><button id="mDepth" aria-label="切換櫃內平面與深度預覽" title="固定視角的深度示意，不代表實際櫃深"></button><button id="mMenu" aria-label="圖面與檔案">${mIcon('menu')}</button></header>
  <div id="mHint">點線或格子來編輯 · 單指拖圖 · 雙指縮放</div>
  <div class="m-dock"><div class="m-tools"><button id="mUndo" aria-label="復原">${mIcon('undo')}</button><button id="mRedo" aria-label="重做">${mIcon('redo')}</button></div><button id="mFit" aria-label="圖面置中">${mIcon('fit')}</button><button id="mAdd" aria-label="新增內容">${mIcon('plus')}</button></div>
  <section id="mContext" class="m-context" aria-label="選取項目的操作" hidden><div class="m-selection-heading"><span id="mSelectedTitle"></span><button id="mDismiss" aria-label="取消選取">${mIcon('close')}</button></div><div id="mActions"></div></section>
  <section id="mOperation" aria-label="編輯預覽" hidden><div class="m-operation-top"><div id="mOperationTitle"></div><button id="mOperationCancel" class="m-cancel">取消</button></div><div class="m-operation-fields"><label class="m-op-label"><span id="mOffsetLabel">位置</span><input id="mOffset" type="number" inputmode="numeric" step="1" aria-label="分隔位置，單位公釐"><span>mm</span></label><button id="mOperationConfirm" class="m-confirm">確定</button></div></section>
  <div id="mToolStrip" hidden><span id="mToolText"></span><button id="mToolDone" class="m-cancel">取消</button></div>
  <div id="mScrim" hidden></div><section id="mSheet" role="dialog" aria-modal="true" aria-labelledby="mSheetTitle" hidden><div class="m-grabber"></div><div class="m-sheet-head"><span id="mSheetTitle"></span><button id="mSheetClose" aria-label="關閉">${mIcon('close')}</button></div><div id="mSheetBody"></div></section>
  <input id="mImport" type="file" accept="application/json,.json" hidden>
`;
document.body.appendChild(mShell);

// Preserve the geometry engine but give its sheet the entire available height.
portH=function(){return Math.max(160,$('#sheet').clientHeight||window.innerHeight-140)};
placeTiles=function(cw,hp,lay){tiles=[{i:pj.cur,S:lay.S,vb:lay.vb,ox:0,oy:0}];worldVB=lay.vb};
forceLand=false;axOn.x=axOn.y=false;esub='line';padMode='cur';lkp=null;
const mEngineRender=render;
render=function(){
  depthRuntime.view=view;depthRuntime.previewing=!!mobileUI.nativeDrag||!!(mobileUI.op?.kind==='annmove'&&!mobileUI.op.committed);
  depthRuntime.editing=!!mobileUI.op||!!mobileUI.tool||!!mobileUI.voiceActive||['cell','overall','native'].includes(mobileUI.panelKind);
  depthRuntime.fixedEdge=mobileUI.fixedEdge||null;depthRuntime.face=mobileUI.face||null;depthRuntime.paintPreview=mobileUI.paintPreview||null;
  document.documentElement.dataset.canvasTheme=displaySettings.theme;
  darkSheet=displaySettings.theme==='dark';
  const themeMeta=document.querySelector('meta[name="theme-color"]');if(themeMeta)themeMeta.content=darkSheet?'#151f27':'#ffffff';
  st.grid=displaySettings.gridStyle==='none'?0:displaySettings.gridSize;
  st.labels=displaySettings.names;
  cur.on=true;esub='line';
  mEngineRender();
  cur.on=!!mobileUI.op;
  mSync();
};

function mState(){
  if(mobileUI.op||mobileUI.tool||mobileUI.panel||mobileUI.voiceActive)return{busy:true};
  if(mobileUI.fixedEdge)return{kind:'line',title:mobileUI.fixedEdge==='left'?'左側外框 · 固定基準':'底部外框 · 固定基準',movable:false,removable:false};
  if(multi){const c=picked(),cols=[...new Set(c.map(x=>x.c))];return{kind:'multi',title:'已選 '+c.length+' 格',merge:MobilePolicy.mergeAllowed(st,view,c),evenWidth:cols.length>1&&!cols.some(i=>st.cols[i].lock),evenHeight:c.length>1&&cols.length===1&&(view!=='in'||new Set(c.map(x=>x.p)).size===1),more:c.length>0};}
  if(asel>=0&&st.ann[asel])return{kind:'annotation',title:ANN[st.ann[asel].k]||'標註'};
  if(isFree()&&fsel)return{kind:fsel.k==='l'?'freeLine':'freeCell',title:fsel.k==='l'?flName(st.ln[fsel.i]):'自由繪圖格子'};
  const face=mFaceKey();if(face)return{kind:'face',title:mFaceTitle(face)};
  if(hsel||(sel&&sel.g!=null)){
    const h=hsel,removable=!!(h&&/^[crps]$/.test(h.k))||!!(sel&&sel.g!=null),m=mvInfo(),movable=!!m&&m.lo<m.hi&&!(h?.k==='c'&&(freeL(h.i)<0||freeR(h.i+1)<0));
    return{kind:'line',title:mobileUI.target&&mobileUI.target.name|| (h?({w:'總寬',h:'總高',k:'踢腳板上緣',c:'直向分隔線',r:'橫向分隔線',p:'橫向分隔線',s:'櫃內分隔線'}[h.k]||'分隔線'):'層板'),movable,removable,dimensions:movable||!!(h&&['w','h','k'].includes(h.k))};
  }
  const o=selObj();
  if(o){const x=view==='in'?o.s:o.p,L=view==='in'?o.p.ins:o.col.parts;return{kind:'cell',title:(['drawer','idrawer'].includes(x.t)?(view==='in'?'內抽組':'抽屜組')+'（'+x.n+' 個）':x.t==='door'&&x.n===2?'對開門片':(view==='in'?INS[x.t]:TYPES[x.t]))+' · '+Math.round(o.col.w)+' × '+Math.round(x.h)+' mm',splitV:view==='out'&&!o.col.lock&&o.col.w>=2*MIN&&st.cols.length<20,splitH:x.h>=2*MIN&&L.length<(view==='in'?8:12),more:true};}
  return{};
}
function mSync(){
  if(mobileUI.panel&&$('#mNative'))mobileUI.native.forEach(x=>{if(x.el.parentNode!==$('#mNative'))$('#mNative').appendChild(x.el);x.el.hidden=false;});
  const name=pj.name||'未命名圖面';$('#mTitle strong').textContent=name;
  $('#mSubtitle').textContent=shName(pj.cur)+(view==='in'&&displaySettings.interiorView==='depth'?' · 深度示意':' · mm');
  $('#mDepth').hidden=isFree()||view!=='in';$('#mDepth').textContent=displaySettings.interiorView==='depth'?'深度':'平面';$('#mDepth').setAttribute('aria-pressed',displaySettings.interiorView==='depth');
  $('#mView').hidden=isFree();$('#mView').innerHTML=(view==='out'?'櫃外':'櫃內')+mIcon('view');
  $('#mUndo').classList.toggle('m-off',!hist.length);$('#mRedo').classList.toggle('m-off',!fut.length);
  $('.m-tools').hidden=!hist.length&&!fut.length;
  const s=mState(),actions=MobilePolicy.actions(s),show=!!s.kind&&actions.length>0;
  mShell.classList.toggle('has-selection',show);mShell.classList.toggle('has-operation',!!mobileUI.op);mShell.classList.toggle('has-tool',!!mobileUI.tool||mobileUI.freeDrawing||!!bgCal||(multi&&!picked().length));
  $('#mContext').hidden=!show;$('#mSelectedTitle').textContent=s.title||'';
  const sig=actions.map(x=>x.id+x.label).join('|');
  if($('#mActions').dataset.sig!==sig){$('#mActions').dataset.sig=sig;$('#mActions').innerHTML=actions.map(a=>`<button data-m="${a.id}" class="${a.primary?'m-primary':''} ${a.danger?'m-danger':''}">${mIcon(a.icon)}<span>${a.label}</span></button>`).join('');}
  $('#mHint').hidden=!mobileUI.hint||mobileUI.panel;
  $('#mOperation').hidden=!mobileUI.op;
  $('#mToolStrip').hidden=mobileUI.panel||!(mobileUI.tool||mobileUI.freeDrawing||bgCal||(multi&&!picked().length));
  if(mobileUI.tool){$('#mToolText').textContent=mobileUI.tool==='text'?'點圖面放文字':mobileUI.tool==='pen'||mobileUI.tool==='hl'?'在圖上拖動繪製':mobileUI.first?'點終點，也可以直接拖出線條':'點起點，再點終點；也可直接拖曳';$('#mToolDone').textContent='取消';}
  else if(bgCal){$('#mToolText').textContent='拖動 1–4 四個角，對準已知尺寸的長方形';$('#mToolDone').textContent='輸入尺寸';}
  else if(mobileUI.freeDrawing){$('#mToolText').textContent=ftool.k==='ln'?'在圖上拖出'+(FLT[ftool.t]||'板'):'點封閉格子放入'+(FCT[ftool.t]||'配置');$('#mToolDone').textContent='完成';}
  else if(multi){$('#mToolText').textContent='點選要一起編輯的格子';$('#mToolDone').textContent='完成';}
  if(mobileUI.op)mOperationSync();
  mPreview();
}
function mRestoreNative(){mobileUI.native.forEach(x=>{if(x.next&&x.next.parentNode===x.parent)x.parent.insertBefore(x.el,x.next);else x.parent.appendChild(x.el)});mobileUI.native=[];}
function mCloseSheet(clear){const hadPaint=!!mobileUI.paintPreview;mobileUI.paintPreview=null;const planar=['cell','overall','native'].includes(mobileUI.panelKind);mRestoreNative();mobileUI.panel=false;mobileUI.panelKind='';mobileUI.submit=null;$('#mSheet').hidden=$('#mScrim').hidden=true;$('#mSheetBody').innerHTML='';if(clear)mFinish();else if(planar||hadPaint)render();else mSync();}
function mOpenSheet(title,html,kind){mCloseSheet(false);mobileUI.panel=true;mobileUI.panelKind=kind||'';$('#mSheetTitle').textContent=title;$('#mSheetBody').innerHTML=html;$('#mSheetBody').scrollTop=0;$('#mSheet').hidden=$('#mScrim').hidden=false;if(['cell','overall','native'].includes(kind))render();else mSync();}
function mNative(id){const e=$(id);if(!e)return;mobileUI.native.push({el:e,parent:e.parentNode,next:e.nextSibling});$('#mNative').appendChild(e);e.hidden=false;}
function mFinish(){
  const returnView=mobileUI.returnView;mobileUI.returnView=null;mobileUI.fixedEdge=null;
  if(mobileUI.op&&mobileUI.op.kind==='annmove'&&!mobileUI.op.committed)st.ann[mobileUI.op.index]=mobileUI.op.original;
  mobileUI.face=null;mobileUI.paintPreview=null;mobileUI.invalidOffset=false;mobileUI.op=null;mobileUI.tool=null;mobileUI.first=null;mobileUI.preview=null;mobileUI.target=null;mobileUI.freeDrawing=false;cpd=null;bgCal=null;
  mk.p1=mk.end=mk.mv=null;tool=null;asel=-1;sel=null;hsel=null;hgrp=[];hsolo=false;fsel=null;msel=[];multi=false;mode='edit';ucat='edit';cur.tp=null;cur.dm=null;cur.on=false;cur.fine=false;padMode='cur';lkp=null;if(returnView&&view!==returnView)setView(returnView);else render();
}
function mTransaction(fn){
  pjSync();const before=snapS(),oldHist=hist.slice(),oldFut=fut.slice(),oldN=edN,oldBak=futBak;
  fn();pjSync();const changed=snapS()!==before;
  hist=oldHist;fut=oldFut;edN=oldN;futBak=oldBak;
  if(changed)pushRaw(before);else syncUR();
  saveDraft();return changed;
}
function mGridButton(id,label,icon,accent=false){return`<button data-m="${id}" class="${accent?'m-accent':''}">${mIcon(icon)}<span>${label}</span></button>`;}
function mRow(id,label,icon,note=''){return`<button class="m-row-action" data-m="${id}">${mIcon(icon)}<span>${label}</span>${note?'<small>'+note+'</small>':''}</button>`;}
function mMenuOpen(){
  mFinish();
  mOpenSheet('圖面與檔案',`<label class="m-field">檔名<input id="mName" maxlength="60" value="${esc(pj.name||'')}" placeholder="輸入案名或圖面名稱"></label><div class="m-menu-grid">${mGridButton('overall','尺寸','size')}${mGridButton('styles','櫃體樣式','style')}${mGridButton('pages','分頁','files')}${mGridButton('save','儲存','save',true)}${mGridButton('saved','我的圖面','files')}${mGridButton('exports','匯出','export')}</div><p class="m-section-label">圖面</p>${mRow('preview','預覽成品圖','preview')}${mRow('display','圖面顯示與尺軌','settings','格線・顏色')}${mRow('photo','照片與掃描底圖','photo')}<p class="m-section-label">備份</p>${mRow('backup','下載可編輯備份','export','JSON')}${mRow('restore','匯入圖面備份','import')}${mRow('new','新增檔案','new')}<p class="m-sheet-note">圖面存在這台裝置的瀏覽器內。下載備份可保留可編輯的圖面與照片。</p>`,'menu');
  $('#mName').addEventListener('change',e=>{pushP();pj.name=e.target.value.trim().slice(0,60);render();saveNow();});
}
function mDisplayOpen(){
  const p=displaySettings,select=(id,label,options,value)=>`<label class="m-field">${label}<select id="${id}">${options.map(([v,t])=>`<option value="${v}"${value===v?' selected':''}>${t}</option>`).join('')}</select></label>`;
  const toggle=(id,label,value)=>`<label class="m-display-toggle"><span>${label}</span><input id="${id}" type="checkbox"${value?' checked':''}></label>`;
  const swatch=(id,label,value)=>`<label class="m-field m-color-field">${label}<input id="${id}" type="color" value="${value}"></label>`;
  mOpenSheet('圖面顯示與尺軌',`<form id="mForm">${select('mTheme','介面版本',[['light','淺色'],['dark','深色']],p.theme)}<p class="m-section-label">顯示內容</p>${toggle('mShowSwing','門片開啟斜線',p.doorSwing)}${toggle('mShowDims','尺寸標示',p.dimensions)}${toggle('mShowNames','格內名稱與尺寸',p.names)}<p class="m-sheet-note">尺寸關閉時，選取線條仍會顯示相關尺寸，方便調整。</p><p class="m-section-label">格線</p><div class="m-form-grid">${select('mGridStyle','樣式',[['lines','細格線'],['dots','點陣'],['none','無格線']],p.gridStyle)}${mField('mGridSize','格距 · mm',p.gridSize,10,1000)}</div>${swatch('mGridColor','格線顏色',p.gridColor)}<p class="m-sheet-note">細格線每 5 格加深一條。縮小時會簡化過密格線，設定格距仍用於對齊。</p><p class="m-section-label">櫃體線條</p>${swatch('mLineColor','櫃體線條顏色',p.lineColor)}<p class="m-section-label">標示顏色</p><div class="m-form-grid">${swatch('mSelectionColor','選取線與菱形',p.selectionColor)}${swatch('mDimensionColor','一般尺寸',p.dimensionColor)}</div>${select('mRulerSide','直向尺的位置',[['right','右側'],['left','左側']],p.rulerSide)}${mFormButtons}</form>`,'display');
  mobileUI.submit=()=>{
    const size=Number($('#mGridSize').value);if(!Number.isFinite(size)||size<10||size>1000){toast('格距請輸入 10–1000 mm');return;}
    Object.assign(displaySettings,DisplayStyle.themeChange(p,$('#mTheme').value,{interiorView:p.interiorView,lineColor:$('#mLineColor').value,doorSwing:$('#mShowSwing').checked,dimensions:$('#mShowDims').checked,names:$('#mShowNames').checked,gridStyle:$('#mGridStyle').value,gridSize:size,gridColor:$('#mGridColor').value,selectionColor:$('#mSelectionColor').value,dimensionColor:$('#mDimensionColor').value,rulerSide:$('#mRulerSide').value}));
    try{localStorage.setItem('sc-mobile-display-v1',JSON.stringify(displaySettings))}catch(_){}
    othCache.clear();mCloseSheet(true);toast('圖面顯示已更新');
  };
}
function mAddOpen(){const c=!isFree()?locCell(mCellCenter()):null,x=c&&(c.s||c.p),L=c&&(c.s?c.p.ins:c.col.parts),v=c&&view==='out'&&!c.col.lock&&c.col.w>=2*MIN&&st.cols.length<20,h=x&&x.h>=2*MIN&&L.length<(c.s?8:12);mOpenSheet('新增內容','<div class="m-menu-grid">'+(v?mGridButton('splitV','直分隔','vertical'):'')+(h?mGridButton('splitH','橫分隔','horizontal'):'')+mGridButton('voice','口令丈量','mic',true)+mGridButton('mark','標註／量尺','mark')+mGridButton('photo','照片底圖','photo')+(pj.sheets.length<20?mGridButton('addpage','新增分頁','new'):'')+(isFree()?mGridButton('freeTools','畫板與五金','pen'):mGridButton('toFree','自由繪圖','pen'))+'</div><p class="m-sheet-note">先點一格再分隔，可以直接指定要編輯的區域。口令丈量目前為文字驗算，尚未收音。</p>','add');}
function mPages(){mOpenSheet('分頁',pj.sheets.map((x,i)=>mRow('page:'+i,shName(i),'files',i===pj.cur?'目前':'')).join('')+(pj.sheets.length<20?mRow('addpage','新增分頁','plus'):'')+mRow('pageRename','修改目前分頁名稱','text')+mRow('pageDuplicate','複製目前分頁','copy'),'pages');}
function mMoreOpen(){
  const rows=[];
  if(multi){if(alignOk())rows.push(mRow('align','層板對齊','horizontal'));if(!$('#aCopy').disabled)rows.push(mRow('copy','複製','copy'));if(!$('#aPaste').disabled)rows.push(mRow('paste','貼上','paste'));if(!$('#aClear').disabled)rows.push(mRow('clear','清空內容','trash'));rows.push(mRow('lock','鎖定／解鎖區寬','lock'));}
  else{
    if(!$('#aCopy').disabled)rows.push(mRow('copy','複製這格','copy'));
    if(!$('#aPaste').disabled)rows.push(mRow('paste','貼上到這格','paste'));
    rows.push(mRow('multi','多選格子','multi'));
    const o=selObj();if(o){if(view==='out'&&['door','drawer'].includes(o.p.t))rows.push(mRow('groupColor','整組面板配色','style'));rows.push(mRow('lock',o.col.lock?'解除區寬鎖定':'鎖定區寬','lock'));if(!$('#aClear').disabled)rows.push(mRow('clear','清空這格','trash'));if(!$('#aDel').disabled)rows.push(mRow('delete','刪除這格','trash'));}
  }
  mOpenSheet('更多操作',rows.join(''),'more');
}
const mField=(id,label,value,min,max)=>`<label class="m-field">${label}<input id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" required value="${value}"></label>`;
const mFormButtons='<div class="m-form-actions"><button type="button" data-m="cancelForm">取消</button><button class="m-confirm" type="submit">套用</button></div>';
function mFormValuesValid(){const form=$('#mForm');if(!form)return true;for(const e of form.querySelectorAll('input[type="number"]')){const n=Number(e.value),min=e.getAttribute('min'),max=e.getAttribute('max');if(!String(e.value).trim()||!Number.isFinite(n)||!Number.isInteger(n)||(min!==null&&n<Number(min))||(max!==null&&n>Number(max))){toast('請檢查數值，輸入允許範圍內的整數');e.focus();return false;}}return true;}
function mOverall(){
  const fr=isFree();
  mOpenSheet('整體尺寸 · mm',`<form id="mForm"><div class="m-form-grid">${mField('mW','總寬',st.W,st.cols?st.cols.length*MIN:100,MAXW)}${mField('mH','總高',st.H,150,MAXH)}${mField('mT','板厚',st.T||18,6,40)}${fr?'':mField('mK','踢腳高度',st.kick||0,0,st.H-MIN)+mField('mKS','踢腳內退',st.kickSetback??50,0,300)+mField('mGap','門片／抽屜總縫寬',st.faceGap??4,0,20)}</div><p class="m-sheet-note">${fr?'修改總寬與總高會按比例調整現有板線的位置與長度。':'修改整體尺寸會同步調整各區配置。'}圖面尺寸以公釐（mm）表示。踢腳內退以桶身前緣為基準，0 為齊平；門縫為兩片面板間總縫寬。</p>${mFormButtons}</form>`,'overall');
  mobileUI.submit=()=>{const w=Number($('#mW').value),h=Number($('#mH').value),t=Number($('#mT').value),k=$('#mK')?.value;mTransaction(()=>{if(fr){const sx=w/st.W,sy=h/st.H;st.ln.forEach(l=>{l.x1=Math.round(l.x1*sx);l.x2=Math.round(l.x2*sx);l.z1=Math.round(l.z1*sy);l.z2=Math.round(l.z2*sy)});(st.cl||[]).forEach(c=>{c.x*=sx;c.z*=sy});st.W=w;st.H=h;st.T=t;freeFix(st);}else{applyDim({k:'W'},w);applyDim({k:'H'},h);applyDim({k:'K'},k);st.T=t;st.kickSetback=Number($('#mKS').value);st.faceGap=Number($('#mGap').value);fixAll(st);}});mCloseSheet(true);toast('整體尺寸已套用');};
}
function mCellSettings(){
  const o=selObj();if(!o)return;const inV=view==='in',x=inV?o.s:o.p,L=inV?o.p.ins:o.col.parts;
  const opts=inV?[['empty','空格'],['shelf','層板'],['rod','吊衣桿'],['idrawer','內抽']]:[['empty','空櫃'],['door','門片'],['drawer','抽屜'],['open','層板'],['blank','封板']];
  const type=(x.t==='open'||x.t==='shelf')&&!x.n?'empty':x.t;
  mOpenSheet('格子設定',`<form id="mForm"><label class="m-field">這格要做什麼<select id="mType">${opts.map(([v,l])=>`<option value="${v}"${type===v?' selected':''}>${l}</option>`).join('')}</select></label><div class="m-form-grid">${!o.col.lock?mField('mCW','區寬 · mm',o.col.w,MIN,MAXW):''}${L.length>1?mField('mPH','格高 · mm',x.h,MIN,st.H):''}</div><div id="mTypeFields"></div><p class="m-sheet-note">區寬與格高調整時，由相鄰未鎖定區域補差額。只有一格時，高度請從「整體尺寸」修改。</p>${mFormButtons}</form>`,'cell');
  const fill=()=>{const t=$('#mType').value;let h='';if(t==='door')h=`<div class="m-form-grid"><label class="m-field">門片<select id="mN"><option value="1"${x.n===1?' selected':''}>單開門</option><option value="2"${x.n===2?' selected':''}>對開門</option></select></label><label class="m-field">開門方向<select id="mHinge"><option value="L"${o.p.hinge!=='R'?' selected':''}>左鉸鏈</option><option value="R"${o.p.hinge==='R'?' selected':''}>右鉸鏈</option></select></label></div>`;else if(['open','shelf','drawer','idrawer'].includes(t))h=mField('mN',t==='open'||t==='shelf'?'層板片數':'抽屜數量',x.t===t?x.n:1,t==='open'||t==='shelf'?0:1,10);if(!inV&&(t==='door'||t==='drawer'))h+=`<label class="m-field">把手<select id="mPull"><option value="bar"${!o.p.pull?' selected':''}>一般把手</option><option value="groove"${o.p.pull==='groove'?' selected':''}>取手縫</option><option value="none"${o.p.pull==='none'?' selected':''}>無把手</option></select></label>`;if(!inV&&(t==='door'||t==='drawer'))h+=mField('mGroove','取手縫寬 · mm',o.p.gw??25,5,120);$('#mTypeFields').innerHTML=h;};fill();$('#mType').addEventListener('change',fill);
  mobileUI.submit=()=>{
    const v={t:$('#mType').value,w:$('#mCW')?.value,h:$('#mPH')?.value,n:$('#mN')?.value,hinge:$('#mHinge')?.value,pull:$('#mPull')?.value,gw:$('#mGroove')?.value};
    mTransaction(()=>{if(v.w!=null)fieldChange('cw',v.w);if(v.h!=null)fieldChange('ph',v.h);const now=selObj(),c=inV?now.s:now.p;if(v.t==='empty')act('clear');else if(c.t!==v.t)act('type',v.t);if(v.n!=null){if(v.t==='door')act('n',v.n);else fieldChange('n',v.n)}if(v.hinge)act('hinge',v.hinge);if(v.pull)pullSet('pull',v.pull);if(v.pull==='groove')selObj().p.gw=Number(v.gw);});mCloseSheet(true);toast('格子設定已套用');
  };
}
function mSettings(){const s=mState();if(s.kind==='annotation'){mAnnSettings();return}if(s.kind==='freeLine'||s.kind==='freeCell'){mOpenSheet('自由繪圖設定','<div id="mNative" class="m-native-host"></div>'+mRow('applyNative','完成','settings'),'native');render();mNative('#editor');return}mCellSettings();}
function mCellCenter(){const o=selObj();if(!o)return{x:st.W/2,y:(st.H-st.kick)/2};let x=0,y=0;for(let i=0;i<sel.c;i++)x+=st.cols[i].w;for(let i=0;i<sel.p;i++)y+=o.col.parts[i].h;if(view==='in'){for(let i=0;i<sel.s;i++)y+=o.p.ins[i].h;}return{x:x+o.col.w/2,y:y+(view==='in'?o.s:o.p).h/2};}
function mBegin(kind){
  const q=(kind==='move'||kind==='annmove')&&mobileUI.lastPoint?mobileUI.lastPoint:mCellCenter();mCloseSheet(false);
  if(kind==='annmove'){const a=st.ann[asel];if(!a)return;const seed={x:Math.round(q.x),y:Math.round(q.y)};mobileUI.op={kind,index:asel,original:JSON.parse(JSON.stringify(a)),before:snapS(),origin:{...seed},railPoint:{...seed},grab:null};mobileUI.target=null;render();return;}
  mode='edit';ucat='edit';cur.on=true;cur.nos=true;cur.fine=true;cur.x=Math.round(q.x);cur.y=Math.round(q.y);cur.tp=null;
  const cell=locCell(q),x=cell&&(cell.s||cell.p),top=cell&&(cell.s?cell.sy:cell.y0);
  mobileUI.op={kind,bounds:cell?{x0:cell.x0,x1:cell.x0+cell.col.w,y0:top,y1:top+x.h}:null};
  cpdKey(kind==='splitV'?'vsplit':kind==='splitH'?'hsplit':'move');
  if(!cpd){mobileUI.op=null;mSync();return;}mobileUI.hint=false;render();
}
function mOperationData(){const o=mobileUI.op;if(!o)return null;if(o.kind==='annmove')return{title:'移動標註',note:'在圖上拖曳標註，位置對了按「確定」。',label:'',value:null};if(o.kind==='move'){const r=cpdTarget();if(!r)return null;const m=r.m,dd=r.tv-m.v;return{title:'移動分隔線',note:(m.ax==='x'?'左 ':'上 ')+fmt((m.a0||0)+dd)+' ／ '+(m.ax==='x'?'右 ':'下 ')+fmt((m.b0||0)-dd)+' mm',label:m.ax==='x'?'距左':'距上',value:m.a0==null?null:(m.a0+dd)};}const r=splitPlan(o.kind==='splitV'),p=r.pl;return p?{title:o.kind==='splitV'?'直分隔':'橫分隔',note:(p.v?'左 ':'上 ')+p.a+' ／ '+(p.v?'右 ':'下 ')+p.b+' mm · 可拖動預覽線',label:p.v?'距左':'距上',value:p.a}: {title:o.kind==='splitV'?'直分隔':'橫分隔',note:'把預覽線移到可分隔的區域內。',label:'位置',value:null};}
function mOperationSync(){const d=mOperationData();if(!d)return;$('#mOperationTitle').innerHTML=esc(d.title)+'<span id="mOperationNote">'+esc(d.note)+'</span>';$('#mOffsetLabel').textContent=d.label;$('.m-op-label').hidden=d.value==null;if(d.value!=null&&document.activeElement!==$('#mOffset'))$('#mOffset').value=fmt(d.value);}
function mOperationOffset(raw){const o=mobileUI.op;if(!o)return;if(raw==null||!String(raw).trim())return;const n=Number(raw);if(!Number.isFinite(n))return;if(o.kind==='move'){const r=cpdTarget();if(!r||r.m.a0==null)return;const m=r.m,v=clamp(m.v-m.a0+n,m.lo,m.hi);if(m.ax==='x')cur.x=v;else cur.y=v;}else{const r=splitPlan(o.kind==='splitV'),p=r.pl;if(!p)return;const v=MobilePolicy.clampOffset(n,p.a+p.b,MIN);if(v==null)return;if(o.kind==='splitV')cur.x=p.c.x0+v;else cur.y=p.top+v;}cur.nos=true;mSync();}
function mOperationPoint(q){mobileUI.invalidOffset=false;const o=mobileUI.op;if(!o)return;if(o.kind==='annmove'){if(!o.origin)o.origin={...q};o.railPoint={x:Math.round(q.x),y:Math.round(q.y)};const a=JSON.parse(JSON.stringify(o.original));moveAnn(a,o.railPoint.x-o.origin.x,o.railPoint.y-o.origin.y);st.ann[o.index]=a;render();return;}if(o.kind==='move'){const m=mvInfo();if(!m)return;const snap=v=>m.t==='g'?Math.round(v*2)/2:Math.round(v);cur.x=snap(q.x);cur.y=snap(q.y);if(m.ax==='x')cur.x=clamp(cur.x,m.lo,m.hi);else cur.y=clamp(cur.y,m.lo,m.hi);}else{const b=o.bounds;if(b){cur.x=clamp(Math.round(q.x),b.x0+MIN,b.x1-MIN);cur.y=clamp(Math.round(q.y),b.y0+MIN,b.y1-MIN);}else{cur.x=Math.round(q.x);cur.y=Math.round(q.y);}}cur.nos=true;cur.tp=null;mSync();}
function mConfirmOperation(){if(mobileUI.invalidOffset){toast('請先修正尺寸或使用微調鍵重新定位');return;}const o=mobileUI.op;if(!o)return;if(o.kind==='annmove'){if(snapS()!==o.before)pushRaw(o.before);o.committed=true;mFinish();toast('標註位置已更新');return;}cpdGo();if(cpd)return;mFinish();}
function mPreview(){
  let g=svg.querySelector('#mobile-preview');if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='mobile-preview';g.setAttribute('pointer-events','none');svg.appendChild(g)}
  if(mobileUI.op&&cpd&&mobileUI.op.kind!=='annmove'){const P=[],k=S/zoom.z;cpdDraw(P,curSnap(),k);g.innerHTML=toSVG(P,k,pal).art;}
  else if(mobileUI.preview){g.innerHTML=toSVG(annPrims([{a:mobileUI.preview,i:-1}],S),S,pal).art;}
  else g.innerHTML='';
  mPrecisionDraw(g);mRulersSync();
}
function mToolOpen(){mOpenSheet('標註與量尺','<div class="m-menu-grid">'+[['line','直線','line'],['arrow','箭頭','arrow'],['rect','方框','rect'],['circle','圓形','circle'],['dim','量尺','size'],['text','文字','text'],['pen','畫筆','pen'],['hl','螢光筆','hl']].map(x=>mGridButton('tool:'+x[0],x[1],x[2])).join('')+'</div><div class="m-tool-colors">'+['#147c88','#c8372d','#1f66b3','#203038','#ee7d1c'].map(c=>`<button data-m="color:${c}" style="background:${c}" aria-label="顏色 ${c}" aria-pressed="${mobileUI.color===c}"></button>`).join('')+'</div><p class="m-sheet-note">標註不會改變櫃體配置。量尺使用圖面比例計算。</p>','tools');}
function mStartTool(k){mCloseSheet(false);mFinish();mobileUI.tool=k;mobileUI.first=null;mobileUI.preview=null;mobileUI.hint=false;mode='mark';tool=null;render();}
function mAnn(a){push();st.ann.push(a);mFinish();toast(a.k==='dim'?'量尺已加入':'標註已加入');}
function mMakeAnn(k,a,b,pts){color=mobileUI.color;lwPx=mobileUI.width;return cleanAnn({k,c:mobileUI.color,x1:a.x,y1:a.y,x2:b.x,y2:b.y,pts:pts||[]});}
function mTextAt(q){mOpenSheet('加入文字',`<form id="mForm"><label class="m-field">標註文字<input id="mText" maxlength="40" required placeholder="輸入標註內容"></label>${mFormButtons}</form>`,'text');mobileUI.submit=()=>{const s=$('#mText').value.trim();if(!s)return;const a={k:'text',s,x:Math.round(q.x),y:Math.round(q.y),c:mobileUI.color,v:aview(),fz:16*S};mCloseSheet(false);mAnn(a);};setTimeout(()=>$('#mText')?.focus(),30);}
function mAnnSettings(){const i=asel,a=st.ann[i];if(!a)return;mOpenSheet('標註設定',`<form id="mForm">${a.k==='text'?'<label class="m-field">文字<input id="mAnnText" required maxlength="40" value="'+esc(a.s||'')+'"></label>':''}<label class="m-field">顏色<select id="mAnnColor">${[['#147c88','青綠'],['#c8372d','紅色'],['#1f66b3','藍色'],['#203038','深灰'],['#ee7d1c','橘色']].map(([c,t])=>'<option value="'+c+'"'+(a.c===c?' selected':'')+'>'+t+'</option>').join('')}</select></label>${mField('mAnnWidth',a.k==='text'?'文字大小':'線條粗細',a.k==='text'?Math.round((a.fz||16*S)/S):Math.max(1,Math.round((a.lw||2*S)/S)),a.k==='text'?8:1,a.k==='text'?48:12)}${mFormButtons}</form>`,'annotation');mobileUI.submit=()=>{const s=$('#mAnnText')?.value,c=$('#mAnnColor').value,w=Number($('#mAnnWidth').value);push();a.c=c;if(a.k==='text'){a.s=s;a.fz=w*S}else a.lw=w*S;mCloseSheet(true);toast('標註設定已更新');};}
function mPhoto(){mCloseSheet(false);mode='bg';ucat='edit';render();mOpenSheet('照片與掃描底圖','<div id="mNative" class="m-native-host"></div>'+mRow('applyNative','完成','settings'),'photo');mNative('#bgPanel');}
function mFreeTools(){mOpenSheet('自由繪圖工具','<div class="m-menu-grid">'+[['board','固定板'],['shelf','活動層板'],['rod','吊衣桿'],['hinge','鉸鏈'],['line','輔助線']].map(([k,l])=>mGridButton('free:'+k,l,k==='board'?'vertical':'line')).join('')+'</div><p class="m-section-label">封閉格子</p><div class="m-menu-grid">'+[['door','門片'],['drawer','抽屜'],['open','開放格'],['blank','封板']].map(([k,l])=>mGridButton('stamp:'+k,l,'rect')).join('')+'</div>','freeTools');}
async function mBackup(){try{pjSync();photoStash();await dl.save({filename:fileBase()+'.json',data:JSON.stringify({format:'sanchuan-mobile-v1',project:{id:'',name:pj.name,cur:pj.cur,sheets:pj.sheets},photos:[...photos.entries()]},null,2)});toast('可編輯備份已交給裝置存檔');}catch(e){if(e?.code!=='declined')toast('備份沒有完成，請再試一次');}}
async function mRun(id){
  if(id==='faceColor'){mFaceColorOpen();return;}if(id==='faceGroup'){mobileUI.face=null;render();return;}
  if(id==='groupColor'){const o=selObj();if(!o||view!=='out')return;mobileUI.face={c:sel.c,p:sel.p,i:0};mFaceColorOpen(true);return;}
  if(id==='display'||id==='grid'||id==='labels'){mDisplayOpen();return;}
  if(id.startsWith('tool:')){mStartTool(id.slice(5));return;}
  if(id.startsWith('color:')){mobileUI.color=id.slice(6);mToolOpen();return;}
  if(id.startsWith('free:')||id.startsWith('stamp:')){ftool={k:id.startsWith('free:')?'ln':'st',t:id.split(':')[1]};mCloseSheet(false);mFinish();mode='draw';dtool='line';mobileUI.freeDrawing=true;render();return;}
  if(id==='settings'){mSettings();return;}if(id==='more'){mMoreOpen();return;}
  if(id==='splitV'||id==='splitH'){mBegin(id);return;}
  if(id==='move'){mBegin(asel>=0?'annmove':'move');return;}
  if(id==='dimensions'){if(mobileUI.fixedEdge||(hsel&&['w','h','k'].includes(hsel.k)))mOverall();else mBegin('move');return;}
  if(id==='delete'){mCloseSheet(false);if(asel>=0){push();st.ann.splice(asel,1)}else if(isFree())freeAct(fsel?.k==='c'?'ct':'del','none');else if(hsel)hDelete();else if(sel?.g!=null)act('gdel');else act('ddel');mFinish();return;}
  if(id==='copy'||id==='paste'||id==='clear'||id==='lock'||id==='align'||id==='merge'||id==='evenWidth'||id==='evenHeight'){mCloseSheet(false);act({copy:'xcopy',paste:'xpaste',clear:'subclear',lock:'xlock',align:'align',merge:'merge',evenWidth:'evenw',evenHeight:'evenh'}[id]);mFinish();return;}
  if(id==='multi'){mCloseSheet(false);act('multi');mobileUI.target=null;mobileUI.hint=false;render();return;}
  if(id==='overall'){mOverall();return;}if(id==='mark'){mToolOpen();return;}if(id==='photo'){mPhoto();return;}
  if(id==='cancelForm'){mCloseSheet(false);return;}if(id==='applyNative'){mCloseSheet(true);return;}
  if(id==='styles'){mCloseSheet(false);mFinish();stylePop(true);return;}
  if(id==='pages'){mPages();return;}
  if(id.startsWith('page:')){const i=Number(id.slice(5));mCloseSheet(false);mFinish();goSheet(i);render();return;}
  if(id==='pageRename'){mOpenSheet('分頁名稱',`<form id="mForm"><label class="m-field">名稱<input id="mPageName" maxlength="60" value="${esc(st.name||'')}" placeholder="例如：衣櫃立面"></label>${mFormButtons}</form>`,'pageRename');mobileUI.submit=()=>{pushP();st.name=$('#mPageName').value.trim().slice(0,60);mCloseSheet(true);};return;}
  if(id==='pageDuplicate'){mCloseSheet(false);mFinish();if(pj.sheets.length>=20){toast('最多 20 個分頁');return;}pushP();photoStash();const oldSid=st.sid,c=normalize(JSON.parse(JSON.stringify(st)));c.sid=newSid();c.name=(st.name||shName(pj.cur))+' 副本';pj.sheets.splice(pj.cur+1,0,c);const ph=photos.get(oldSid);if(ph)photos.set(c.sid,JSON.parse(JSON.stringify(ph)));goSheet(pj.cur+1);render();toast('分頁已複製');return;}
  if(id==='addpage'){mCloseSheet(false);mFinish();$('#shAdd').click();render();return;}
  if(id==='save'){mCloseSheet(false);$('#saveDo').click();return;}
  if(id==='saved'){mOpenSheet('我的圖面','<div id="mNative" class="m-native-host"></div>','saved');mNative('#list');await refreshList();return;}
  if(id==='exports'){mOpenSheet('匯出圖面','<div class="m-menu-grid">'+mGridButton('export:png','圖片 PNG','photo')+mGridButton('export:svg','向量 SVG','line')+mGridButton('export:dxf','CAD DXF','size')+'</div><p class="m-sheet-note">匯出目前這個分頁。DXF 以 ZIP 檔提供。</p>','exports');return;}
  if(id.startsWith('export:')){const b=document.querySelector('#expBtns [data-exp="'+id.split(':')[1]+'"]');mCloseSheet(false);if(b)b.click();return;}
  if(id==='preview'){mCloseSheet(false);mFinish();$('#pvBtn').click();return;}
  if(id==='grid'||id==='labels'){mCloseSheet(false);$('#'+(id==='grid'?'gridBtn':'lblBtn')).click();mFinish();return;}
  if(id==='backup'){await mBackup();return;}
  if(id==='restore'){$('#mImport').click();return;}
  if(id==='new'){mCloseSheet(false);mFinish();$('#fNew').click();render();return;}
  if(id==='toFree'){mCloseSheet(false);mFinish();$('#toFreeBtn').click();render();mFreeTools();return;}
  if(id==='freeTools'){mFreeTools();return;}
}

function mTap(q,el){
  mobileUI.lastPoint={...q};
  if(mobileUI.tool==='pen'||mobileUI.tool==='hl'){toast('在圖上拖動，就能畫出筆跡');return;}
  if(mobileUI.tool){if(mobileUI.tool==='text'){mTextAt(q);return;}if(!mobileUI.first){mobileUI.first=q;mobileUI.preview=mMakeAnn(mobileUI.tool,q,q);mSync();return;}mAnn(mMakeAnn(mobileUI.tool,mobileUI.first,q));return;}
  if(mobileUI.op){mOperationPoint(q);return;}
  mobileUI.face=null;mobileUI.hint=false;
  const dim=el&&el.closest&&el.closest('[data-d]');if(dim&&!isFree()){const key={...dim.dataset};mFinish();const fresh=[...svg.querySelectorAll('[data-d]')].find(e=>e.dataset.d===key.d&&e.dataset.dc===key.dc&&e.dataset.dp===key.dp&&e.dataset.ds===key.ds);if(fresh)openDim(fresh);return;}
  const grip=el?.closest?.('[data-h]');if(grip&&!isFree()){
    const d=grip.dataset,k=d.h;let t=null;
    if(k==='g')t={t:'l',g:{c:+d.c,p:+d.p,s:+d.s||0,i:+d.i},name:'層板'};
    else if(['w','h','k','c','r','p','s'].includes(k)){const h=k==='r'?{k,y:+d.y}:{k,c:d.c==null?undefined:+d.c,p:d.p==null?undefined:+d.p,i:d.i==null?undefined:+d.i};t={t:'l',h,name:{w:'總寬',h:'總高',k:'踢腳板上緣',c:'直向分隔線',r:'橫向分隔線',p:'橫向分隔線',s:'櫃內分隔線'}[k],sel:['p','s'].includes(k)?{c:h.c,p:k==='s'?h.p:h.i,s:k==='s'?h.i:0}:null};}
    if(t){mobileUI.fixedEdge=null;mode='edit';ucat='edit';asel=-1;mobileUI.target=t;pickTarget(t);return;}
  }
  const tol=9/inv().s;const a=CabinetDepth.annotationPick(st.ann,q,tol,aview(),annBox);if(a>=0){mode='mark';tool=null;sel=null;hsel=null;fsel=null;asel=a;mobileUI.target={name:ANN[st.ann[a].k]};render();return;}
  mode='edit';ucat='edit';tool=null;asel=-1;cur.on=true;esub='line';
  if(isFree()){fsel=CabinetDepth.freePick(st,freeFaces(st),q,tol);render();return;}
  const edge=q.y>=-tol&&q.y<=st.H+tol&&Math.abs(q.x)<=tol?'left':q.x>=-tol&&q.x<=st.W+tol&&Math.abs(q.y-st.H)<=tol?'bottom':null;
  if(edge){mFinish();mobileUI.fixedEdge=edge;render();return;}
  mobileUI.fixedEdge=null;let t=tgtAt(q,tol);
  if(!t.t&&st.kick>0&&q.x>0&&q.x<st.W&&q.y>=st.H-st.kick&&q.y<st.H)t={t:'l',h:{k:'k'},name:'踢腳板'};
  if(!t.t&&view==='in'){const c=locCell(q);if(c&&!c.s){if(multi){toast('多選請在櫃外選開放格與外抽');return;}mobileUI.returnView='in';setView('out');t=tgtAt(q,tol);}}
  t.k=null;
  if(multi){if(t.t==='c'){const k={c:t.key.c,p:t.key.p,s:t.key.s||0,k:null},i=msel.findIndex(x=>x.c===k.c&&x.p===k.p&&(x.s||0)===k.s);if(i>=0)msel.splice(i,1);else msel.push(k);render();}return;}
  mobileUI.target=t;if(!t.t){mFinish();return;}mSelectFace(q,t);pickTarget(t);
}
function mOnDown(e){
  if(bgCal||isFree()&&mode==='draw'&&mobileUI.freeDrawing)return;
  if(mobileUI.panel)return;
  if(mobileUI.nativeDrag){e.preventDefault();e.stopImmediatePropagation();return;}
  if(isFree()&&mode==='edit'&&e.target.closest?.('[data-fe],[data-h="f"]')){
    const before=snapS(),history=hist.slice(),future=fut.slice(),editNumber=edN,selection=fsel&&{...fsel};
    if(freeGrab(e)){mobileUI.nativeDrag=true;const done=ev=>{if(ev.pointerId!=null&&ev.pointerId!==e.pointerId)return;window.removeEventListener('pointerup',done);window.removeEventListener('pointercancel',done);mobileUI.nativeDrag=false;depthRuntime.previewing=false;if(ev.type==='pointercancel'){st=normalize(JSON.parse(before).s);pj.sheets[pj.cur]=st;hist=history;fut=future;edN=editNumber;fsel=selection;justDragged=false;render();}else saveDraft();};window.addEventListener('pointerup',done);window.addEventListener('pointercancel',done);e.stopImmediatePropagation();return;}
  }
  e.preventDefault();e.stopImmediatePropagation();flyStop();
  const p={x:e.clientX,y:e.clientY};mobileUI.pointers.set(e.pointerId,p);try{svg.setPointerCapture(e.pointerId)}catch(_){}
  if(mobileUI.pointers.size===2){const p=[...mobileUI.pointers.values()],mid={clientX:(p[0].x+p[1].x)/2,clientY:(p[0].y+p[1].y)/2};mobileUI.gesture={pinch:true,dist:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),z:zoom.z,anchor:pt(mid),moved:true};mobileUI.preview=null;mSync();return;}
  const q=pt(e);mobileUI.gesture={x:e.clientX,y:e.clientY,q,inv:inv(),cx:zoom.cx,cy:zoom.cy,moved:false,el:e.target,points:[[Math.round(q.x),Math.round(q.y)]]};
  if(mobileUI.op)mobileUI.op.grab={pointer:q,cursor:{...mCursorPoint()}};
}
function mOnMove(e){
  if(bgCal||isFree()&&mode==='draw'&&mobileUI.freeDrawing)return;
  if(!mobileUI.pointers.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();mobileUI.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const g=mobileUI.gesture;if(!g)return;
  if(g.pinch&&mobileUI.pointers.size===2){const p=[...mobileUI.pointers.values()],mx=(p[0].x+p[1].x)/2,my=(p[0].y+p[1].y)/2,z=g.z*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/Math.max(1,g.dist);zoomAt(z,g.anchor,mx,my);mPreview();return;}
  if(g.pinch)return;const moved=Math.hypot(e.clientX-g.x,e.clientY-g.y)>5;if(moved)g.moved=true;
  const q=pt(e);
  if(mobileUI.op){if(g.moved){const a=mobileUI.op.grab;mOperationPoint(a?{x:a.cursor.x+q.x-a.pointer.x,y:a.cursor.y+q.y-a.pointer.y}:q);}return;}
  if(mobileUI.tool){if(!g.moved)return;g.points.push([Math.round(q.x),Math.round(q.y)]);mobileUI.preview=mMakeAnn(mobileUI.tool,mobileUI.first||g.q,q,g.points);mPreview();return;}
  if(g.moved){const p=pt(e,g.inv);zoom.m=true;zoom.cx=g.cx+g.q.x-p.x;zoom.cy=g.cy+g.q.y-p.y;applyView();mPreview();}
}
function mOnUp(e){
  if(bgCal||isFree()&&mode==='draw'&&mobileUI.freeDrawing)return;
  if(!mobileUI.pointers.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();
  const g=mobileUI.gesture;mobileUI.pointers.delete(e.pointerId);try{svg.releasePointerCapture(e.pointerId)}catch(_){}
  if(!g)return;if(g.pinch){if(!mobileUI.pointers.size)mobileUI.gesture=null;return;}
  mobileUI.gesture=null;if(e.type==='pointercancel'){mobileUI.preview=null;mSync();return;}
  const q=pt(e);
  if(mobileUI.op){/* Relative dragging leaves the cursor fixed on a simple tap. */return;}
  if(mobileUI.tool&&g.moved){if(mobileUI.tool==='text'){mTextAt(q);return;}const a=mMakeAnn(mobileUI.tool,mobileUI.first||g.q,q,g.points);mAnn(a);return;}
  if(!g.moved){const el=document.elementFromPoint(e.clientX,e.clientY)||g.el;mTap(q,el);}
}
svg.addEventListener('pointerdown',mOnDown,{capture:true,passive:false});svg.addEventListener('pointermove',mOnMove,{capture:true,passive:false});svg.addEventListener('pointerup',mOnUp,{capture:true,passive:false});svg.addEventListener('pointercancel',mOnUp,{capture:true,passive:false});
svg.addEventListener('click',e=>{if(bgCal||isFree()&&mode==='draw'&&mobileUI.freeDrawing)return;e.preventDefault();e.stopImmediatePropagation();},{capture:true});
['touchstart','touchmove','touchend'].forEach(k=>svg.addEventListener(k,e=>{if(bgCal||isFree()&&mode==='draw'&&mobileUI.freeDrawing)return;e.preventDefault();e.stopImmediatePropagation();},{capture:true,passive:false}));
svg.addEventListener('wheel',e=>{if(mobileUI.panel)return;e.preventDefault();e.stopImmediatePropagation();zoomAt(zoom.z*Math.exp(-e.deltaY*.002),pt(e),e.clientX,e.clientY);mPreview();},{capture:true,passive:false});
mShell.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b){mRun(b.dataset.m).catch(()=>toast('操作沒有完成，請再試一次'));}});
$('#mSheetBody').addEventListener('submit',e=>{e.preventDefault();if(mobileUI.submit&&mFormValuesValid())mobileUI.submit();});
$('#mSheetBody').addEventListener('click',e=>{if(e.target.closest('[data-open],[data-add]'))queueMicrotask(()=>mCloseSheet(true));else if(e.target.closest('#bgCalBtn'))queueMicrotask(()=>{if(bgCal){mCloseSheet(false);render();toast('先把四個角對準，再按「輸入尺寸」');}});});
$('#mTitle').onclick=mMenuOpen;$('#mMenu').onclick=mMenuOpen;$('#mAdd').onclick=mAddOpen;
$('#mView').onclick=()=>{const next=view==='out'?'in':'out';mobileUI.returnView=null;mFinish();setView(next);mSync();};
$('#mDepth').onclick=()=>{mFinish();displaySettings.interiorView=displaySettings.interiorView==='depth'?'flat':'depth';try{localStorage.setItem('sc-mobile-display-v1',JSON.stringify(displaySettings))}catch(_){}othCache.clear();render();};
$('#mDismiss').onclick=mFinish;$('#mSheetClose').onclick=()=>mCloseSheet(false);$('#mScrim').onclick=()=>mCloseSheet(false);
$('#mUndo').onclick=()=>{mFinish();$('#undo').click();render();};$('#mRedo').onclick=()=>{mFinish();$('#redo').click();render();};
$('#mFit').onclick=()=>{mFinish();zoom.m=false;render();};
$('#mOperationCancel').onclick=mFinish;$('#mOperationConfirm').onclick=mConfirmOperation;$('#mOffset').addEventListener('change',e=>mOperationOffset(e.target.value));$('#mOffset').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();mOperationOffset(e.target.value);mConfirmOperation();}});
$('#mToolDone').onclick=()=>{if(bgCal)mPhoto();else mFinish();};
$('#mImport').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const d=JSON.parse(await f.text()),raw=d.project||d,p=mkProject(raw);if(!p.sheets.length)throw new Error('empty');mCloseSheet(false);mFinish();pushP();photos.clear();setProject(p);if(Array.isArray(d.photos)){const ids=new Set(p.sheets.map(x=>x.sid));d.photos.forEach(([sid,x])=>{if(!ids.has(sid)||!x)return;const valid=s=>typeof s==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/.test(s);photos.set(sid,{src:valid(x.src)?x.src:null,rect:valid(x.rect)?x.rect:null})});photoLoad();}render();saveNow();toast('已匯入 '+p.sheets.length+' 個分頁');}catch(_){toast('這個檔案不是可讀取的圖面備份');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(mobileUI.panel)mCloseSheet(false);else mFinish();}});
if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{if(!mobileUI.panel&&!mobileUI.op){portC=null;render();}});
// Stable public metadata for accessibility and future maintenance; no credentials.
mRulersInstall();
document.documentElement.setAttribute('data-theme','light');
document.documentElement.classList.add('mobile-canvas');
document.body.classList.remove('land');
render();
