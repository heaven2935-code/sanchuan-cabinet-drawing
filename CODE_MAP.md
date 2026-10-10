# CODE_MAP.md

- `index.html`：完整可獨立執行的 Web App，含 HTML 結構、響應式 CSS、內嵌 JavaScript。
  - `.topbar`：專案名稱、復原/重做、儲存、匯出。
  - `.toolbar`：繪圖工具清單。
  - `#drawing`：SVG 工程繪圖畫布、世界座標與觸控游標。
  - `#inspector`：精準觸控板、毫米座標、櫃體尺寸、分格、圖元屬性、匯出。
  - `doc`：唯一圖面資料 `{name,width,height,depth,vertical,horizontal,shapes}`，所有值以 mm 儲存。
  - `view`：只管理屏幕檢視比例與平移，不修改工程座標。
  - `snapped / snapExactCursor`：10mm吸附與精確微調。
  - `drawScene / render / renderCursor`：SVG 繪圖、尺寸標註、放大鏡。
  - `record / undo / redo / save`：編輯歷史、本機暫存。
  - `exportJSON / exportSVG / exportPNG`：檔案輸出。
- `tests/browser_smoke.py`：Playwright 操作與幾何測試。
- `preview_landscape.png`：橫向操作畫面範例。
- `preview_portrait.png`：直向兼容畫面測試紀錄。

## V1.1 修改
- `index.html`：`bootNotice` 無 JS 預覽提示；`bind()` 的畫布 `pointermove`/`endDrawing` 支援拖曳繪圖。
- `tests/touch_regression.py`：模擬 iPhone 橫向尺寸與手指拖曳／點選、測試所有主要按鈕及非 JS 啟動提醒。