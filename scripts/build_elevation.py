"""Build the GitHub Pages copy of 櫃體立面圖 from the published artifact HTML.

usage: python3 build_gh.py <artifact index.html> <out dir>
- strips the artifact wrapper document
- writes the apple-touch / manifest icons as real files
- injects a small stand-in for window.claude.use (IndexedDB db, device downloads, no AI)
"""
import base64, re, sys, urllib.parse, pathlib, json

src, out = sys.argv[1], pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
s = open(src, encoding='utf8').read()

# 1. inner document (the artifact host wraps the page in its own skeleton)
a = s.find('<!doctype html>', 10)
b = s.rfind('</html>', 0, s.rfind('</body></html>'))
doc = s[a:b + len('</html>')] + '\n'

# 2. icons
m = re.search(r'<link rel="apple-touch-icon" href="data:image/png;base64,([^"]+)">', doc)
(out / 'icon-180.png').write_bytes(base64.b64decode(m.group(1)))
m2 = re.search(r'<link rel="icon" type="image/svg\+xml" href="data:image/svg\+xml,([^"]+)">', doc)
svg = urllib.parse.unquote(m2.group(1))
(out / 'logo.svg').write_text(svg, encoding='utf8')

doc = doc.replace(m.group(0),
    '<link rel="apple-touch-icon" href="./icon-180.png?v=1">\n'
    '<link rel="manifest" href="./manifest.webmanifest?v=1">\n'
    '<meta name="apple-mobile-web-app-capable" content="yes">\n'
    '<meta name="mobile-web-app-capable" content="yes">\n'
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
    '<meta name="apple-mobile-web-app-title" content="櫃體立面圖">\n'
    '<meta name="theme-color" content="#1F2428">')
doc = doc.replace(m2.group(0), '<link rel="icon" type="image/svg+xml" href="./logo.svg?v=1">')

(out / 'manifest.webmanifest').write_text(json.dumps({
    "name": "櫃體立面圖｜三川工方", "short_name": "櫃體立面圖", "lang": "zh-TW",
    "start_url": "./", "scope": "./", "display": "standalone",
    "background_color": "#1F2428", "theme_color": "#1F2428",
    "icons": [{"src": "./icon-180.png?v=1", "sizes": "180x180", "type": "image/png"},
              {"src": "./icon-512.png?v=1", "sizes": "512x512", "type": "image/png"}]
}, ensure_ascii=False, indent=2), encoding='utf8')

# 3. stand-in for the Claude runtime
SHIM = r'''<script>
/* GitHub 版：代替 Claude 頁面能力。db＝本機 IndexedDB，downloads＝裝置存檔／分享，AI 繪圖不提供 */
(function(){
try{if(localStorage.getItem('sc-cab-topi')===null)localStorage.setItem('sc-cab-topi','0')}catch(e){}
function idb(){return new Promise(function(ok,no){var r=indexedDB.open('sc-cab',1);
  r.onupgradeneeded=function(){r.result.createObjectStore('docs')};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
function tx(mode,fn){return idb().then(function(d){return new Promise(function(ok,no){var t=d.transaction('docs',mode),s=t.objectStore('docs'),res;
  var q=fn(s);if(q)q.onsuccess=function(){res=q.result};t.oncomplete=function(){ok(res)};t.onerror=t.onabort=function(){no(t.error)}})})}
function snap(id,v){return{id:id,exists:v!==undefined,data:function(){return v===undefined?undefined:JSON.parse(JSON.stringify(v))}}}
function docRef(path){var id=path.split('/').pop();return{
  get:function(){return tx('readonly',function(s){return s.get(path)}).then(function(v){return snap(id,v)})},
  set:function(o){return tx('readwrite',function(s){return s.put(JSON.parse(JSON.stringify(o)),path)}).then(function(){})},
  delete:function(){return tx('readwrite',function(s){return s.delete(path)}).then(function(){})}}}
function query(name,ord,dir,lim){return{
  orderBy:function(f,d){return query(name,f,d||'asc',lim)},
  limit:function(n){return query(name,ord,dir,n)},
  get:function(){var lo=name+'/',hi=name+'/￿';return idb().then(function(d){return new Promise(function(ok,no){
    var out=[],t=d.transaction('docs','readonly'),r=t.objectStore('docs').openCursor(IDBKeyRange.bound(lo,hi));
    r.onsuccess=function(){var c=r.result;if(c){out.push([String(c.key).slice(lo.length),c.value]);c.continue()}};
    t.oncomplete=function(){if(ord)out.sort(function(a,b){var x=a[1][ord],y=b[1][ord];return(x<y?-1:x>y?1:0)*(dir==='desc'?-1:1)});
      if(lim)out=out.slice(0,lim);ok({docs:out.map(function(p){return snap(p[0],p[1])})})};t.onerror=function(){no(t.error)}})})},
  doc:function(id){return docRef(name+'/'+id)}}}
var db={collection:function(n){return query(n)},doc:function(p){return docRef(p)}};
var MIME={png:'image/png',svg:'image/svg+xml',zip:'application/zip',dxf:'application/dxf',json:'application/json'};
function toBlob(data,name){var ext=(name.split('.').pop()||'').toLowerCase(),type=MIME[ext]||'application/octet-stream';
  if(data instanceof Blob)return data.type?data:new Blob([data],{type:type});
  if(typeof data==='string'&&/^data:/.test(data)){var p=data.split(','),bin=atob(p[1]),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    return new Blob([u],{type:(p[0].match(/data:([^;]+)/)||[])[1]||type})}
  return new Blob([data],{type:type})}
var downloads={save:function(o){var name=o.filename||'download',blob=toBlob(o.data,name);
  var file;try{file=new File([blob],name,{type:blob.type})}catch(e){}
  function anchor(){var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},60000)}
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})&&/iPhone|iPad|Android/i.test(navigator.userAgent))
    return navigator.share({files:[file]}).catch(function(e){if(e&&e.name==='AbortError')throw{code:'declined'};anchor()});
  anchor();return Promise.resolve()}};
window.claude={use:function(n){return Promise.resolve(n==='db'?db:n==='downloads'?downloads:null)}};
window.SC_GH=true;
})();
</script>
'''
i = doc.find('<script')
doc = doc[:i] + SHIM + doc[i:]
(out / 'index.html').write_text(doc, encoding='utf8')
print('ok', len(doc))
