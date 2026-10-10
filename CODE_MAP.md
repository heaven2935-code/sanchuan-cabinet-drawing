# CODE_MAP
- index.html: 繪圖 UI、CSS、SVG 畫布核心、觸控事件、本機儲存與輸出。
- manifest.webmanifest: 主畫面安裝資訊（standalone、landscape）。
- icon-180.png / icon-512.png: Web App 桌面圖示。
- index.html: #displayMode 控制畫布滿版；#installPrompt 指引加入主畫面；syncViewportHeight 校正 iOS 可視高度。
- scripts/build_icons.py: 可重建主畫面 PNG 圖示（Pillow）。
- tests/install_assets.py: PNG CRC、解碼、尺寸及主畫面安裝連結驗證。
