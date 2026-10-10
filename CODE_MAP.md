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

- index.html: cursorDock、cursorPad、cursorMenu、cursorDraft 狀態，以及內嵌 dimensionEditor；preview 與正式 doc 分離。
- grid.js: segment／localLimits／moveLocal／removeLocal 保護跨列合併格並支援局部線段編輯。
- tests/cursor_interactions.cjs: 相對觸控板、游標動作選單、全部繪圖／標註工具、預覽隔離、局部移動刪除與復原。

- V1.4：直線／尺寸標註可點選起點與終點控制點各自拖曳；游標選單提供調起點／調終點及內嵌 X/Y，另一端固定。取消回退，完成可復原。

- V1.4.1：游標控制改為畫布下方浮動收合按鍵；半透明圓框內按住圓心相對移動，展開選取／取消／動作／完成。取消準心旁選單與座標、底部觸控板佔位。鍵盤／視窗 resize 保留比例與位置，適屏與方向切換才重算。iPhone 真機排版待驗證。
- 返回鍵固定畫布工具列左側，退出編輯／預覽並保留視角；動作選單不自動置中。

- V1.4.2 最新介面：使用者所稱返回為復原（Undo）；移除 backEdit／backFromEdit。commonActions 浮動底列放復原／重做／選取／平移／刪除／動作，游標控制器中央偏下；取消預覽使用控制器取消鍵。常用動作測試通過，真機排版待驗證。
