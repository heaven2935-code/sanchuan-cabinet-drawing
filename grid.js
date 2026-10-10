/* Rectangular cabinet cells. Pure geometry; coordinates are millimetres. */
(function(root){
'use strict';
const EPS=.005, eq=(a,b)=>Math.abs(a-b)<EPS, round=n=>Math.round(n*100)/100;
const unique=values=>[...new Set(values.map(round))].sort((a,b)=>a-b);
const make=(x1,y1,x2,y2)=>({x1:round(x1),y1:round(y1),x2:round(x2),y2:round(y2)});
function fromLegacy(doc){
 const xs=unique([0,...doc.vertical.filter(x=>x>0&&x<doc.width),doc.width]), cells=[];
 for(let i=0;i<xs.length-1;i++){
  const a=xs[i],b=xs[i+1];
  const ys=unique([0,...doc.horizontal.filter(h=>h.y>0&&h.y<doc.height&&h.x1<b-EPS&&h.x2>a+EPS).map(h=>h.y),doc.height]);
  for(let j=0;j<ys.length-1;j++)cells.push(make(a,ys[j],b,ys[j+1]));
 }
 return cells;
}
function validate(cells,width,height){
 if(!Array.isArray(cells)||!cells.length||cells.length>1000)return false;
 let area=0;
 for(let i=0;i<cells.length;i++){
  const c=cells[i];
  if(!c||!['x1','x2','y1','y2'].every(k=>typeof c[k]==='number'&&Number.isFinite(c[k])))return false;
  if(c.x1<0||c.y1<0||c.x2>width+EPS||c.y2>height+EPS||c.x2-c.x1<.01||c.y2-c.y1<.01)return false;
  area+=(c.x2-c.x1)*(c.y2-c.y1);
  for(let j=0;j<i;j++){const d=cells[j];if(Math.min(c.x2,d.x2)-Math.max(c.x1,d.x1)>EPS&&Math.min(c.y2,d.y2)-Math.max(c.y1,d.y1)>EPS)return false;}
 }
 return Math.abs(area-width*height)<=Math.max(.01,width*height*1e-8);
}
function bounds(cells,axis){return unique(cells.flatMap(c=>axis==='x'?[c.x1,c.x2]:[c.y1,c.y2]));}
function lines(cells,width,height){
 const groups=new Map();
 const add=(axis,value,a,b)=>{const key=axis+':'+value;if(!groups.has(key))groups.set(key,{axis,value,intervals:[]});groups.get(key).intervals.push([a,b]);};
 for(const c of cells){
  if(c.x1>EPS)add('x',c.x1,c.y1,c.y2);if(c.x2<width-EPS)add('x',c.x2,c.y1,c.y2);
  if(c.y1>EPS)add('y',c.y1,c.x1,c.x2);if(c.y2<height-EPS)add('y',c.y2,c.x1,c.x2);
 }
 const result=[];
 for(const g of groups.values()){
  const parts=g.intervals.sort((a,b)=>a[0]-b[0]);let [a,b]=parts[0];
  for(let i=1;i<parts.length;i++){if(parts[i][0]<=b+EPS)b=Math.max(b,parts[i][1]);else{result.push({axis:g.axis,value:g.value,a,b});[a,b]=parts[i];}}
  result.push({axis:g.axis,value:g.value,a,b});
 }
 return result;
}
function at(cells,p){return cells.findIndex(c=>p.x>c.x1+EPS&&p.x<c.x2-EPS&&p.y>c.y1+EPS&&p.y<c.y2-EPS);}
function merge(cells,indices){
 const ids=[...new Set(indices)], selected=ids.map(i=>cells[i]);
 if(ids.length<2||selected.some(c=>!c))throw Error('請選取至少兩個相鄰儲存格');
 const box=make(Math.min(...selected.map(c=>c.x1)),Math.min(...selected.map(c=>c.y1)),Math.max(...selected.map(c=>c.x2)),Math.max(...selected.map(c=>c.y2)));
 const area=selected.reduce((sum,c)=>sum+(c.x2-c.x1)*(c.y2-c.y1),0);
 if(Math.abs(area-(box.x2-box.x1)*(box.y2-box.y1))>EPS)throw Error('合併範圍須為完整長方形，請補選缺少的格子');
 return [...cells.filter((_,i)=>!ids.includes(i)),box];
}
function split(cells,indices,axis,count=2){
 if(!indices.length)throw Error('請先選取儲存格');
 if(!Number.isInteger(count)||count<2||count>24)throw Error('拆分數量須為 2–24');
 if(cells.length+indices.length*(count-1)>1000)throw Error('儲存格數量上限為 1000');
 const ids=new Set(indices), result=[];
 cells.forEach((c,i)=>{
  if(!ids.has(i)){result.push({...c});return;}
  const start=axis==='x'?c.x1:c.y1,end=axis==='x'?c.x2:c.y2;
  if((end-start)/count<1)throw Error('每格尺寸至少 1 mm');
  for(let j=0;j<count;j++){let a=round(start+(end-start)*j/count),b=round(start+(end-start)*(j+1)/count);result.push(axis==='x'?make(a,c.y1,b,c.y2):make(c.x1,a,c.x2,b));}
 });return result;
}
function cut(cells,axis,value,indices){
 const ids=indices?new Set(indices):null,result=[];let changed=false;
 cells.forEach((c,i)=>{
  const start=axis==='x'?c.x1:c.y1,end=axis==='x'?c.x2:c.y2;
  if((!ids||ids.has(i))&&value>=start+1&&value<=end-1){changed=true;result.push(...(axis==='x'?[make(c.x1,c.y1,value,c.y2),make(value,c.y1,c.x2,c.y2)]:[make(c.x1,c.y1,c.x2,value),make(c.x1,value,c.x2,c.y2)]));}else result.push({...c});
 });if(!changed)throw Error('此位置沒有可分割的儲存格');if(result.length>1000)throw Error('儲存格數量上限為 1000');return result;
}
function limits(cells,axis,value){const cuts=bounds(cells,axis),i=cuts.findIndex(n=>eq(n,value));if(i<=0)return null;return {min:cuts[i-1]+1,max:i===cuts.length-1?30000:cuts[i+1]-1};}
function move(cells,axis,value,next,width,height){
 const range=limits(cells,axis,value);next=round(next);
 if(!range||!Number.isFinite(next)||next<range.min||next>range.max)throw Error('尺寸超出相鄰分隔線範圍');
 const end=axis==='x'?width:height,newWidth=axis==='x'&&eq(value,end)?next:width,newHeight=axis==='y'&&eq(value,end)?next:height;
 if(newWidth<100||newHeight<100||newWidth>30000||newHeight>30000)throw Error('櫃體寬高須為 100–30000 mm');
 const keys=axis==='x'?['x1','x2']:['y1','y2'];
 const result=cells.map(c=>{let d={...c};for(const k of keys)if(eq(d[k],value))d[k]=next;return d;});
 if(!validate(result,newWidth,newHeight))throw Error('此調整會造成儲存格重疊');
 return {cells:result,width:newWidth,height:newHeight};
}
const api={fromLegacy,validate,bounds,lines,at,merge,split,cut,move,limits,eq};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.CabinetGrid=api;
})(typeof window!=='undefined'?window:globalThis);
