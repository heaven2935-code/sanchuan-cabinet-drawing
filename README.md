# 三川工方｜櫃體立面繪圖 V1.3.0

網站：https://heaven2935-code.github.io/sanchuan-cabinet-drawing/

## iPhone 滿版使用
Safari 開啟網站 → 分享 → 加入主畫面 → 打開為網頁 App → 加入。以主畫面圖示啟動，可避免一般 Safari 網址列占用繪圖畫面。

在繪圖應用內點「⛶ 滿版」，會收起右側控制面板與部分標題，擴大畫布；再次點「⛶ 返回」復原。Safari 網址列無法用一般 JavaScript 強制關閉。

備份：加入主畫面之前，建議先在 Safari 匯出 JSON。因為 Safari 和網頁 App 可能不共用本機儲存資料。


## 儲存格繪圖
- 預設進入「儲存格」。點一下選取，再點取消；可依序選多格或拖曳框選。
- 選取相鄰格後按「合併」，範圍須為完整長方形。
- 「新增欄／新增列」把選取格拆成指定等分，櫃體總尺寸固定。
- 點上方欄標題／左側列標題輸入欄寬／列高；拖標題邊界或圖面分隔線即可調整。
- 點選分隔線後，頂部編輯列可直接輸入位置（mm）。同座標的分隔線一起移動；內部調整保持總尺寸，最後一欄／列可改總尺寸。
- 「選取」模式可拖曳自由直線、矩形、圓形、尺寸或文字圖元。
- 直式右側面板預設收起，按「設定」展開；整個工作區使用四邊安全留白。

## 資料與驗證
沿用原本機儲存鍵，支援舊版 JSON。第一次編輯舊圖面時保留 `sanchuan_cabinet_before_grid_v1_3` 備份；新 JSON 的 `gridCells` 保存局部合併，應使用 V1.3 開啟。

可執行：`node tests/grid_geometry.cjs`、`node tests/grid_interactions.cjs`、`python tests/install_assets.py`。
`grid_interactions.cjs` 執行真實程式和事件處理器，但使用 DOM 替身，不驗證瀏覽器排版。
`node tests/grid_browser.cjs` 為 Playwright 畫面測試；可指定 `CAD_TEST_CHROME` 指向瀏覽器。本次環境禁止 Chrome 啟動所需的 socket，畫面測試未完成，iPhone 真機亦待確認。
