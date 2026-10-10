# NEXT_PROMPT.md

請延續「三川工方｜精準櫃體立面繪圖 V1」的既有 `index.html`，**不要重寫或移除已可使用的功能**。優先確認 iPhone 橫向畫面上遠端觸控板的可用性、毫米精準定位與局部放大鏡；依測試反饋進行最小必要修正。開始增加門片與抽屜前，先確認櫃體結構（18mm 板、4mm 包背、側板全高、門片間隙、鉸鏈配置等）並規劃資料模型，區分外觀門片尺寸、內部淨空與木板實際裁切尺寸。每次變更執行 `tests/browser_smoke.py` 並更新 CODE_MAP / CHANGELOG / TODO / KNOWN_ISSUES。

## 開發任務（V1.1 之後）
優先確認 iPhone Safari 透過 HTTPS 網址能夠真實操作。禁止把 HTML 附件預覽畫面視為已通過手機實機測試。在部署前先詢問使用者並確認存放的新 GitHub repository，避免覆蓋既有服務。