/* Device display preferences, independent of cabinet geometry and saved dimensions. */
const DisplayStyle=(()=>{
  const defaults=Object.freeze({theme:'light',lineColor:'#203038',doorSwing:false,dimensions:false,names:false,gridStyle:'lines',gridSize:100,gridColor:'#8a9aa3',selectionColor:'#e5822d',dimensionColor:'#465c68',rulerSide:'right'});
  const color=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(v||'')?v.toLowerCase():fallback;
  const themeColors=theme=>theme==='dark'?{lineColor:'#dce6ec',gridColor:'#718592',dimensionColor:'#b8cbd6'}:{lineColor:defaults.lineColor,gridColor:defaults.gridColor,dimensionColor:defaults.dimensionColor};
  function normalize(raw={}){raw=raw&&typeof raw==='object'?raw:{};const n=Number(raw.gridSize),theme=raw.theme==='dark'?'dark':'light',base=themeColors(theme);return{theme,lineColor:color(raw.lineColor,base.lineColor),doorSwing:raw.doorSwing===true,dimensions:raw.dimensions===true,names:raw.names===true,gridStyle:['lines','dots','none'].includes(raw.gridStyle)?raw.gridStyle:defaults.gridStyle,gridSize:Number.isFinite(n)?Math.max(10,Math.min(1000,Math.round(n))):defaults.gridSize,gridColor:color(raw.gridColor,base.gridColor),selectionColor:color(raw.selectionColor,defaults.selectionColor),dimensionColor:color(raw.dimensionColor,base.dimensionColor),rulerSide:raw.rulerSide==='left'?'left':'right'};}
  function themeChange(p,theme,values){const old=themeColors(p.theme),next=themeColors(theme),out={...values,theme};for(const key of ['lineColor','gridColor','dimensionColor'])if(values[key]===old[key])out[key]=next[key];return normalize(out);}
  function palette(p,pal){return{...pal,ink:p.lineColor,...(p.theme==='dark'?{sheet:'#151f27',tint:'#202e38',mute:'#8b9fab',sub:'#b8cbd6'}:{})};}
  function segment(st,h){
    const body=st.H-st.kick,xs=[0];st.cols.forEach(c=>xs.push(xs.at(-1)+c.w));
    if(h.ax==='x')return{x1:h.v,y1:0,x2:h.v,y2:h.k==='w'?st.H:body};
    if(h.k==='p'||h.k==='s')return{x1:xs[h.c],y1:h.v,x2:xs[h.c+1],y2:h.v};
    if(h.k==='r'){
      const ranges=[];st.cols.forEach((c,i)=>{let y=0;const hit=c.parts.slice(0,-1).some(p=>{y+=p.h;return Math.abs(y-h.v)<.5});if(hit){const last=ranges.at(-1);if(last&&last[1]===xs[i])last[1]=xs[i+1];else ranges.push([xs[i],xs[i+1]])}});
      const range=ranges.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0]||[0,st.W];return{x1:range[0],y1:h.v,x2:range[1],y2:h.v};
    }
    return{x1:0,y1:h.v,x2:st.W,y2:h.v};
  }
  function handles(st,H,p){return H.map(h=>{if(h.fixed)return h;const s=segment(st,h);return{...h,col:p.selectionColor,gx:(s.x1+s.x2)/2,gy:(s.y1+s.y2)/2}});}
  function grid(st,o,p){
    if(p.gridStyle==='none'||o.nogrid||o.nog||o.bare)return[];
    const fs=11*o.S,b=o.box||[-5*fs,-(o.top||4.2)*fs,st.W+6.8*fs,st.H+6*fs],scale=o.gridScale||o.S;
    // Keep the specified spacing for snapping; simplify only dense visual ticks.
    const gr=p.gridSize*Math.max(1,Math.ceil(5*scale/p.gridSize),Math.ceil(Math.max(b[2]-b[0],b[3]-b[1])/(400*p.gridSize))),P=[];
    if(p.gridStyle==='dots'){
      const step=gr*Math.max(1,Math.ceil(Math.sqrt((b[2]-b[0])*(b[3]-b[1])/(10000*gr*gr))));
      for(let x=Math.ceil(b[0]/step)*step;x<=b[2];x+=step)for(let z=Math.ceil((st.H-b[3])/step)*step;z<=st.H-b[1];z+=step)P.push({t:'e',cx:x,cy:st.H-z,rx:.8*scale,ry:.8*scale,c:'gDot'});
    }else{
      const major=gr*5;for(let x=Math.ceil(b[0]/gr)*gr;x<=b[2];x+=gr)P.push({t:'l',x1:x,y1:b[1],x2:x,y2:b[3],c:Math.abs(x/major-Math.round(x/major))<1e-6?'gD':'gd'});
      for(let z=Math.ceil((st.H-b[3])/gr)*gr;z<=st.H-b[1];z+=gr)P.push({t:'l',x1:b[0],y1:st.H-z,x2:b[2],y2:st.H-z,c:Math.abs(z/major-Math.round(z/major))<1e-6?'gD':'gd'});
    }return P;
  }
  function decorate(g,st,o,p,H=[]){
    let art=g.art.filter(q=>!q.doorSwing||p.doorSwing).filter(q=>!(q.c==='dm'||q.c==='dim')||p.dimensions||!!(q.hc||q.col));
    art=art.map(q=>q.c==='dm'?{...q,z:q.hc?q.z:q.z*1.25,hc:q.hc?p.selectionColor:p.dimensionColor}:q.c==='dim'?{...q,col:q.col?p.selectionColor:p.dimensionColor}:q.c==='grip'?{...q,col:p.selectionColor}:q);
    const ui=p.dimensions?g.ui:g.ui.filter(q=>q.t!=='hd');
    const selected=H.filter(h=>!h.fixed&&o.hsel&&h.k===o.hsel.k&&(h.k==='r'?Math.abs(h.v-o.hsel.y)<.5:h.k==='c'?h.i===o.hsel.i:h.k==='p'||h.k==='s'?h.c===o.hsel.c&&h.i===o.hsel.i&&(h.k==='p'||h.p===o.hsel.p):true));
    selected.forEach(h=>art.push({t:'l',...segment(st,h),c:'an',col:p.selectionColor,lw:2.4*o.S}));
    // Draw selection strokes behind their centered diamond.
    const grips=art.filter(q=>q.t==='grip');art=art.filter(q=>q.t!=='grip');
    if(st.kind==='free'&&o.fsel?.k==='l'&&st.ln[o.fsel.i]){const l=st.ln[o.fsel.i];grips.length=0;grips.push({t:'grip',x:(l.x1+l.x2)/2,y:st.H-(l.z1+l.z2)/2,on:true,col:p.selectionColor});}
    if(o.sel?.g!=null&&st.kind!=='free'){grips.length=0;const l=art.find(q=>q.c==='an'&&q.t==='l');if(l){l.col=p.selectionColor;l.lw=2.4*o.S;grips.push({t:'grip',x:(l.x1+l.x2)/2,y:(l.y1+l.y2)/2,on:true,col:p.selectionColor});}}
    const background=grid(st,o,p),idx=art.findIndex(q=>!['img','wl','wlf','f-door','f-open','f-drawer','f-blank'].includes(q.c)&&q.t!=='img');
    art.splice(idx<0?art.length:idx,0,...background);art.push(...grips);return{art,ui};
  }
  function rails(W,H,safe,side){const width=34,bottom=36,left=side==='left',x0=left?width:0,x1=left?W:W-width;return{left,width,bottom,x0,x1,y:H-safe-bottom,railX:left?0:x1,borderX:left?width:x1};}
  return{defaults,normalize,themeColors,themeChange,palette,segment,handles,grid,decorate,rails};
})();
if(typeof module!=='undefined')module.exports=DisplayStyle;
