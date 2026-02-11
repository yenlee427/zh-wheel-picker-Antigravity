# 繁中輪盤抽選器 (Zh-Wheel-Picker) v2.0

簡單好用的線上抽籤工具，支援多組清單管理與同時抽選功能。

## 功能特色

- **多清單管理**：可建立、編輯、儲存多組輪盤設定。
- **Dashboard 總覽**：同時檢視並操作前 6 組活躍的輪盤，適合多工處理。
- **單色模式**：Dashboard 採用簡潔的單色視覺設計。
- **資料持久化**：所有資料自動儲存於瀏覽器 localStorage。
- **RWD 響應式設計**：支援桌機、平板、手機完美顯示。

## 技術架構

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context + localStorage

## 專案結構

```
web/
├── app/
│   ├── page.tsx               # 首頁入口
│   ├── single/page.tsx        # 單輪盤管理頁面
│   └── dashboard/page.tsx     # 多輪盤總覽頁面
├── components/
│   ├── Wheel.tsx              # 輪盤 SVG 元件 (支援 Multi/Mono 模式)
│   ├── DashboardWheelCard.tsx # Dashboard 卡片
│   ├── ListSelector.tsx       # 清單選擇與 CRUD
│   └── ...
├── lib/
│   ├── contexts/              # AppState Context
│   ├── migration.ts           # 資料遷移邏輯 (v1 -> v2)
│   └── wheelMath.ts           # 數學計算
└── types/                     # TypeScript 定義
```

## 開發指南

1. 安裝依賴：
   ```bash
   cd web
   npm install
   ```

2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

3. 開啟瀏覽器訪問 `http://localhost:3000`

## 資料遷移

本專案支援自動從 v1 版本遷移資料。若偵測到舊版 localStorage keys (`zhWheelPicker:slots`, etc.)，會自動將其匯入為「預設清單」並保留舊資料備份。
