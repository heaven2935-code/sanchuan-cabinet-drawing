# NEXT_PROMPT

請維護 heaven2935-code/sanchuan-cabinet-drawing（GitHub Pages）。最新 V1.3.0 新增四邊安全區、直式設定浮動面板和儲存格模式（合併／拆分／欄列標題／拖曳線條）。保持 02-G01 藍色 Logo，不要更動 EMS-LINE。

先確認 iPhone 直式／橫式是否仍被狀態列和動態島擋住。保留 sanchuan_cabinet_cad_v1 儲存鍵、首次編輯前備份和 version 2 的 gridCells；合併不可移除其他列線條。尺寸調整同座標線會一起移動，內部分界總尺寸固定，末欄／末列可改總尺寸。

幾何、DOM 事件處理器、安裝資產測試已通過；瀏覽器畫面測試受到環境 socket 權限限制，未完成，不可宣稱已通過真機／排版測試。繼續維護 CODE_MAP、CHANGELOG、TODO、KNOWN_ISSUES 和此文件。

最新 V1.4.0 新增直式下方相對游標觸控板和準心動作選單。所有新增分隔、畫線、尺寸、文字標記都是 cursorDraft 預覽，完成才寫入 doc，取消不能殘留圖元。圖內線段局部編輯，邊緣尺寸全欄／列調整；文字與尺寸改為內嵌輸入。先驗證 iPhone 觸控板、選單、鍵盤和直接繪圖共存。不要宣稱 DOM 測試等同 iPhone／排版測試。

- V1.4：直線／尺寸標註可點選起點與終點控制點各自拖曳；游標選單提供調起點／調終點及內嵌 X/Y，另一端固定。取消回退，完成可復原。

- V1.4.1：游標控制改為畫布下方浮動收合按鍵；半透明圓框內按住圓心相對移動，展開選取／取消／動作／完成。取消準心旁選單與座標、底部觸控板佔位。鍵盤／視窗 resize 保留比例與位置，適屏與方向切換才重算。iPhone 真機排版待驗證。
- 返回鍵固定畫布工具列左側，退出編輯／預覽並保留視角；動作選單不自動置中。

- V1.4.2 最新介面：使用者所稱返回為復原（Undo）；移除 backEdit／backFromEdit。commonActions 浮動底列放復原／重做／選取／平移／刪除／動作，游標控制器中央偏下；取消預覽使用控制器取消鍵。常用動作測試通過，真機排版待驗證。

- V1.5.0 最新操作：左側常駐工具列已移除；cells 代表統一選取（點格子／點線／框選），commonActions 為底部常用列，cursorMenu 為新增清單，cellActions 為選取後下方工具列。新增在 dockOpen=false 時使用 showMode 直接觸碰，在 true 時使用 startCursorTool 預覽。contextPartition／contextMove／contextStart／contextEnd／contextTextInput 編輯選取對象。splitCount 內嵌等分數量取代 prompt。設定為浮動面板，縮放比例與位移不自動復歸。功能測試通過，真機觸控排版待驗證；未新增拆料、鎖定或版本管理。

- V1.5.1：按鍵視覺恢復原深色工具列風格，commonActions 圖示上下排列、暖色選取框；cursorSelectLabel 更新文字避免重畫圖示。維持 V1.5 功能與下方配置；真機視覺待驗。

- V1.6.0 最新方向：使用者取消儲存格操作。預設 select，cells 舊模式入口映射 select；gridOverlay 改為直接尺寸標示，不再有字母／數字欄列頭、框選與格子高亮。數值點選經 dimensionEdit；總尺寸按比例調整，局部尺寸依 localPosition 移動相鄰線且外框固定。原 gridCells 只作相容幾何資料，保留舊圖面；合併／等分 UI 隱藏。測試：grid_interactions 驗證總寬高及兩側局部尺寸、無效值拒絕、取消與復原；cursor_interactions 驗證線條／端點／繪圖。iPhone 真機視覺待驗證。

- V1.7.0 最新板件編輯：parts.js 的 CabinetParts 提供類型／編號／metadata 正規化／結構座標 transform 與 round-to-0.01 scale。index.html 的 partEditor 為 stage 浮動面板，contextPart／partList／addBoard 三入口；doc.boardTags 標記結構線位置，shape.part 標記自由線／矩形。boardLines 在點選及清除失效標記時包含四條外框。applyPart 為單次可復原修改，抽屜 children 六件只採使用者輸入加工尺寸，不自動推算。boardLabels 保留於 SVG，名字以 esc 輸出；複製結構線會建立自由圖元；外框刪除只清名稱。測試 parts_interactions.cjs 覆蓋實際處理器、命名／尺寸／移動／抽屜／複製刪除／取消／復原／儲存重載／保留視角。真機鍵盤及浮動面板仍待驗證。

- V1.8.0 最新使用者方向：恢復最初長方形游標觸控板於下方，預設 dockOpen=true，觸控板上方 commonActions 僅「復原／選取／平移」。下方只放結構線／開口的編輯動作；繪圖／尺寸標記／板件／自由圖形編輯及完成取消都在上方。選取整列／整欄用 selected.local=false，數值、cursor move 和 native drag 必須全座標連動，請維持測試。頂部改單列 Flex 避免舊 Grid 隱含列被 48px 高度裁切。不要恢復浮動圓形控制器或六鍵底列。真機排版待驗；DOM 測試不能代替真機。

- V1.9.0 最新：使用者要求恢復第一版的完整設計品質。ui.css 已取代 index 全部累積的 style rules，請以此統一樣式維護，勿再次加入連續覆寫。深灰工具、米白卡片、暖色選取框、24×24 stroke 1.5 SVG；下方三鍵仍復原／選取／平移，結構情境動作四欄+位置數值列，其餘在頂部。品牌＋檔名兩列直式、橫式單列。雲端 browser 開頁逾時，真實截圖及 iPhone 排版尚未確認；不要用 DOM 回歸宣稱視覺通過。


## 2026-10-13 主網址改版（保留 elevation）

使用者最新指定：保留 /elevation/ 原樣，只將主網址 /sanchuan-cabinet-drawing/ 舊程式換成手機新版。新版來源 mobile-source/；建置 scripts/build_mobile_root.py；資料命名 sc-mobile-*。不得將新版發布至 elevation/。


## 2026-10-14 圖面顯示設定

只維護 GitHub 主網址新版，elevation/ 保留原樣。顯示偏好 display-style.js / sc-mobile-display-v1；執行 python scripts/build.py、node tests/verify.cjs、node tests/display.cjs。根目錄建置 scripts/build_mobile_root.py。勿改回每條線不同色或非中點標記。


## 2026-10-14 線條選色與深色版

正式程式在主網址，elevation/ 不改。顯示偏好 sc-mobile-display-v1 包含 theme 及 lineColor；維護 mobile-source/display-style.js、mobile-ui.js、mobile-ui.css。執行 scripts/build.py、tests/verify.cjs、tests/display.cjs。自訂線色保留，主題預設色可隨版本調整。


## 2026-10-14 櫃內深度與操作檢查

只修改主網址與 mobile-source，獨立 elevation/ 保留原樣（已是第51版）。本輪深度視圖由 displaySettings.interiorView=flat/depth 與 CabinetDepth 驅動，depthRuntime.editing 暫停示意以精確編輯。mMenuOpen 取消未確認預覽；自動草稿跳過 previewing。執行 python scripts/build_mobile_root.py；npm --prefix mobile-source install；npm --prefix mobile-source run verify。不要將示意投影當真實深度或拆料依據。先維持可用動作／鎖定／合併與數值驗證，再做實機優化。


## 最新交接：2026-10-14 精準操作

已加入mobile-precision.js與cabinet-faces.js，主網址手機版已處理樣式遮擋、相對拖曳、方向微調、量測條件、踢腳內退與面板縫。獨立elevation/必須保留原狀。

檢查先讀TODO、KNOWN_ISSUES；測試先python mobile-source/scripts/build.py，再npm --prefix mobile-source ci及npm --prefix mobile-source run verify。precision偏好命名空間sc-mobile-precision-v1；圖面新增kickSetback（50）／faceGap（4），取手縫預設25。使用者希望逐步做，照片透視計畫仍按四階段。

材質需求目前先記錄：日後可上傳木皮型錄／自拍圖片，對門片、抽屜頭、桶身分別套用，抽屜頭可跳色；應先完成單片／單抽屜選取與純色，再做紋理方向、實際比例及連紋。不要宣稱這輪已上線材質功能。

若使用者指定Claude另一個應用，先檢查並提出重現步驟、影響、優先級與改善建議；不得把主網址手機版修改覆蓋到elevation/。
