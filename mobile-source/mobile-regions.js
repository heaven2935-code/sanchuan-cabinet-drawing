/* Region-first cabinet controls. Structural edits still use the engine's history. */
const mRegionTapBase=mTap;
mTap=function(q,el){
  if(isFree()||mobileUI.tool||mobileUI.op||mobileUI.voiceActive||voiceUI.picking||mobileUI.regionLinePick||el?.closest?.('[data-d]'))return mRegionTapBase(q,el);
  let c=locCell(q);
  if(!c)return mRegionTapBase(q,el);
  // Annotations remain independently selectable; the cabinet underneath is unchanged.
  if(CabinetDepth.annotationPick(st.ann,q,9/inv().s,aview(),annBox)>=0)return mRegionTapBase(q,el);
  if(view==='in'&&!c.s){if(multi){toast('此區請切換櫃外編輯');return;}mobileUI.returnView='in';setView('out');c=locCell(q);}
  const key={c:c.ci,p:c.pi,s:c.si||0};
  mobileUI.lastPoint={...q};mobileUI.face=null;mobileUI.fixedEdge=null;mobileUI.hint=false;asel=-1;mode='edit';ucat='edit';
  if(multi){const i=msel.findIndex(a=>a.c===key.c&&a.p===key.p&&(a.s||0)===key.s);if(i<0)msel.push(key);else msel.splice(i,1);render();return;}
  const t={t:'c',c,key,k:null};mobileUI.target=t;pickTarget(t);
};
const mRegionSyncBase=mSync;
mSync=function(){mRegionSyncBase();$('#mContext').classList.toggle('m-region-context',!mobileUI.panel&&!mobileUI.op&&!multi&&!!selObj()&&!hsel&&sel?.g==null&&!mobileUI.face);};
function mRegionBoards(){
  const o=selObj();if(!o)return;const c=sel.c,p=sel.p,s=sel.s||0,T=st.T,rows=[];
  const board=(key,label,note)=>rows.push(mRow('regionBoard:'+key,label,'horizontal',note));
  if(c>0)board('left','左側雙側板',T+' + '+T+' = '+(2*T)+' mm');
  if(c<st.cols.length-1)board('right','右側雙側板',T+' + '+T+' = '+(2*T)+' mm');
  const L=view==='in'?o.p.ins:o.col.parts,i=view==='in'?s:p;
  if(i>0)board('top','上方固定分隔',view==='in'?T+' mm':'上下桶身頂底板');
  if(i<L.length-1)board('bottom','下方固定分隔',view==='in'?T+' mm':'上下桶身頂底板');
  const sc=shelfCtx(o);if(sc)for(let j=0;j<sc.x.n;j++)board('shelf:'+j,'活動層板 '+(j+1),T+' mm · 可移動／刪除');
  mOpenSheet('這個區域的板件',rows.join('')+mRow('regionPickLine','切換精準選線','line')+'<p class="m-sheet-note">左右外側板各 '+T+' mm；相鄰桶身各有一片側板，合計 '+(2*T)+' mm，圖上保留中間接縫。櫃內固定分隔為單片 '+T+' mm。點清單即可調整板件，無須點中細線。</p>','regionBoards');
}
function mRegionBoard(key){
  const o=selObj();if(!o)return;const c=sel.c,p=sel.p,s=sel.s||0;let t;
  if(key.startsWith('shelf:'))t={t:'l',g:{c,p,s,i:Number(key.split(':')[1])},name:'活動層板'};
  else if(key==='left'||key==='right')t={t:'l',h:{k:'c',i:key==='left'?c-1:c},name:'雙側板 · '+(2*st.T)+' mm'};
  else{const i=(view==='in'?s:p)-(key==='top'?1:0);t={t:'l',h:view==='in'?{k:'s',c,p,i}:{k:'p',c,i},sel:{c,p:view==='in'?p:i,s:view==='in'?i:0},name:view==='in'?'固定層板':'桶身頂底分隔'};}
  mCloseSheet(false);mobileUI.target=t;pickTarget(t);
}
function mRegionShelves(){
  const o=selObj();if(!o)return;const x=view==='in'?o.s:o.p,kind=view==='in'?'shelf':'open',same=x.t===kind;
  mOpenSheet('活動層板',`<form id="mForm">${mField('mShelfCount','活動層板片數',same?x.n:1,0,10)}<p class="m-sheet-note">${same?'修改片數會重新分配層板間距。':'套用會取代此區原有的門片、抽屜或配件；門後層板請切換「櫃內」再設定。'}活動層板以識別色顯示，預覽與匯出使用正常線色。</p>${mFormButtons}</form>`,'regionShelves');
  mobileUI.submit=()=>{const n=Number($('#mShelfCount').value);mTransaction(()=>{if(x.t!==kind)act('type',kind);fieldChange('n',n);});mCloseSheet(true);};
}
function mRegionFaces(){
  const o=selObj();if(!o)return;const faces=view==='out'?FaceColor.panels(st).filter(f=>f.c===sel.c&&f.p===sel.p):[];
  mOpenSheet('門片與抽屜頭配色',faces.length?faces.map(f=>mRow('regionFace:'+f.i,mFaceTitle(f),'style',f.color||'預設色')).join(''):'<p class="m-sheet-note">此區沒有外部門片或抽屜頭。請先在「尺寸與配置」新增門片或抽屜，或切換到櫃外。</p>','regionFaces');
}
const mRegionRunBase=mRun;
mRun=async function(id){
  if(id==='regionPickLine'){mCloseSheet(false);mobileUI.regionLinePick=true;toast('點選要調整的板線；取消選取後回到區域編輯');return;}
  if(id==='regionBoards'){mRegionBoards();return;}
  if(id.startsWith('regionBoard:')){mRegionBoard(id.slice(12));return;}
  if(id==='regionShelves'){mRegionShelves();return;}
  if(id==='regionFaces'){mRegionFaces();return;}
  if(id.startsWith('regionFace:')){const i=Number(id.split(':')[1]);if(!sel)return;mobileUI.face={c:sel.c,p:sel.p,i};mCloseSheet(false);render();return;}
  if(id==='regionClear'){mOpenSheet('清空這個區域',mRow('regionClearConfirm','清空配置，保留桶身分隔','trash')+'<p class="m-sheet-note">移除這個區域的門片、抽屜或內部配件。若要移除結構分隔，請使用「板件清單」或多選相鄰區域後「合併」。可用復原還原。</p>','regionClear');return;}
  if(id==='regionClearConfirm'){mCloseSheet(false);act('clear');mFinish();return;}
  return mRegionRunBase(id);
};
