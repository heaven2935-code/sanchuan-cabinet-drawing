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

- V1.5.0 最新操作：左側常駐工具列已移除；cells 代表統一選取（點格子／點線／框選），commonActions 為底部常用列，cursorMenu 為新增清單，cellActions 為選取後下方工具列。新增在 dockOpen=false 時使用 showMode 直接觸碰，在 true 時使用 startCursorTool 預覽。contextPartition／contextMove／contextStart／contextEnd／contextTextInput 編輯選取對象。splitCount 內嵌等分數量取代 prompt。設定為浮動面板，縮放比例與位移不自動復歸。功能測試通過，真機觸控排版待驗證；未新增拆料、鎖定或版本管理。

- V1.5.1：按鍵視覺恢復原深色工具列風格，commonActions 圖示上下排列、暖色選取框；cursorSelectLabel 更新文字避免重畫圖示。維持 V1.5 功能與下方配置；真機視覺待驗。

- V1.6.0 最新方向：使用者取消儲存格操作。預設 select，cells 舊模式入口映射 select；gridOverlay 改為直接尺寸標示，不再有字母／數字欄列頭、框選與格子高亮。數值點選經 dimensionEdit；總尺寸按比例調整，局部尺寸依 localPosition 移動相鄰線且外框固定。原 gridCells 只作相容幾何資料，保留舊圖面；合併／等分 UI 隱藏。測試：grid_interactions 驗證總寬高及兩側局部尺寸、無效值拒絕、取消與復原；cursor_interactions 驗證線條／端點／繪圖。iPhone 真機視覺待驗證。

- V1.7.0 最新板件編輯：parts.js 的 CabinetParts 提供類型／編號／metadata 正規化／結構座標 transform 與 round-to-0.01 scale。index.html 的 partEditor 為 stage 浮動面板，contextPart／partList／addBoard 三入口；doc.boardTags 標記結構線位置，shape.part 標記自由線／矩形。boardLines 在點選及清除失效標記時包含四條外框。applyPart 為單次可復原修改，抽屜 children 六件只採使用者輸入加工尺寸，不自動推算。boardLabels 保留於 SVG，名字以 esc 輸出；複製結構線會建立自由圖元；外框刪除只清名稱。測試 parts_interactions.cjs 覆蓋實際處理器、命名／尺寸／移動／抽屜／複製刪除／取消／復原／儲存重載／保留視角。真機鍵盤及浮動面板仍待驗證。

- V1.8：drawingControls 是 stage 外的 footer，依序 cellActions（結構情境）、cursorConfirmation（結構預覽確認）、commonActions（undo/cursorSelect/commonPan）、cursorDock（長方形相對觸控板）。auxiliaryActions 於 stage 上方處理自由圖形、板件及非結構預覽確認，cursorDraftFields 浮於 stage 上緣。selectWholeLine 將 gridLine.local=false，保留 axis/value、全高或全寬；moveGridLine／cursorDraft／直接拖曳均呼叫 Grid.move，刪整列逐段 removeLocal 並單次 history。regionAt 只作新增分隔定位，不恢復儲存格選取模式。controlledCursorMove 在 pan 模式更新 view，其餘更新 cursor；setDock 重繪 viewBox 不重算適屏。最末 V1.8 CSS 覆寫舊規則，topbar 明確 display:flex、固定單列及 safe-area 外層。

- V1.9：全部樣式由 ui.css 提供，index.html 不再含 inline style block。design tokens 依初版 palette，24px viewBox SVG icons 為靜態 HTML；toggleCursorDockLabel／toggleInspectorLabel 用來更新文字，保持圖示。canvas-top 為六工具 nav；portrait 600px 以下使用明確 grid areas（品牌列／檔名列），landscape 高度 480px 以下 compact；結構 cellActions 四欄加獨立數值列、白色卡片面板。保留 V1.8 ID／事件處理器相容性。CSS 檔案與版本參數加入 install_assets 檢查。


## 2026-10-13 主網址改版（保留 elevation）

主入口 index.html 為新版手機繪圖，mobile-source/ 保存新版來源，scripts/build_mobile_root.py 建置至根目錄。elevation/ 為獨立保留的原程式，本次沒有修改。


## 2026-10-14 圖面顯示設定

正式入口為 GitHub 根目錄，elevation/ 保留不動。display-style.js 管理裝置顯示偏好、格線與中點幾何；scripts/build.py 將偏好注入原引擎與匯出流程。mobile-ui.js 的 mDisplayOpen 提供設定與儲存，mobile-rulers.js 支援左右尺軌。


## 2026-10-14 線條選色與深色版

新增 DisplayStyle.lineColor、theme、themeColors/themeChange 與 palette。mDisplayOpen 提供線色及淺／深版本；render 設定 data-canvas-theme；mobile-ui.css 與 mobile-rulers.js 實作深色介面。toSVG/exportSVG 使用同一色盤。


## 2026-10-14 櫃內深度與操作檢查

cabinet-depth.js：櫃內固定視角投影、開口裁切、板面陰影，以及自由線與標註的點選距離。depthRuntime 管理編輯暫停、基準外框及未確認預覽。mobile-ui.js：櫃內平面／深度切換、平面編輯後恢復、精確毫米、數值驗證與原生板線拖曳。ui-policy.js：合併、鎖定及可用動作判斷。tests/dom-harness.cjs/audit.cjs 執行完整程式與真實 DOM 事件，tests/depth.cjs 驗證投影；测试依賴只供開發。


## 2026-10-14 精準微調與實尺寸顯示

- `mobile-source/mobile-precision.js`：相對拖曳、1/5/10 mm 微調、左右手位置、量測條件、原點與量測邊界。局部淨尺寸依既有模型實際板面扣除；內部共用層板扣半板厚，獨立桶身各扣完整側板。尺規改為可選輔助，預設收起。
- `mobile-source/cabinet-faces.js`：實際門／抽屜總縫寬、縮放簡化與踢腳凹入陰影提示。門縫與裝飾不改選取範圍。
- `mobile-source/scripts/build.py`：持久化 kickSetback / faceGap、取手縫預設25、樣式面板移除隱藏桌面錨點、DXF 面板邊線圖層。
- `mobile-source/tests/precision.cjs`：完整 DOM 流程核對淨尺寸、微調、相對拖曳、原點、設定、取消、復原與輸入錯誤。


## 2026-10-14 單片面板配色

- `mobile-source/face-color.js`：純函式面板幾何、單片命中、顏色驗證／正規化、單片／整組賦色與渲染；`frontColors` 儲存在外部門／抽屜組的 part 內，順序為門片由左至右、抽屜頭由上至下。
- `mobile-source/mobile-face-color.js`：配色表單、常用色、自訂色、作用範圍、恢復預設；`mobileUI.paintPreview` 僅為預览，不寫入圖面。
- `mobile-source/mobile-ui.js`：`mobileUI.face` 與 `depthRuntime.face` 控制單片高亮；`faceGroup` 返回整格操作。
- `mobile-source/tests/face-color.cjs`：14 組前板選取／跳色／取消／復原／資料保存／匯出／把手對比測試，47 種樣式共258片面板幾何檢查。
- `mobile-source/scripts/build.py`：保留 frontColors、複製貼上與類型切換規則；face-fill只影響SVG/PNG顏色，face-handle保留CAD線圖層，與選取線分離。


## 現行交接入口（2026-10-14）

NEXT_PROMPT.md已重整為下一階段「現場語音丈量繪圖」的現行交接；TODO.md頂部列當前優先順序。建議純解析／線段狀態與手機收音介面分離，但voice-measure.js／mobile-voice.js仍是建議檔名，尚未建立。原有程式與獨立elevation/均不在本次文件更新範圍內。
