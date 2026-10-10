# CODE_MAP
- index.html: 繪圖 UI、CSS、SVG 畫布核心、觸控事件、本機儲存與輸出。
- manifest.webmanifest: 主畫面安裝資訊（standalone、landscape）。
- icon-180.png / icon-512.png: Web App 桌面圖示。
- index.html: #displayMode 控制畫布滿版；#installPrompt 指引加入主畫面；syncViewportHeight 校正 iOS 可視高度。
- scripts/build_icons.py: 可重建主畫面 PNG 圖示（Pillow）。
- tests/install_assets.py: PNG CRC、解碼、尺寸及主畫面安裝連結驗證。

- logo-02-g01.svg: 02-G01 藍色漸層向量標誌，由 build_icons.py 重建。

- grid.js: 純毫米幾何核心，舊分格轉換、完整覆蓋驗證、線段推導、合併／拆分／邊界尺寸。
- index.html: 儲存格 UI、欄列標題、單指拖曳編輯、雙指取消與安全區容器。
- tests/grid_geometry.cjs: 局部合併、格子完整覆蓋、邊界範圍與等分精度。
- tests/grid_interactions.cjs: 執行實際應用程式與指標事件，驗證操作、復原、儲存與乾淨匯出。
- tests/grid_browser.cjs: Playwright 真實點選及排版測試；本次環境無法啟動瀏覽器。
