/* Physical front gaps use millimeters; line stroke remains readable on a phone. */
const CabinetFaces=(()=>{
  function apply(g,st,o,p){
    if(st.kind==='free')return g;
    const gap=st.faceGap??4,extra=[];let x=0;
    if(o.view!=='in'&&gap>0&&!o.bare&&(!o.interactive||gap/(o.gridScale||o.S)>=1.2)){
      // Replace zero-width door/drawer seams with true face boundaries. Handles,
      // groove openings, selection hit areas and model partitions stay intact.
      const seams=[];
      const front=a=>a.t==='door'||a.t==='drawer';
      st.cols.forEach((c,ci)=>{let y=0;if(ci&&c.parts.every(front)&&st.cols[ci-1].parts.every(front))seams.push({x,y0:0,y1:st.H-st.kick});c.parts.forEach((a,pi)=>{if(a.t==='door'||a.t==='drawer'){
        if(pi&&front(c.parts[pi-1]))seams.push({y,x0:x,x1:x+c.w});
        const n=a.n;
        for(let i=0;i<n;i++){
          const vertical=a.t==='door',w=vertical?c.w/n:c.w,h=vertical?a.h:a.h/n;
          if(w>gap&&h>gap)extra.push({t:'r',x:x+(vertical?i*w:0)+gap/2,y:y+(vertical?0:i*h)+gap/2,w:w-gap,h:h-gap,c:'face-edge'});
          if(i)seams.push(vertical?{x:x+i*w,y0:y,y1:y+a.h}:{y:y+i*h,x0:x,x1:x+c.w});
        }
      }y+=a.h});x+=c.w});
      g.art=g.art.filter(a=>!(a.t==='l'&&a.c==='in'&&seams.some(s=>s.x!=null?Math.abs(a.x1-s.x)<.01&&Math.abs(a.x2-s.x)<.01&&a.y1===s.y0&&a.y2===s.y1:Math.abs(a.y1-s.y)<.01&&Math.abs(a.y2-s.y)<.01&&a.x1===s.x0&&a.x2===s.x1)));
    }
    if(st.kick>0&&(st.kickSetback??50)>0){const h=Math.min(st.kick*.2,12);extra.push({t:'r',x:0,y:st.H-st.kick,w:st.W,h,c:'toe-shade'});}
    // Place decorative fronts before selection diamonds and all dimension text.
    const at=g.art.findIndex(a=>a.t==='grip'||a.t==='t');g.art.splice(at<0?g.art.length:at,0,...extra);return g;
  }
  return{apply};
})();
if(typeof module!=='undefined')module.exports=CabinetFaces;
