/* Relative touch positioning and real-boundary measurements. Origin: outer left-bottom. */
const precision={step:5,side:'right',rulers:false,metric:{x:'netNear',y:'netFar'}};
try{const p=JSON.parse(localStorage.getItem('sc-mobile-precision-v1')||'{}');if([1,5,10].includes(p.step))precision.step=p.step;if(p.side==='left')precision.side='left';precision.rulers=p.rulers===true;if(p.metric&&typeof p.metric==='object')Object.assign(precision.metric,p.metric);}catch(_){}
function mPrecisionSave(){try{localStorage.setItem('sc-mobile-precision-v1',JSON.stringify(precision))}catch(_){} }
const preciseRow=document.createElement('div');preciseRow.id='mPrecision';
preciseRow.innerHTML='<div class="m-precision-options"><select id="mMeasure" aria-label="量測條件"></select><select id="mStep" aria-label="微調步距"><option value="1">1 mm</option><option value="5">5 mm</option><option value="10">10 mm</option></select><button id="mHand" aria-label="切換微調按鍵左右位置">換邊</button><button id="mRulerToggle" aria-label="顯示或隱藏輔助尺規">尺規</button></div><div id="mNudge" role="group" aria-label="精確微調"><button data-nudge="left" aria-label="向左微調">←</button><button data-nudge="up" aria-label="向上微調">↑</button><button data-nudge="down" aria-label="向下微調">↓</button><button data-nudge="right" aria-label="向右微調">→</button></div>';
$('#mOperation').insertBefore(preciseRow,$('.m-operation-fields'));
function mMeasureChoices(){
  const r=cpdTarget();if(!r||mobileUI.op?.kind!=='move')return[];
  const {m,tv}=r,T=st.T,axis=m.ax,choices=[],make=(id,label,sign,c,start,end,at)=>choices.push({id,label,sign,c,value:sign*tv+c,start,end,at,axis});
  make('position',axis==='x'?'距櫃左側':'離櫃底',axis==='x'?1:-1,axis==='x'?0:st.H,axis==='x'?0:st.H,tv,axis==='x'?(m.segs[0][1]+m.segs[0][3])/2:(m.segs[0][0]+m.segs[0][2])/2);
  if(m.a0!=null)make('local',axis==='x'?'左區寬（含板）':'上區高（含板）',1,m.a0-m.v,m.v-m.a0,tv,choices[0].at);
  if(m.t==='g'){
    const near=m.v-T/2-m.a0,far=m.v+T/2+m.b0;
    make('netNear','上方淨高',1,-near-T/2,near,tv-T/2,choices[0].at);
    make('netFar','下方淨高',-1,far-T/2,tv+T/2,far,choices[0].at);
  }else if(m.k==='c'){
    const i=hsel.i,a=st.cols[i],b=st.cols[i+1];
    // Locked intervening columns change another compartment, so do not offer a
    // misleading immediate-neighbor net width.
    if(!a.lock&&!b.lock){make('netNear','左側淨寬',1,a.w-m.v-2*T,m.v-a.w+T,tv-T,choices[0].at);make('netFar','右側淨寬',-1,b.w+m.v-2*T,tv+T,m.v+b.w-T,choices[0].at);}
  }else if(['p','r','s'].includes(m.k)){
    let ci=hsel.c;
    if(m.k==='r'){let xx=0;ci=st.cols.findIndex(c=>{const hit=(mobileUI.lastPoint?.x??0)>=xx&&(mobileUI.lastPoint?.x??0)<=xx+c.w;xx+=c.w;return hit});if(ci<0)ci=0;}
    const col=st.cols[ci],pi=m.k==='s'?hsel.p:m.k==='p'?hsel.i:col.parts.findIndex((p,i)=>Math.abs(col.parts.slice(0,i+1).reduce((s,a)=>s+a.h,0)-m.v)<.5);
    const list=m.k==='s'?col.parts[pi].ins:col.parts,i=m.k==='s'?hsel.i:pi;
    if(i>=0&&i<list.length-1){const a=list[i],b=list[i+1],shared=m.k==='s',nearThick=shared?(i?T/2:T):T,farThick=shared?(i+1<list.length-1?T/2:T):T,half=shared?T/2:T;
      const offset=st.cols.slice(0,ci).reduce((s,c)=>s+c.w,0),at=offset+col.w/2;
      make('netNear','上方淨高 · 第'+(ci+1)+'區',1,a.h-m.v-nearThick-half,m.v-a.h+nearThick,tv-half,at);
      make('netFar','下方淨高 · 第'+(ci+1)+'區',-1,b.h+m.v-farThick-half,tv+half,m.v+b.h-farThick,at);
    }
  }
  return choices.filter(a=>Number.isFinite(a.value));
}
function mActiveMeasure(){const c=mMeasureChoices();if(!c.length)return null;const axis=c[0].axis;return c.find(a=>a.id===precision.metric[axis])||c[0];}
const mLegacyOperationData=mOperationData,mLegacyOffset=mOperationOffset,mLegacySync=mOperationSync;
mOperationData=function(){const d=mLegacyOperationData(),a=mActiveMeasure();if(!d||!a)return d;return{...d,label:a.label,value:a.value,note:'以板材實際邊界量測 · '+(a.axis==='x'?'向右為 X 正向':'向上為 Y 正向')+' · 任意位置拖動微調'};};
mOperationOffset=function(raw){const a=mActiveMeasure();if(!a){mLegacyOffset(raw);return;}if(raw==null||!String(raw).trim()){mobileUI.invalidOffset=true;return;}const n=Number(raw);if(!Number.isFinite(n)||n<0){mobileUI.invalidOffset=true;toast('請輸入不小於 0 的尺寸');return;}const r=cpdTarget(),v=(n-a.c)/a.sign;if(v<r.m.lo-.01||v>r.m.hi+.01){mobileUI.invalidOffset=true;toast('此尺寸超出可移動範圍');mSync();return;}mOperationPoint(a.axis==='x'?{x:v,y:cur.y}:{x:cur.x,y:v});};
mOperationSync=function(){mLegacySync();const op=mobileUI.op;if(!op)return;const a=mActiveMeasure(),choices=mMeasureChoices(),select=$('#mMeasure');select.hidden=!choices.length;const sig=choices.map(x=>x.id+x.label).join('|');if(select.dataset.sig!==sig){select.dataset.sig=sig;select.innerHTML=choices.map(x=>'<option value="'+x.id+'">'+x.label+'</option>').join('');}if(a)select.value=a.id;
  $('#mStep').value=String(precision.step);$('#mNudge').classList.toggle('m-left-hand',precision.side==='left');$('#mRulerToggle').setAttribute('aria-pressed',precision.rulers);$('#mHand').textContent=precision.side==='left'?'移到右側':'移到左側';
  const axis=op.kind==='annmove'?'both':op.kind==='splitV'?'x':op.kind==='splitH'?'y':cpdTarget()?.m.ax;
  for(const b of $('#mNudge').querySelectorAll('button'))b.hidden=axis==='x'?['up','down'].includes(b.dataset.nudge):axis==='y'?['left','right'].includes(b.dataset.nudge):false;
};
$('#mMeasure').addEventListener('change',e=>{const a=mMeasureChoices().find(a=>a.id===e.target.value);if(a)precision.metric[a.axis]=a.id;mPrecisionSave();$('#mOffset').blur();mSync();});
$('#mStep').addEventListener('change',e=>{precision.step=Number(e.target.value);mPrecisionSave();});
$('#mHand').onclick=()=>{precision.side=precision.side==='left'?'right':'left';mPrecisionSave();mSync();};
$('#mRulerToggle').onclick=()=>{precision.rulers=!precision.rulers;mPrecisionSave();mSync();};
$('#mNudge').addEventListener('click',e=>{const k=e.target.closest('[data-nudge]')?.dataset.nudge,q=mCursorPoint();if(!k||!q)return;const d=precision.step;mOperationPoint({x:q.x+(k==='left'?-d:k==='right'?d:0),y:q.y+(k==='up'?-d:k==='down'?d:0)});});
function mPrecisionDraw(g){
  const q=mCursorPoint();if(!q||!mobileUI.op)return;const k=S/zoom.z,col=displaySettings.selectionColor,P=[],L=(x1,y1,x2,y2)=>P.push({t:'l',x1,y1,x2,y2,c:'an',col,lw:1.1*k}),txt=(x,y,s)=>P.push({t:'t',x,y,s,c:'ant',col,a:'middle',z:12*k});
  L(q.x-8*k,q.y,q.x+8*k,q.y);L(q.x,q.y-8*k,q.x,q.y+8*k);P.push({t:'e',cx:q.x,cy:q.y,rx:4*k,ry:4*k,c:'an',col,lw:1.2*k});
  L(0,st.H-18*k,0,st.H);L(0,st.H,18*k,st.H);txt(-8*k,st.H+15*k,'0');
  const a=mActiveMeasure();if(a){const at=a.at;if(a.axis==='x'){L(a.start,at,a.end,at);L(a.start,at-6*k,a.start,at+6*k);L(a.end,at-6*k,a.end,at+6*k);txt((a.start+a.end)/2,at-10*k,fmt(a.value)+' mm');}else{L(at,a.start,at,a.end);L(at-6*k,a.start,at+6*k,a.start);L(at-6*k,a.end,at+6*k,a.end);txt(at+28*k,(a.start+a.end)/2,fmt(a.value)+' mm');}}
  g.innerHTML+=toSVG(P,k,pal).art;
}
