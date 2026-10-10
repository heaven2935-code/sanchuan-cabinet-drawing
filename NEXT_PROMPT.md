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
