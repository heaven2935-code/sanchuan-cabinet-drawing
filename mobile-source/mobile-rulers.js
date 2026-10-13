/* Edge rulers share the SVG's world-coordinate transform and current operation. */
function mCursorPoint(){const op=mobileUI.op;return op?.kind==='annmove'?op.railPoint:op?{x:cur.x,y:cur.y}:null;}
function mRulerMap(){const rect=svg.getBoundingClientRect();return{rect,map:MobilePolicy.viewportMap(rect.width,rect.height,vbNow||fullVB)};}
function mRulersInstall(){
  const root=document.createElement('div');root.id='mRulers';root.hidden=true;
  root.innerHTML='<svg id="mRulerArt" aria-hidden="true"></svg><div id="mRailX" class="m-axis-track" data-rail="x" aria-label="X 軸尺軌"><button id="mRailXM" class="m-axis-marker m-x-marker" data-rail="x" role="slider" aria-orientation="horizontal" aria-label="X 軸準星位置，左右拖動，單位公釐" tabindex="0"><span>X</span><b></b></button></div><div id="mRailY" class="m-axis-track" data-rail="y" aria-label="Y 軸尺軌"><button id="mRailYM" class="m-axis-marker m-y-marker" data-rail="y" role="slider" aria-orientation="vertical" aria-label="Y 軸準星高度，上下拖動，單位公釐" tabindex="0"><span>Y</span><b></b></button></div><div id="mRailCorner" aria-hidden="true">mm</div><div id="mRailSafe"></div>';
  mShell.appendChild(root);mobileUI.rulerRoot=root;mobileUI.railDrags=new Map();
  const update=e=>{
    const drag=mobileUI.railDrags.get(e.pointerId),q=mCursorPoint();if(!drag||!q)return;
    const {rect,map}=mRulerMap(),p=MobilePolicy.worldToScreen(map,q);
    if(drag.axis==='x')p.x=e.clientX-rect.left-drag.offset;else p.y=e.clientY-rect.top-drag.offset;
    const next=MobilePolicy.screenToWorld(map,p);mOperationPoint(next);
  };
  root.addEventListener('pointerdown',e=>{
    const el=e.target.closest('[data-rail]'),q=mCursorPoint();if(!el||!q)return;e.preventDefault();e.stopPropagation();
    const axis=el.dataset.rail,{rect,map}=mRulerMap(),p=MobilePolicy.worldToScreen(map,q),isThumb=!!e.target.closest('.m-axis-marker');
    const offset=isThumb?(axis==='x'?e.clientX-rect.left-p.x:e.clientY-rect.top-p.y):0;
    mobileUI.railDrags.set(e.pointerId,{axis,offset});try{root.setPointerCapture(e.pointerId)}catch(_){}
    if(!isThumb)update(e);
  },{passive:false});
  root.addEventListener('pointermove',e=>{if(!mobileUI.railDrags.has(e.pointerId))return;e.preventDefault();e.stopPropagation();update(e);},{passive:false});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>root.addEventListener(type,e=>{mobileUI.railDrags.delete(e.pointerId);try{if(root.hasPointerCapture(e.pointerId))root.releasePointerCapture(e.pointerId)}catch(_){};}));
  root.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  root.addEventListener('keydown',e=>{
    const el=e.target.closest('.m-axis-marker'),q=mCursorPoint();if(!el||!q||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();const d=e.shiftKey?10:1,positive=e.key==='ArrowRight'||e.key==='ArrowUp';
    mOperationPoint(el.dataset.rail==='x'?{x:q.x+(positive?d:-d),y:q.y}:{x:q.x,y:q.y+(positive?-d:d)});
  });
}
function mRulersSync(){
  const root=mobileUI.rulerRoot;if(!root)return;const q=mCursorPoint(),on=!!q&&!mobileUI.panel&&!!vbNow;
  root.hidden=!on;mShell.classList.toggle('has-rulers',on);if(!on){mobileUI.railDrags.clear();return;}
  const {rect,map}=mRulerMap();if(!rect.width||!rect.height)return;
  root.style.left=rect.left+'px';root.style.top=rect.top+'px';root.style.width=rect.width+'px';root.style.height=rect.height+'px';
  const safe=$('#mRailSafe').getBoundingClientRect().height,W=rect.width,H=rect.height,R=DisplayStyle.rails(W,H,safe,displaySettings.rulerSide),{left,width:right,bottom,x0,x1,railX,borderX}=R,Y=R.y,p=MobilePolicy.worldToScreen(map,q),tick=MobilePolicy.rulerStep(64/map.scale),minor=tick/5;
  root.classList.toggle('m-rulers-left',left);
  const xTrack=$('#mRailX'),yTrack=$('#mRailY');xTrack.style.cssText=`left:${x0}px;top:${Y}px;width:${x1-x0}px;height:${bottom}px`;yTrack.style.cssText=`left:${railX}px;top:0;width:${right}px;height:${Y}px`;
  $('#mRailCorner').style.cssText=`left:${railX}px;top:${Y}px;width:${right}px;height:${bottom}px`;
  const f=n=>Math.round(n*10)/10,tx=(x,y,text,anchor='middle')=>`<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" fill="#7b949e" font-size="9" font-family="ui-monospace,monospace">${text}</text>`,line=(x1,y1,x2,y2,c='#b3c7cf',dash='')=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="1"${dash?' stroke-dasharray="'+dash+'"':''}/>`;
  let art=`<rect x="0" y="${Y}" width="${W}" height="${bottom+safe}" fill="#f5f9fa"/><rect x="${railX}" y="0" width="${right}" height="${Y}" fill="#f5f9fa"/>`+line(0,Y,W,Y,'#d8e5e9')+line(borderX,0,borderX,Y,'#d8e5e9');
  const lo=MobilePolicy.screenToWorld(map,{x:x0,y:0}),hi=MobilePolicy.screenToWorld(map,{x:x1,y:Y});
  const major=v=>Math.abs(v/tick-Math.round(v/tick))<1e-5,label=v=>Math.abs(v)<.00001?'0':String(Math.round(v*1000)/1000);
  for(let n=Math.ceil(lo.x/minor);n*minor<=hi.x&&n<Math.ceil(lo.x/minor)+300;n++){const v=n*minor,x=MobilePolicy.worldToScreen(map,{x:v,y:0}).x,m=major(v);art+=line(x,Y,x,Y+(m?9:4));if(m&&x>x0+18&&x<x1-20)art+=tx(x,Y+24,label(v));}
  const yLow=st.H-hi.y,yHigh=st.H-lo.y;
  for(let n=Math.ceil(yLow/minor);n*minor<=yHigh&&n<Math.ceil(yLow/minor)+300;n++){const v=n*minor,y=MobilePolicy.worldToScreen(map,{x:0,y:st.H-v}).y,m=major(v),txY=railX+(left?11:23);art+=line(borderX,y,borderX+(left?-1:1)*(m?9:4),y);if(m&&y>18&&y<Y-20)art+=`<text x="${f(txY)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 ${f(txY)} ${f(y)})" fill="#7b949e" font-size="9" font-family="ui-monospace,monospace">${label(v)}</text>`;}
  const inX=p.x>=x0&&p.x<=x1,inY=p.y>=0&&p.y<=Y;
  if(inX)art+=line(p.x,0,p.x,Y+8,'#2b9baa','5 4');if(inY)art+=line(left?x0-8:0,p.y,left?W:x1+8,p.y,'#2b9baa','5 4');
  if(inX&&inY)art+=`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="5" fill="#fff" stroke="#147c88" stroke-width="1.5"/><circle cx="${f(p.x)}" cy="${f(p.y)}" r="1.5" fill="#147c88"/>`;
  const artNode=$('#mRulerArt');artNode.setAttribute('viewBox',`0 0 ${W} ${H}`);artNode.innerHTML=art;
  const mx=$('#mRailXM'),my=$('#mRailYM'),px=clamp(p.x-x0,2,x1-x0-2),py=clamp(p.y,2,Y-2),markerLeft=clamp(px-40,2,Math.max(2,x1-x0-82)),top=clamp(py-22,2,Math.max(2,Y-46));
  mx.style.left=markerLeft+'px';mx.style.setProperty('--pin-x',(px-markerLeft)+'px');my.style.top=top+'px';my.style.setProperty('--pin-y',(py-top)+'px');
  const vx=Math.round(q.x),vy=Math.round(st.H-q.y);mx.querySelector('b').textContent=vx;my.querySelector('b').textContent=vy;
  [[mx,vx,0,st.W],[my,vy,0,st.H]].forEach(([el,v,min,max])=>{el.setAttribute('aria-valuenow',v);el.setAttribute('aria-valuemin',Math.min(min,v));el.setAttribute('aria-valuemax',Math.max(max,v));el.setAttribute('aria-valuetext',v+' 公釐');});
}
