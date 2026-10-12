# KNOWN_ISSUES

- 本次幾何與實際事件處理器測試通過；DOM 替身不能驗證 CSS 排版。
- 本次 Chrome 畫面測試被執行環境 socket 權限限制，未完成；安全區及 iPhone 觸控真機待確認。
- 合併只支援完整長方形範圍；新增欄／列為選取格等分，保留櫃體總尺寸。
- 邊緣欄列標題依全圖座標分界調整；圖內分隔線可局部移動。遇到跨列／欄合併格時，需連動完整長方形範圍；不能讓格子重疊。
- 最新 JSON 的 gridCells 保存局部合併，舊版網站無法完整呈現，請使用 V1.3。沿用本機儲存鍵並備份首次編輯前內容。
- Safari 系統網址列無法強制隱藏，需從主畫面圖示開啟；方向由 iOS 決定。
- 主畫面 Web App 和 Safari 可能使用不同儲存空間，重要圖面請匯出 JSON。
- iOS 既有主畫面捷徑可能保留舊圖示快取。

- V1.4 的動作選單「移動／刪除」需先選取線段或自由圖元；單一格子不能刪成櫃體中的空洞。
- 游標選單與下方觸控板的真機畫面／手感尚未驗證；已通過實際 JavaScript 事件處理器測試（DOM 替身）。

- V1.4.1：游標控制改為畫布下方浮動收合按鍵；半透明圓框內按住圓心相對移動，展開選取／取消／動作／完成。取消準心旁選單與座標、底部觸控板佔位。鍵盤／視窗 resize 保留比例與位置，適屏與方向切換才重算。iPhone 真機排版待驗證。
- 返回鍵固定畫布工具列左側，退出編輯／預覽並保留視角；動作選單不自動置中。

- V1.4.2 最新介面：使用者所稱返回為復原（Undo）；移除 backEdit／backFromEdit。commonActions 浮動底列放復原／重做／選取／平移／刪除／動作，游標控制器中央偏下；取消預覽使用控制器取消鍵。常用動作測試通過，真機排版待驗證。

- V1.5.0 最新操作：左側常駐工具列已移除；cells 代表統一選取（點格子／點線／框選），commonActions 為底部常用列，cursorMenu 為新增清單，cellActions 為選取後下方工具列。新增在 dockOpen=false 時使用 showMode 直接觸碰，在 true 時使用 startCursorTool 預覽。contextPartition／contextMove／contextStart／contextEnd／contextTextInput 編輯選取對象。splitCount 內嵌等分數量取代 prompt。設定為浮動面板，縮放比例與位移不自動復歸。功能測試通過，真機觸控排版待驗證；未新增拆料、鎖定或版本管理。

- V1.5.1：按鍵視覺恢復原深色工具列風格，commonActions 圖示上下排列、暖色選取框；cursorSelectLabel 更新文字避免重畫圖示。維持 V1.5 功能與下方配置；真機視覺待驗。

- V1.6.0 最新方向：使用者取消儲存格操作。預設 select，cells 舊模式入口映射 select；gridOverlay 改為直接尺寸標示，不再有字母／數字欄列頭、框選與格子高亮。數值點選經 dimensionEdit；總尺寸按比例調整，局部尺寸依 localPosition 移動相鄰線且外框固定。原 gridCells 只作相容幾何資料，保留舊圖面；合併／等分 UI 隱藏。測試：grid_interactions 驗證總寬高及兩側局部尺寸、無效值拒絕、取消與復原；cursor_interactions 驗證線條／端點／繪圖。iPhone 真機視覺待驗證。

- V1.7 板件為立面線／輪廓加板件資料；立面寬高不代表加工尺寸，未自動產生扣板厚／縫隙的拆料清單。抽屜六子件加工尺寸須手動設定。
- 結構分隔板的尺寸與位置透過「調整圖面尺寸」或既有尺寸標示連動；複製是自由板件，不新增結構分隔；櫃體外框不可刪除，編輯器刪除外框板件僅清除命名。
- V1.7 浮動面板未經 iPhone 真機排版驗證；JavaScript 事件測試通過不代表觸控／鍵盤排版已驗證。

- V1.8 改為底部佔位的長方形觸控板；選取後的情境列會增高 footer，保留既有 view 位移與比例。收起觸控板可增加圖面高度。Chrome／iPhone 真機 CSS 驗證仍未完成。
- 整列／整欄編輯指同一 Y／X 的結構線；只支援保持長方形開口且至少 1 mm 的合法位置，不能移動自由線／標記等其他圖元。外框仍由總寬／高調整。

- V1.9 本次雲端瀏覽器建立頁面逾時，未取得實際畫面。互動測試通過僅代表 JavaScript 行為；新版 CSS 的直／橫式、safe-area 與真機視覺須另行確認。
- 直式頂部為完整品牌列及檔名列；滿版模式收起品牌列，觸控板可從上方工具收合。


## 2026-10-13：手機版 elevation/

新版位於 elevation/index.html，原網址保持 https://heaven2935-code.github.io/sanchuan-cabinet-drawing/elevation/ 。以圖面為主、點選顯示操作；需要位置調整時顯示可拖動的 XY 尺軌。程式來源、驗證與詳細文件位於 elevation/source/；重建使用 python3 scripts/build_mobile_elevation.py。既有資料沿用 sc-cab 存檔位置。舊版已備份至 backup/elevation-before-mobile-20261013-4ae2031。

新版尚未完成 iPhone 實機驗收；座標、縮放及計算檢查已通過。
