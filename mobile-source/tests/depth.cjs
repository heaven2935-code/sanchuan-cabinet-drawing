'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),code=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1],ctx={module:{exports:{}},TextEncoder,TextDecoder,Uint8Array,DataView,ArrayBuffer,Blob,setTimeout,clearTimeout,Date,Math};vm.runInNewContext(code,ctx);const e=ctx.module.exports,D=e.CabinetDepth,p=e.displaySettings,runtime=e.depthRuntime;let count=0;
const check=(name,fn)=>{fn();count++;process.stdout.write('PASS '+name+'\n')},pal={ink:'#203038',sub:'#60727b',mute:'#85949b',sheet:'#fff',tint:'#eef3f4',accent:'#147c88'};
check('all 47 styles at three widths produce finite depth surfaces without changing cabinet dimensions',()=>{
  Object.assign(p,e.DisplayStyle.normalize({interiorView:'depth'}));for(const W of [800,2400,4200])for(const style of e.STYLES){const s=e.styleState(style,{W,H:2400,T:18,kick:100}),before=JSON.stringify(s),g=e.geom(s,{S:8,view:'in'}),polys=g.art.filter(q=>q.depth);assert.equal(JSON.stringify(s),before);for(const q of polys){assert(q.pts.length>=3);assert(q.pts.flat().every(Number.isFinite));}const svg=e.toSVG(g.art,8,pal).art;assert(!/\bNaN|Infinity|undefined\b/.test(svg));}
});
check('projection uses one vanishing direction for the entire cabinet and faces stay clipped within openings',()=>{
  const s=e.normalize(e.sample0()),regions=D.regions(s,e.gapsOf);for(const r of regions){const corners=[{x:r.x,y:r.y},{x:r.x+r.w,y:r.y+r.h}];for(const q of corners){const b=D.point(q,s);assert(Math.abs((b.x-q.x)-.12*(s.W/2-q.x))<1e-7);}const poly=D.clip([{x:r.x-500,y:r.y-500},{x:r.x+r.w+500,y:r.y-500},{x:r.x+r.w+500,y:r.y+r.h+500},{x:r.x-500,y:r.y+r.h+500}],r);assert(poly.every(q=>q.x>=r.x-1e-8&&q.x<=r.x+r.w+1e-8&&q.y>=r.y-1e-8&&q.y<=r.y+r.h+1e-8));}
});
check('depth appears only for interior previews and leaves flat editing, CAD and free drawing intact',()=>{
  Object.assign(p,e.DisplayStyle.normalize({interiorView:'depth'}));const s=e.normalize(e.sample0());assert(e.geom(s,{S:8,view:'in'}).art.some(q=>q.depth));assert(!e.geom(s,{S:8,view:'out'}).art.some(q=>q.depth));assert(!e.geom(s,{S:8,view:'in',nogrid:true}).art.some(q=>q.depth));runtime.editing=true;assert(!e.geom(s,{S:8,view:'in',interactive:true}).art.some(q=>q.depth));runtime.editing=false;assert(!e.geom(e.toFree(s),{S:8,view:'in'}).art.some(q=>q.depth));
});
check('light and dark previews use chosen ink and all depth polygons render with their own surface style',()=>{
  const s=e.normalize(e.sample0());for(const theme of ['light','dark']){Object.assign(p,e.DisplayStyle.normalize({theme,interiorView:'depth',lineColor:'#5588bb'}));const g=e.geom(s,{S:8,view:'in'}),svg=e.toSVG(g.art,8,pal).art;assert(svg.includes('stroke="#5588bb"'));assert(svg.includes(theme==='dark'?'#283d49':'#ccd9e0'));}
});
check('open-only cabinets export the active interior depth illustration while CAD remains planar',()=>{
  const s=e.normalize({W:800,H:2400,T:18,kick:100,cols:[{w:800,parts:[{t:'open',h:2300,n:4}]}]});Object.assign(p,e.DisplayStyle.normalize({interiorView:'depth'}));runtime.view='in';const out=e.exportSVG(s).svg;assert(out.includes('#ccd9e0'));assert(out.includes('櫃內深度示意'));assert(!e.toDXF(s).includes('depth'));runtime.view='out';
});
fs.mkdirSync(path.join(root,'qa'),{recursive:true});for(const theme of ['light','dark']){Object.assign(p,e.DisplayStyle.normalize({theme,interiorView:'depth'}));const s=e.normalize(e.sample0()),lay=e.layout(s,390,740),g=e.geom(s,{S:lay.S,view:'in'}),palette=e.DisplayStyle.palette(p,pal),vb=lay.vb;fs.writeFileSync(path.join(root,'qa','interior-depth-'+theme+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="740" viewBox="${vb.join(' ')}"><rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${palette.sheet}"/>${e.toSVG(g.art,lay.S,palette).art}</svg>`);}
process.stdout.write(count+' depth verification groups passed.\n');
