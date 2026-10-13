# 三川工方｜手機櫃體立面繪圖

正式入口：https://heaven2935-code.github.io/sanchuan-cabinet-drawing/

獨立 Elevation：https://heaven2935-code.github.io/sanchuan-cabinet-drawing/elevation/ （此輪未修改）

## 操作

點線或格子顯示可用動作；單指平移、雙指縮放。移動與分隔可輸入精確公釐數值，確定後記錄一次復原；取消不改圖面。

切到「櫃內」後，按「平面／深度」切換固定視角示意。側板、背板與層板以淡色板面區分。編輯時回到平面，完成後恢復。示意不代表實際櫃深；後方斜線不是獨立可移動板件。

右上選單 → 圖面顯示與尺軌，可選淺色／深色、櫃體線色、格線／點陣與格距、選取色、尺寸色及尺軌左右位置。門片斜線、尺寸及格內名稱預設關閉；選取線時顯示相關尺寸。

## 存檔

圖面保存在目前裝置的瀏覽器，使用 sc-mobile-*，與 elevation 的資料隔離。換裝置請下載可編輯 JSON 備份，再匯入。備份可包含照片；顯示偏好保存在目前裝置，不隨圖面備份。

## 維護與驗證

根目錄分發檔由 mobile-source 建置：

```sh
python scripts/build_mobile_root.py
npm --prefix mobile-source install
npm --prefix mobile-source run verify
```

驗證包含原有幾何、顯示與配色、深度投影，以及完整 DOM 事件操作。47 櫃型在三種寬度下完成 1547 次格子及 625 次線／層板選取。詳見 MOBILE_AUDIT.md；DOM 測試不代表已通過 iPhone 真機驗收。
