# 下一次接續指示

接續三川工方手機繪圖版本，先閱讀 CODE_MAP.md、CHANGELOG.md 與 KNOWN_ISSUES.md。

優先原則：圖面盡量大；直接點選；只顯示當前項目可用的動作；完成後收起操作。

需要調整位置時顯示下緣 X、右緣 Y 尺軌，對準線延伸到尺軌；拖動標示控制準星。X 是距櫃左，Y 是離櫃底高度。按鍵浮在圖紙內，完成後尺軌收起。

先根據使用者的 iPhone 操作回饋修正一個明確問題，再處理下一項。保留原引擎、數值限制、歷史與匯出；不要重新加入大型常駐圓盤或側欄。


## 2026-10-14 圖面顯示設定

只維護 GitHub 主網址新版，elevation/ 保留原樣。顯示偏好 display-style.js / sc-mobile-display-v1；執行 python scripts/build.py、node tests/verify.cjs、node tests/display.cjs。根目錄建置 scripts/build_mobile_root.py。勿改回每條線不同色或非中點標記。
