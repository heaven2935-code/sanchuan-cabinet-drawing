/* Saved per-front finishes. Pure geometry and strict colors; no image assets yet. */
const FaceColor=(()=>{
  const valid=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
  function colors(p){const n=p.t==='door'?Math.min(2,p.n):p.t==='drawer'?Math.min(10,p.n):0;return Array.from({length:n},(_,i)=>valid(p.frontColors?.[i])?p.frontColors[i].toLowerCase():null);}
  function clean(st){if(st.kind==='free')return st;for(const c of st.cols)for(const p of c.parts){const a=colors(p);if(a.some(Boolean))p.frontColors=a;else delete p.frontColors;}return st;}
  function panels(st){const out=[];if(st.kind==='free')return out;const gap=st.faceGap??4;let x=0;st.cols.forEach((c,ci)=>{let y=0;c.parts.forEach((p,pi)=>{
    if(['door','drawer'].includes(p.t)){const cols=colors(p);for(let i=0;i<p.n;i++){
      const door=p.t==='door',w=door?c.w/p.n:c.w,h=door?p.h:p.h/p.n,nx=x+(door?i*w:0),ny=y+(door?0:i*h);let left=nx+gap/2,top=ny+gap/2,right=nx+w-gap/2,bottom=ny+h-gap/2;
      if(p.pull==='groove'){const G=door?Math.min(p.gw||25,w*.25,h*.25):Math.min(p.gw||25,h*.3),gp=p.gp||(door?'s':'t');if(gp==='t')top=Math.max(top,ny+G);else if(gp==='b')bottom=Math.min(bottom,ny+h-G);else{const hg=p.n===2?(i?'R':'L'):p.hinge;if(hg==='R')left=Math.max(left,nx+G);else right=Math.min(right,nx+w-G);}}
      out.push({c:ci,p:pi,i,type:p.t,x:nx,y:ny,w,h,rect:{x:left,y:top,w:Math.max(0,right-left),h:Math.max(0,bottom-top)},color:cols[i]||null});
    }}y+=p.h});x+=c.w});return out;}
  function same(a,b){return a&&b&&a.c===b.c&&a.p===b.p&&a.i===b.i;}
  function pick(st,q){return panels(st).find(f=>q.x>f.x&&q.x<f.x+f.w&&q.y>f.y&&q.y<f.y+f.h)||null;}
  function set(st,key,color,scope){const p=st.cols[key.c]?.parts[key.p];if(!p||!['door','drawer'].includes(p.t)||!(key.i>=0&&key.i<p.n)||color!==null&&!valid(color))return false;const a=colors(p);if(scope==='group')a.fill(color&&color.toLowerCase());else a[key.i]=color&&color.toLowerCase();if(a.some(Boolean))p.frontColors=a;else delete p.frontColors;return true;}
  const luminance=c=>{const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  function apply(g,st,o,runtime,settings){if(o.view==='in'||st.kind==='free')return g;const F=panels(st),key=o.interactive?runtime.face:null,preview=o.interactive?runtime.paintPreview:null,P=[],painted=[];
    for(const f of F){let color=f.color;if(preview&&f.c===preview.key.c&&f.p===preview.key.p&&(preview.scope==='group'||f.i===preview.key.i))color=preview.color;
      if(color&&f.rect.w>0&&f.rect.h>0){P.push({t:'r',...f.rect,c:'face-fill',col:color});painted.push({...f,color});}
    }
    const at=g.art.findIndex(a=>['out','in','thin','hd','face-edge'].includes(a.c));g.art.splice(at<0?g.art.length:at,0,...P);
    // Handles retain the chosen ink where legible, with a contrast fallback on dark finishes.
    g.art=g.art.map(a=>{if(a.t!=='l'||a.c!=='hd')return a;const x=(a.x1+a.x2)/2,y=(a.y1+a.y2)/2,f=painted.find(f=>x>=f.rect.x&&x<=f.rect.x+f.rect.w&&y>=f.rect.y&&y<=f.rect.y+f.rect.h),ink=settings.lineColor;if(!f||contrast(ink,f.color)>=3)return a;return{...a,c:'face-handle',col:contrast('#ffffff',f.color)>contrast('#203038',f.color)?'#ffffff':'#203038',lw:2.2*o.S};});
    if(key){const f=F.find(f=>same(f,key));if(f){g.art=g.art.filter(a=>a.c!=='sel');g.art.push({t:'r',...f.rect,c:'sel'});}}
    return g;
  }
  return{valid,colors,clean,panels,same,pick,set,apply};
})();
if(typeof module!=='undefined')module.exports=FaceColor;
