/* Fixed-view cabinet interior illustration; front elevations remain the editable geometry. */
const CabinetDepth=(()=>{
  const point=(p,st)=>({x:p.x*.88+st.W*.12/2,y:p.y*.88+(st.H-st.kick)*.12*.46});
  function clip(poly,r){let out=poly;for(const [axis,edge,sign]of [['x',r.x,1],['x',r.x+r.w,-1],['y',r.y,1],['y',r.y+r.h,-1]]){const next=[];for(let i=0;i<out.length;i++){const a=out[i],b=out[(i+1)%out.length],ia=sign*(a[axis]-edge)>=-1e-8,ib=sign*(b[axis]-edge)>=-1e-8;if(ia)next.push(a);if(ia!==ib){const t=(edge-a[axis])/(b[axis]-a[axis]);next.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)})}}out=next;if(!out.length)break;}return out;}
  function regions(st,gaps){const R=[],T=st.T||18;let x=0;st.cols.forEach((c,ci)=>{let y=0;c.parts.forEach((p,pi)=>{
    const add=(s,top,bot,si)=>{if(c.w<=4*T||bot<=top)return;const r={x:x+T,y:top,w:c.w-2*T,h:bot-top,ci,pi,si,type:s.t};
      if((s.t==='shelf'||s.t==='open')&&s.n>0&&r.h>s.n*T+(s.n+1)*10){let sy=top;gaps(s,r.h,T).forEach((h,k)=>{if(h>0)R.push({...r,y:sy,h,layer:k});sy+=h+T})}else R.push(r);
    };
    if(p.t==='door'&&p.ins&&c.w>4*T&&p.h>4*T){let sy=y;p.ins.forEach((s,si)=>{add(s,si?sy+T/2:y+T,si<p.ins.length-1?sy+s.h-T/2:y+p.h-T,si);sy+=s.h})}
    else if(p.t==='open'&&p.h>4*T)add(p,y+T,y+p.h-T,null);
    y+=p.h});x+=c.w});return R;}
  function art(st,gaps){const P=[];for(const r of regions(st,gaps)){
    const F=[{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x+r.w,y:r.y+r.h},{x:r.x,y:r.y+r.h}],B=F.map(p=>point(p,st)),face=(pts,c)=>{const q=clip(pts,r);if(q.length>=3)P.push({t:'p',close:true,pts:q.map(p=>[p.x,p.y]),c,depth:true})};
    face(B,'depth-back');[['depth-left',0,3],['depth-right',1,2],['depth-top',0,1],['depth-bottom',3,2]].forEach(([c,a,b])=>face([F[a],F[b],B[b],B[a]],c));
  }return P;}
  function apply(g,st,o,p,runtime,gaps){
    if(st.kind!=='free'&&o.view==='in'&&p.interiorView==='depth'&&!o.nogrid&&!o.bare&&!runtime.editing){
      const i=g.art.findIndex(q=>['out','in','thin','hd','an','sel'].includes(q.c));g.art.splice(i<0?g.art.length:i,0,...art(st,gaps));
    }
    if(o.interactive&&runtime.fixedEdge){const bottom=runtime.fixedEdge==='bottom',col=p.selectionColor,S=o.S;
      g.art.push({t:'l',x1:0,y1:bottom?st.H:0,x2:bottom?st.W:0,y2:st.H,c:'an',col,lw:2.4*S},{t:'grip',x:bottom?st.W/2:0,y:bottom?st.H:st.H/2,col,on:true});
    }
    return g;
  }
  const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};
  function freePick(st,faces,p,tol){let best=null,d=tol;st.ln.forEach((l,i)=>{const a={x:l.x1,y:st.H-l.z1},b={x:l.x2,y:st.H-l.z2},n=distance(p,a,b);if(n<d){d=n;best={k:'l',i}}});if(best)return best;const f=faces.find(f=>p.x>f.x1&&p.x<f.x2&&st.H-p.y>f.z1&&st.H-p.y<f.z2);return f?{k:'c',x:(f.x1+f.x2)/2,z:(f.z1+f.z2)/2}:null;}
  function annotationPick(list,p,tol,view,boxOf){for(let i=list.length-1;i>=0;i--){const a=list[i];if((a.v||'out')!==view)continue;
    if(['line','arrow','dim'].includes(a.k)){if(distance(p,{x:a.x1,y:a.y1},{x:a.x2,y:a.y2})<=tol)return i;}
    else if(a.k==='rect'){const x1=Math.min(a.x1,a.x2),x2=Math.max(a.x1,a.x2),y1=Math.min(a.y1,a.y2),y2=Math.max(a.y1,a.y2),corners=[{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2}];if(corners.some((c,j)=>distance(p,c,corners[(j+1)%4])<=tol))return i;}
    else if(a.k==='circle'){const rx=Math.abs(a.x2-a.x1)/2,ry=Math.abs(a.y2-a.y1)/2;if(rx>0&&ry>0){const n=Math.hypot((p.x-(a.x1+a.x2)/2)/rx,(p.y-(a.y1+a.y2)/2)/ry);if(Math.abs(n-1)*Math.min(rx,ry)<=tol)return i;}}
    else if(a.k==='pen'||a.k==='hl'){const pts=a.pts||[],reach=tol+(a.lw||0)/2;if(pts.some((q,j)=>j?distance(p,{x:pts[j-1][0],y:pts[j-1][1]},{x:q[0],y:q[1]})<=reach:Math.hypot(p.x-q[0],p.y-q[1])<=reach))return i;}
    else if(a.k==='text'){const b=boxOf(i);if(b&&p.x>=b.x-tol&&p.x<=b.x+b.w+tol&&p.y>=b.y-tol&&p.y<=b.y+b.h+tol)return i;}
  }return-1;}
  return{point,clip,regions,art,apply,distance,freePick,annotationPick};
})();
if(typeof module!=='undefined')module.exports=CabinetDepth;
