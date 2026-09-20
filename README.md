# 漢字字體設計標本館 (Typography Specimen Archive)

一個基於現代 Web 技術與 **Impeccable Design System** 打造的高品質漢字字體設計標本展示庫與檢索平台，收錄並智慧識別超過 1,460 幅漢字與字體設計作品。

---

## 🌟 特色功能 (Features)

1. **豐富的字體設計典藏**：收錄 1,460+ 幅字體設計作品，涵蓋書法、黑體、宋體、手寫、標題裝飾等多元風格。
2. **AI 智慧識別與結構化標記**：
   - 採用 RapidOCR / ONNX 技術提取畫面核心漢字文字與排版特徵。
   - 自動提取中文主標題、英譯副標與 9 大風格標籤（書法手寫、黑體無襯線、宋體明朝體、創意標題、復古國潮、童趣手繪、極簡幾何、賽博未來、字體教程）。
3. **沉浸式展示體驗 (Impeccable Craft)**：
   - 深色調現代藝廊風格（Gallery Black Theme），凸顯字形細節與墨韻。
   - 虛擬滾動 / 分頁平滑載入，極速流暢。
   - 互動式標本詳情視窗（Specimen Lightbox），支援高解析度燈箱、字形拆解與特徵標籤。
4. **即時檢索與篩選**：
   - 支援依風格分類、拼音、漢字關鍵字即時搜尋。
   - 支援收藏最愛與視圖切換。

---

## 📂 目錄結構 (Project Structure)

```text
├── 1000+优秀字体作品参考/    # 高畫質字體作品圖像資產 (1,465 items)
├── css/
│   ├── base.css              # 基礎重置與 Design Tokens
│   ├── layout.css            # 藝廊網格、導航列與響應式佈局
│   ├── components.css        # 卡片元件、篩選標籤、搜尋列
│   └── modal.css             # 標本詳情 Modal 與燈箱
├── js/
│   ├── catalog-data.js       # 智慧識別後的 1,465 幅作品元數據
│   ├── app.js                # 藝廊渲染、篩選、搜尋與互動邏輯
│   ├── inspector.js          # 標本鏡鑑檢視器、色譜提取與鍵盤導覽
│   ├── favorites.js          # 本地收藏夾狀態管理
│   └── icons.js              # 幾何向量圖標庫
├── scripts/
│   ├── smart_font_analyzer.py # RapidOCR 字體分析與語意提取腳本
│   └── generate_catalog.py   # 目錄自動建構腳本
├── index.html                # 入口主頁面
├── PRODUCT.md                # 產品規格說明書
├── DESIGN.md                 # 設計規範與設計系統
└── README.md
```

---

## 🚀 本地預覽 (Local Preview)

本專案為純前端靜態架構，無需複雜建置工具，只需啟動任意靜態伺服器即可瀏覽：

```bash
# 使用 Python 啟動本地伺服器
python -m http.server 8080

# 瀏覽器打開：
http://localhost:8080
```

---

## 🛠 技術棧 (Tech Stack)

- **UI / Design**: HTML5, Vanilla Modern CSS (CSS Grid, Flexbox, Custom Properties), Impeccable Design Principles
- **Logic**: Vanilla JavaScript (ES6+)
- **OCR / Data Analysis**: Python, RapidOCR, ONNXRuntime
- **Version Control**: Git & GitHub
