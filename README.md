# 三川工方｜櫃體立面繪圖 V1.4.0

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


## 游標繪圖（V1.4）
直式畫面下方固定顯示觸控板。滑動移動準心，可抬手再滑；按「選取」選格子、線段或圖元，「取消」清除選取或放棄預覽，「動作」在準心旁展開選單。橫式可按「游標」展開觸控板。

- 直／橫分隔：先選格子，從動作選單選直／橫分隔，在該格內產生虛線預覽；滑動或直接輸入距左／上邊的毫米數，再按「完成」固定。
- 畫直線、矩形、圓形與尺寸標註：先定位起點、選工具，再移動準心指定終點，按「完成」。
- 文字標記：選工具，在下方欄位輸入文字，移動準心定位，再按「完成」。
- 移動：先選線或圖元，再從動作選單選「移動位置」，預覽後按「完成」。
- 刪除：選取分隔線後刪除會合併兩側相鄰格；選取自由圖元則移除該圖元，均可復原。
- 圖內分隔線局部移動；如果兩側包含跨列／欄合併格，連動範圍會擴至能維持長方形的區域。邊緣欄列標題仍調整整欄／列。
- 欄列尺寸改為原位置附近的輸入欄，無需彈出 prompt。

預覽期間不改動專案資料，不會寫入 JSON／SVG；只有按完成才記錄一次可復原的變更。原本直接點選、拖曳及雙指縮放仍可使用。測試：`node tests/cursor_interactions.cjs`。

- V1.4：直線／尺寸標註可點選起點與終點控制點各自拖曳；游標選單提供調起點／調終點及內嵌 X/Y，另一端固定。取消回退，完成可復原。

- V1.4.1：游標控制改為畫布下方浮動收合按鍵；半透明圓框內按住圓心相對移動，展開選取／取消／動作／完成。取消準心旁選單與座標、底部觸控板佔位。鍵盤／視窗 resize 保留比例與位置，適屏與方向切換才重算。iPhone 真機排版待驗證。
- 返回鍵固定畫布工具列左側，退出編輯／預覽並保留視角；動作選單不自動置中。

- V1.4.2 最新介面：使用者所稱返回為復原（Undo）；移除 backEdit／backFromEdit。commonActions 浮動底列放復原／重做／選取／平移／刪除／動作，游標控制器中央偏下；取消預覽使用控制器取消鍵。常用動作測試通過，真機排版待驗證。

- V1.5.0 最新操作：左側常駐工具列已移除；cells 代表統一選取（點格子／點線／框選），commonActions 為底部常用列，cursorMenu 為新增清單，cellActions 為選取後下方工具列。新增在 dockOpen=false 時使用 showMode 直接觸碰，在 true 時使用 startCursorTool 預覽。contextPartition／contextMove／contextStart／contextEnd／contextTextInput 編輯選取對象。splitCount 內嵌等分數量取代 prompt。設定為浮動面板，縮放比例與位移不自動復歸。功能測試通過，真機觸控排版待驗證；未新增拆料、鎖定或版本管理。

- V1.5.1：按鍵視覺恢復原深色工具列風格，commonActions 圖示上下排列、暖色選取框；cursorSelectLabel 更新文字避免重畫圖示。維持 V1.5 功能與下方配置；真機視覺待驗。

- V1.6.0 最新方向：使用者取消儲存格操作。預設 select，cells 舊模式入口映射 select；gridOverlay 改為直接尺寸標示，不再有字母／數字欄列頭、框選與格子高亮。數值點選經 dimensionEdit；總尺寸按比例調整，局部尺寸依 localPosition 移動相鄰線且外框固定。原 gridCells 只作相容幾何資料，保留舊圖面；合併／等分 UI 隱藏。測試：grid_interactions 驗證總寬高及兩側局部尺寸、無效值拒絕、取消與復原；cursor_interactions 驗證線條／端點／繪圖。iPhone 真機視覺待驗證。


## 2026-10-13 主網址改版（保留 elevation）

主網址 https://heaven2935-code.github.io/sanchuan-cabinet-drawing/ 已換成新版手機繪圖程式，包含直接點選、情境編輯與 X/Y 尺軌。/elevation/ 完整保留原樣。新版維護使用 scripts/build_mobile_root.py。
