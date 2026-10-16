(function(root){
  'use strict';
  const item=(id,label,icon,primary=false,danger=false)=>({id,label,icon,primary,danger});
  function actions(s){
    if(!s||s.busy)return[];
    if(s.kind==='annotation')return[item('move','移動','move',true),item('settings','設定','settings'),item('delete','刪除','trash',false,true)];
    if(s.kind==='line')return[
      ...(s.movable?[item('move','移動','move',true)]:[]),
      ...(s.dimensions!==false?[item('dimensions','尺寸','size',!s.movable)]:[]),
      ...(s.removable?[item('delete','刪除','trash',false,true)]:[])
    ];
    if(s.kind==='face')return[item('faceColor','配色','style',true),item('faceGroup','整組設定','settings')];
    if(s.kind==='cell')return[
      item('settings','尺寸與配置','settings',true),
      ...(s.splitV?[item('splitV','新增桶身','vertical')]:[]),
      ...(s.splitH?[item('splitH',s.interior?'新增固定層板':'新增上下分區','horizontal')]:[]),
      item('regionShelves','活動層板','horizontal'),
      item('regionBoards','板件清單','line'),
      item('multi','多選／合併／均分','multi'),
      item('regionFaces','門片／抽頭配色','style'),
      item('regionClear','清空配置','trash'),
      item('more','複製與其他','more')
    ];
    if(s.kind==='multi')return[
      ...(s.merge?[item('merge','合併','merge',true)]:[]),
      ...(s.evenWidth?[item('evenWidth','均分寬','vertical')]:[]),
      ...(s.evenHeight?[item('evenHeight','均分高','horizontal')]:[]),
      ...(s.more?[item('more','更多','more')]:[])
    ];
    if(s.kind==='freeLine')return[item('settings','尺寸／類型','settings',true),item('delete','刪除','trash',false,true)];
    if(s.kind==='freeCell')return[item('settings','格子設定','settings',true),item('delete','清空','trash',false,true)];
    return[];
  }
  function clampOffset(value,total,min=50){
    const n=Number(value);
    if(!Number.isFinite(n)||!Number.isFinite(total)||total<2*min)return null;
    return Math.min(total-min,Math.max(min,Math.round(n)));
  }
  function viewportMap(width,height,vb){
    const scale=Math.min(width/vb[2],height/vb[3]);
    return{scale,offsetX:(width-vb[2]*scale)/2,offsetY:(height-vb[3]*scale)/2,x:vb[0],y:vb[1]};
  }
  function worldToScreen(map,point){return{x:map.offsetX+(point.x-map.x)*map.scale,y:map.offsetY+(point.y-map.y)*map.scale};}
  function screenToWorld(map,point){return{x:map.x+(point.x-map.offsetX)/map.scale,y:map.y+(point.y-map.offsetY)/map.scale};}
  function rulerStep(units){const power=10**Math.floor(Math.log10(Math.max(units,1e-6))),n=units/power;return(n<=1?1:n<=2?2:n<=5?5:10)*power;}
  function mergeAllowed(st,view,cells){if(cells.length<2||cells.some(c=>c.k!=null))return false;const run=a=>a.every((v,i)=>i===0||v===a[i-1]+1),cols=[...new Set(cells.map(c=>c.c))].sort((a,b)=>a-b);
    if(view==='in')return cols.length===1&&new Set(cells.map(c=>c.p)).size===1&&run(cells.map(c=>c.s||0).sort((a,b)=>a-b));
    if(cols.length===1)return run(cells.map(c=>c.p).sort((a,b)=>a-b));
    return run(cols)&&cols.every(ci=>st.cols[ci]?.parts.every((p,pi)=>cells.some(c=>c.c===ci&&c.p===pi)));
  }
  const api={actions,mergeAllowed,clampOffset,viewportMap,worldToScreen,screenToWorld,rulerStep};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MobilePolicy=api;
})(typeof window!=='undefined'?window:this);
