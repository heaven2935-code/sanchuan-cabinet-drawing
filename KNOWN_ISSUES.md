# KNOWN_ISSUES
- 不能以網頁按鈕強制隱藏 Safari 系統網址列；須從 iPhone「加入主畫面」開啟為網頁 App。
- Safari 的橫向螢幕方向由 iOS 使用者設備決定，Web App manifest orientation 不保證所有機型鎖定方向。
- 目前只做 Chromium 模擬尺寸測試，真機 iPhone Safari 還需確認。
- 本機資料僅儲存在開啟該網站的瀏覽器環境，主畫面 Web App 的儲存空間可能與 Safari 分開；重要圖面請先匯出 JSON。