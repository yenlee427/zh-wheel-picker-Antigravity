# 中文小遊戲樂園 (zh-wheel-picker) v3

集合多種中文互動玩法的 Next.js 專案，目前包含題庫抽題與 Typing Blocks 多人即時遊戲。

## 功能特色

- **題庫抽題模式**：可建立、編輯、儲存多組題庫並進行抽題。
- **題庫總覽模式**：同頁快速操作多組題庫，保留各自紀錄。
- **Typing Blocks（v3）**：
  - 老師建立房間與詞庫，學生輸入代碼加入
  - Ably Realtime 即時同步開始、分數與排行榜
  - 每次命中輸入 +10 分，錯過堆疊即遊戲結束
- **資料持久化**：抽題資料使用 localStorage，老師房間為前端暫存（MVP）。
- **RWD 響應式設計**：桌機、平板、手機皆可操作。

## 技術架構

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context + localStorage
- **Realtime**: Ably Realtime (token auth)

## 專案結構

```
web/
├── app/
│   ├── page.tsx                     # 首頁入口
│   ├── single/page.tsx              # 單人題庫頁
│   ├── dashboard/page.tsx           # 題庫總覽頁
│   ├── games/typing/page.tsx        # Typing Blocks 入口
│   ├── games/typing/teacher/[code]  # 老師控制台
│   ├── games/typing/room/[code]     # 學生遊戲頁
│   └── api/
│       ├── typing/rooms/create      # 建立房間
│       └── ably/token               # 簽發 Ably token
├── components/
│   ├── Wheel.tsx                    # 抽題輪盤 SVG
│   ├── SingleClient.tsx             # 抽題單人模式
│   ├── DashboardClient.tsx          # 抽題總覽模式
│   └── typing/                      # Typing Blocks 元件
├── lib/
│   ├── contexts/                    # AppState Context
│   ├── typing/                      # 遊戲引擎、型別、Ably client
│   ├── migration.ts                 # 抽題資料遷移邏輯
│   └── wheelMath.ts                 # 抽題輪盤計算
└── types/                           # TypeScript 定義
```

## 開發指南

1. 安裝依賴：
   ```bash
   cd web
   npm install
   ```

2. 設定環境變數（`.env.local`）：
   ```bash
   ABLY_API_KEY=your-ably-api-key
   ROOM_SIGNING_SECRET=a-long-random-secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

3. 開啟瀏覽器訪問 `http://localhost:3000`

## Typing Blocks 流程

1. 進入 `/games/typing`，老師建立房間。
2. 系統回傳房間代碼，分享給學生。
3. 學生進入 `/games/typing/room/[code]`，輸入姓名加入。
4. 老師在 `/games/typing/teacher/[code]` 調整詞庫與速度後開始遊戲。
5. 遊戲期間即時同步排行榜；老師可手動結束。

## 部署（Vercel）

1. 專案 Root Directory 設定為 `web`
2. Build Command：`npm run build`
3. 在 Vercel 專案環境變數加入：
   - `ABLY_API_KEY`
   - `ROOM_SIGNING_SECRET`
   - `NEXT_PUBLIC_APP_URL`

## 資料遷移

抽題模組支援自動從 v1 版本遷移資料。若偵測到舊版 localStorage keys（`zhWheelPicker:slots` 等），會自動匯入為預設題庫並保留備份。
