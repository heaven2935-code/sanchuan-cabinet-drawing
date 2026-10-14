from pathlib import Path
import json
import re

root=Path(__file__).resolve().parents[1]
src=(root/'legacy-source.html').read_text()
display=(root/'display-style.js').read_text()+'\n'+(root/'cabinet-depth.js').read_text()+'\n'+(root/'cabinet-faces.js').read_text()+'\n'+(root/'face-color.js').read_text()+'\n'+(root/'voice-measure.js').read_text()
src=src.replace("const BASEC=", display+"\nconst depthRuntime={editing:false,previewing:false,fixedEdge:null,view:'out'};\nlet displaySettings=DisplayStyle.normalize();\ntry{displaySettings=DisplayStyle.normalize(JSON.parse(localStorage.getItem('sc-mobile-display-v1')||'{}'))}catch(_){}\nconst BASEC=",1)
src=src.replace("  const body=o.H-o.kick;","  o.kickSetback=clamp(num(d.kickSetback,50),0,300);o.faceGap=clamp(num(d.faceGap,4),0,20);\n  const body=o.H-o.kick;",1)
src=src.replace("const g=cur.fine?1:","const g=cur.fine?.5:")
src=src.replace("p.gw,30","p.gw,25").replace("p.gw||30","p.gw||25").replace("x.gw||30","x.gw||25")
src=src.replace("st=styleState(s,st);applied","const prior=st;st=styleState(s,st);st.faceGap=prior.faceGap;st.kickSetback=prior.kickSetback;zoom.m=false;applied")
src=src.replace("  if(on){const r=lrect(b),w=Math.min(384,vpW()-16);pp.style.width=w+'px';popSide(pp,lrect(fileAnchor()),w)}","  if(on){pp.removeAttribute('style')}")
src=src.replace("let xi=0,yi=0;H.forEach(h=>{h.col=h.ax==='x'?HCOL[xi++%HCOL.length]:HCOL[(5+yi++)%HCOL.length]});", "const centered=DisplayStyle.handles(st,H,displaySettings);H.splice(0,H.length,...centered);")
src=src.replace("A.push({t:'p',pts:[[ox,y],[hx,y+h/2],[ox,y+h]],c:'dash'})", "A.push({t:'p',pts:[[ox,y],[hx,y+h/2],[ox,y+h]],c:'dash',doorSwing:true})")
src=src.replace("sx+sw*.7", "sx+sw*.5")
src=src.replace("const col=CHL,lw=2.4*k", "const col=displaySettings.selectionColor,lw=2.4*k")
src=src.replace("grid:+d.grid===50||+d.grid===100?+d.grid:0", "grid:Number.isFinite(+d.grid)&&+d.grid>=10?clamp(Math.round(+d.grid),10,1000):0")
src=src.replace("gd:`fill=\"none\" stroke=\"${pal.mute}\"", "gd:`fill=\"none\" stroke=\"${displaySettings.gridColor}\"")
src=src.replace("gD:`fill=\"none\" stroke=\"${pal.mute}\"", "gD:`fill=\"none\" stroke=\"${displaySettings.gridColor}\"")
src=src.replace("    rt:`", "    gDot:`fill=\"${displaySettings.gridColor}\" fill-opacity=\".6\" stroke=\"none\"`,\n    rt:`",1)
src=src.replace("    rt:`", """    'depth-back':`fill=\"${displaySettings.theme==='dark'?'#1c2a34':'#eaf0f3'}\" stroke=\"${pal.ink}\" stroke-opacity=\".45\" stroke-width=\"${f(.55*S)}\"`,
    'depth-left':`fill=\"${displaySettings.theme==='dark'?'#283d49':'#ccd9e0'}\" stroke=\"${pal.ink}\" stroke-opacity=\".45\" stroke-width=\"${f(.55*S)}\"`,
    'depth-right':`fill=\"${displaySettings.theme==='dark'?'#233540':'#dae4e9'}\" stroke=\"${pal.ink}\" stroke-opacity=\".45\" stroke-width=\"${f(.55*S)}\"`,
    'depth-top':`fill=\"${displaySettings.theme==='dark'?'#182730':'#dce6eb'}\" stroke=\"${pal.ink}\" stroke-opacity=\".45\" stroke-width=\"${f(.55*S)}\"`,
    'depth-bottom':`fill=\"${displaySettings.theme==='dark'?'#314652':'#f5f8fa'}\" stroke=\"${pal.ink}\" stroke-opacity=\".45\" stroke-width=\"${f(.55*S)}\"`,
    'face-edge':`fill="none" stroke="${pal.ink}" stroke-width="${f(.65*S)}"`,
    'toe-shade':`fill="${pal.ink}" fill-opacity="${displaySettings.theme==='dark'?.15:.10}" stroke="none"`,
    rt:`""",1)
src=src.replace("      if(t==='door'&&Array.isArray(p.ins)","      if(Array.isArray(p.frontColors))q.frontColors=p.frontColors.slice(0,10);\n      if(t==='door'&&Array.isArray(p.ins)")
src=src.replace("x.t=d.t;x.n=d.n;","x.t=d.t;x.n=d.n;if(Array.isArray(d.frontColors))x.frontColors=d.frontColors.slice();else delete x.frontColors;")
src=src.replace("x.t=v;","delete x.frontColors;x.t=v;")
src=src.replace("function clearCell(x,inV){","function clearCell(x,inV){delete x.frontColors;")
src=src.replace("const LY={out:","const LY={'face-edge':'CABINET','face-handle':'CABINET',out:")
src=src.replace("p.c==='dim'&&p.col?","p.c==='face-fill'?`fill=\"${p.col}\" stroke=\"none\"`:p.c==='dim'&&p.col?")
src=src.replace("p.c==='an'||p.c==='anh'?an(p)","p.c==='an'||p.c==='anh'||p.c==='face-handle'?an(p)")
src=src.replace("dm:[pal.sub,NUMF,'']", "dm:[pal.sub,NUMF,halo(p.z)]")
src=src.replace("font-family=\"Outfit,'LXGW WenKai TC',sans-serif\"", "font-family=\"-apple-system,BlinkMacSystemFont,'Arial',sans-serif\"")
# Only new measurement primitives need hundredth-mm coordinates. Keep ordinary artwork unchanged.
src=src.replace("  for(const p of P){\n    if(p.t==='l')s+=", "  for(const p of P){\n    const f=v=>+(+v).toFixed(p.measurement?2:1);\n    if(p.t==='l')s+=",1)
wrapper='''
const colorFixAll=fixAll;
fixAll=function(st){colorFixAll(st);FaceColor.clean(st)};
const voiceAnnotationPrimitives=annPrims;
annPrims=function(list,S){return(list||[]).flatMap(it=>VoiceMeasure.primitives(it.a,S,voiceAnnotationPrimitives([it],S)))};
const displayGeom=geom;
geom=function(st,o){
  const shape=Object.assign({},st,{labels:displaySettings.names,grid:0});
  const options=Object.assign({},o,{acc:displaySettings.selectionColor});
  const g=FaceColor.apply(CabinetFaces.apply(displayGeom(shape,options),shape,options,displaySettings),shape,options,depthRuntime,displaySettings),H=handleModel(shape,o.view==='in',o.sel?o.sel.c:null);
  return CabinetDepth.apply(DisplayStyle.decorate(g,shape,options,displaySettings,H),shape,options,displaySettings,depthRuntime,gapsOf);
};
const displaySVG=toSVG;
toSVG=function(P,S,pal,U,W){return displaySVG(P,S,DisplayStyle.palette(displaySettings,pal),U,W)};
const displayExport=exportSVG;
exportSVG=function(st,pal,bg){
  const xp=DisplayStyle.palette(displaySettings,pal||XPAL);
  if(depthRuntime.view==='in'&&displaySettings.interiorView==='depth'&&!hasDoor(st)&&st.kind!=='free'){
    const sh=layout(st,1200,1400),v=sh.vb,S=sh.S,w=Math.round(v[2]/S),h=Math.round(v[3]/S),P=geom(st,{S,view:'in',bg,cap:'櫃內深度示意'}).art.concat(annPrims(annOf(st,'in'),S));
    return{w,h,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${v.join(' ')}"><rect x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" fill="${xp.sheet}"/>${toSVG(P,S,xp).art}</svg>`};
  }
  return displayExport(st,xp,bg);
};
'''
src=src.replace("if(typeof module!=='undefined'&&typeof document==='undefined'){module.exports={",wrapper+"if(typeof module!=='undefined'&&typeof document==='undefined'){module.exports={VoiceMeasure,FaceColor,CabinetFaces,CabinetDepth,depthRuntime,DisplayStyle,displaySettings,",1)
src=src.replace("bg:bgArg(),fsel:","bg:bgArg(),gridScale:S/zoom.z,fsel:")
src=src.replace("const saveDraft=debounce(saveNow,400);", "const saveDraft=debounce(()=>{if(!depthRuntime.previewing)saveNow()},400);")
css=(root/'mobile-ui.css').read_text()
js=(root/'mobile-ui.js').read_text()
js=js.replace('// Stable public metadata', (root/'mobile-face-color.js').read_text()+'\n'+(root/'mobile-precision.js').read_text()+'\n'+(root/'mobile-rulers.js').read_text()+'\n'+(root/'mobile-voice.js').read_text()+'\n// Stable public metadata',1)
policy=(root/'ui-policy.js').read_text()
src=src.replace('<title>櫃體立面圖 新版</title>','<title>三川工方｜手機繪圖</title>')
src=src.replace('name="apple-mobile-web-app-status-bar-style" content="black-translucent"','name="apple-mobile-web-app-status-bar-style" content="default"')
src=src.replace('name="theme-color" content="#1F2428"','name="theme-color" content="#f4f6f7"')
src=re.sub(r'<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\n?', '', src)
src=src.replace('</head>','<meta name="description" content="三川工方手機櫃體立面繪圖。點選線或格子，才顯示對應操作；直接拖動與雙指縮放。">\n<style>'+css+'</style>\n<script>'+policy+'</script>\n</head>')
pos=src.rfind('})();')
assert pos>0
src=src[:pos]+'\n/* Mobile interaction layer */\n'+js+'\n'+src[pos:]
src=src.replace("indexedDB.open('sc-cab',1)","indexedDB.open('sc-mobile-cab',1)")
src=src.replace("'sc-cab-","'sc-mobile-")
src=src.replace('下次開啟或換裝置都找得到','下次在同一台裝置開啟就找得到；換裝置請匯入 JSON 備份')
src=src.replace('?v=1','?v=voice-core-20261014')
dist=root/'dist'
dist.mkdir(exist_ok=True)
(dist/'index.html').write_text(src)
logo=re.search(r'<svg class="lg" viewBox="0 0 1059 1059".*?</svg>',src).group(0)
(dist/'logo.svg').write_text(logo.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ',1))
(dist/'manifest.webmanifest').write_text(json.dumps({'name':'三川工方｜手機繪圖','short_name':'手機繪圖','lang':'zh-Hant','start_url':'./','scope':'./','display':'standalone','background_color':'#f4f6f7','theme_color':'#f4f6f7','icons':[{'src':'icon-180.png','sizes':'180x180','type':'image/png'},{'src':'icon-512.png','sizes':'512x512','type':'image/png'}]},ensure_ascii=False,indent=2))
print(json.dumps({'html_bytes':(dist/'index.html').stat().st_size,'out':str(dist)},ensure_ascii=False))
