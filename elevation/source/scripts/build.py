from pathlib import Path
import json
import re

root=Path(__file__).resolve().parents[1]
src=(root/'legacy-source.html').read_text()
css=(root/'mobile-ui.css').read_text()
js=(root/'mobile-ui.js').read_text()
js=js.replace('// Stable public metadata', (root/'mobile-rulers.js').read_text()+'\n// Stable public metadata',1)
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
dist=root/'dist'
dist.mkdir(exist_ok=True)
(dist/'index.html').write_text(src)
logo=re.search(r'<svg class="lg" viewBox="0 0 1059 1059".*?</svg>',src).group(0)
(dist/'logo.svg').write_text(logo.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ',1))
(dist/'manifest.webmanifest').write_text(json.dumps({'name':'三川工方｜手機繪圖','short_name':'手機繪圖','lang':'zh-Hant','start_url':'./','scope':'./','display':'standalone','background_color':'#f4f6f7','theme_color':'#f4f6f7','icons':[{'src':'icon-180.png','sizes':'180x180','type':'image/png'},{'src':'icon-512.png','sizes':'512x512','type':'image/png'}]},ensure_ascii=False,indent=2))
print(json.dumps({'html_bytes':(dist/'index.html').stat().st_size,'out':str(dist)},ensure_ascii=False))
