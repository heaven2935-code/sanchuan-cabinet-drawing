# 三川工方｜手機繪圖

網址：https://heaven2935-code.github.io/sanchuan-cabinet-drawing/elevation/

手機介面以圖面為主：點線或格子才出現可用操作；操作完成後收起。
單指拖圖、雙指縮放。分隔、線位置調整或標註移動時，顯示下緣 X 與右緣 Y 尺軌；可拖動標示控制準星，對準線延伸到尺軌。
X 為距櫃左，Y 為離櫃底高度，單位 mm。

保留原有櫃體計算、47 種樣式、照片校正、掃描匯入、自由繪圖與 PNG／SVG／DXF 匯出。資料沿用原先的 sc-cab IndexedDB 與草稿鍵，既有圖面可繼續讀取。

程式來源：elevation/source/。
重建：
```sh
python3 scripts/build_mobile_elevation.py
node elevation/source/tests/verify.cjs
```

舊版備份分支：backup/elevation-before-mobile-20261013-4ae2031。

尚未完成 iPhone 實機觸控與分享流程驗收。無 AI 服務與自動裁切清單。
