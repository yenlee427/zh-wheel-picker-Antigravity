# v3 開發計畫：中文輸入法遊戲（Typing Blocks）— 省事 MVP 版（Vercel + Ably）

> 目標：在既有「輪盤抽選器」Next.js 專案中新增一個 Wordwall 風格的小遊戲入口與完整可玩 MVP，並部署到 Vercel。  
> 多人即時：使用 Ably Realtime（Free plan 可先跑 MVP）。

---

## 1. 產品範圍（MVP）

### 1.1 核心玩法
- 老師建立「房間」並設定：
  - 生詞清單：預設 20 個（可調整數量）
  - 速度：5 段（Level 1–5）
- 學生用「房間代碼」加入 → 輸入姓名 → 進入等候室
- 老師按「開始遊戲」後：
  - 方塊從畫面上方隨機掉落（持續生成）
  - 學生輸入正確生詞 → 消除「畫面中最接近底部、且文字相同」的方塊
  - 方塊堆滿畫面 → 該玩家遊戲結束
- 記分與排名：
  - 每次成功消除得分
  - 同房間所有學生排行榜即時更新（老師端彙整/或由事件推送）

### 1.2 不做（MVP 不納入）
- 長期歷史資料（跨課堂保存）
- 帳號系統（登入/權限）
- AI 自動出題/自動生成詞庫
- 觀戰模式、題目分類、統計報表

---

## 2. 平台與技術選型（省事可部署）

### 2.1 前端 / 框架
- Next.js（App Router）+ TypeScript
- Tailwind CSS（沿用專案既有風格）
- 遊戲渲染：DOM + `requestAnimationFrame`（省事、易維護）
  - 每個方塊是絕對定位的 `<div>`，用 `transform: translate3d(...)` 更新位置

### 2.2 即時通訊（多人同步）
- Ably Realtime（Channels）
- Token Auth：由 Next.js API route 簽發 token，前端不暴露 Ably API Key

### 2.3 伺服端（Vercel）
- Vercel 部署 Next.js
- Next.js Route Handlers：
  - `/api/ably/token`：簽 Ably token（server-side）
  - （可選）`/api/rooms/create`：產生房間代碼（也可純前端生成）

> MVP 不使用額外 DB；房間狀態以「老師端為權威」＋ Ably channel 事件同步。

---

## 3. 資料模型（TypeScript）

### 3.1 房間設定
```ts
export type SpeedLevel = 1 | 2 | 3 | 4 | 5;

export type RoomSettings = {
  wordCount: number;      // 預設 20，可調整
  speedLevel: SpeedLevel; // 1–5
  maxPlayers: number;     // MVP：例如 50（可固定或可調）
};
```

### 3.2 房間狀態（老師端權威）
```ts
export type RoomStatus = "setup" | "lobby" | "running" | "finished";

export type Player = {
  id: string;        // crypto.randomUUID()
  name: string;
  score: number;
  joinedAt: number;  // Date.now()
  lastSeenAt: number;
  isGameOver: boolean;
};

export type RoomState = {
  roomCode: string;         // 6 碼（A-Z0-9）
  status: RoomStatus;
  settings: RoomSettings;
  words: string[];          // 長度 = wordCount
  teacherClientId: string;  // Ably clientId
  seed: string | null;      // 遊戲開始時生成
  startAt: number | null;   // epoch ms
  players: Player[];
};
```

### 3.3 遊戲內方塊模型（每位玩家本機）
```ts
export type FallingBlock = {
  id: string;
  word: string;
  lane: number;   // 0..(lanes-1)
  y: number;      // 畫面座標
  vy: number;     // 下落速度（px/s）
  isSettled: boolean;
};
```

---

## 4. 即時事件（Ably channel message）

> Channel 命名：`typing-room:{roomCode}`（同房間共用）

### 4.1 事件型別
```ts
export type RoomEvent =
  | { type: "ROOM_STATE"; payload: RoomState }                 // 老師端廣播快照
  | { type: "PLAYER_JOIN"; payload: { playerId: string; name: string } }
  | { type: "PLAYER_LEAVE"; payload: { playerId: string } }
  | { type: "GAME_START"; payload: { seed: string; startAt: number; settings: RoomSettings; words: string[] } }
  | { type: "SCORE_UPDATE"; payload: { playerId: string; score: number } }
  | { type: "PLAYER_GAME_OVER"; payload: { playerId: string } }
  | { type: "GAME_END"; payload: { endedAt: number } };
```

### 4.2 同步規則（MVP）
- 老師端維護 `RoomState`，每次變更（設定完成、玩家加入、開始遊戲、分數更新）就 publish `ROOM_STATE`（快照）。
- 學生端以最新 `ROOM_STATE` 更新 UI（名單/排行榜/狀態）。
- `GAME_START` 事件含 `seed + startAt + words + settings`，學生收到後開始本機遊戲迴圈。

---

## 5. 遊戲機制規格（MVP 寫死）

### 5.1 畫面與堆疊
- 遊戲區域：固定高度容器（RWD 自適應，最小高度例如 60vh）
- 掉落採「多車道 lanes」：
  - 桌機：4 lanes
  - 平板：3 lanes
  - 手機：2 lanes
- 每個方塊固定高度（例如 48px），堆疊時以 lane 為單位向上堆

### 5.2 生成（spawn）
- 每位玩家本機依 `speedLevel` 取得：
  - `spawnIntervalMs`
  - `fallSpeedPxPerSec`
- 生成詞彙：依 `seed` 的 deterministic RNG（例如 mulberry32），從 `words[]` 隨機抽 index
- 生成 lane：同 RNG 產生 lane

> 目的：每位玩家序列一致（MVP），減少即時訊息量。

### 5.3 消除規則（輸入命中）
- 玩家輸入框 Enter 後：
  - 正規化：trim，保留原字形（MVP 不做同音/繁簡轉換）
  - 在「當前 active blocks」中找出 `word === input` 的候選
  - 選擇 **y 最大**（最接近底部）的那一個消除
- 計分：
  - 基礎分：+10
  - 速度加成：`+ (speedLevel - 1)`（可寫死或不加成；MVP 可只做 +10）

### 5.4 結束條件
- 若任一 lane 的堆疊高度使方塊頂部超過遊戲區上緣 → 該玩家 `isGameOver = true`
- 房間結束：
  - MVP：老師端按「結束遊戲」送出 `GAME_END`
  - 若全部玩家都 game over，老師端自動結束（可選）

---

## 6. UI/頁面流程與路由

### 6.1 主站入口整合（輪盤專案主頁）
- 在既有首頁（`/`）新增「小遊戲」卡片：
  - 「中文輸入法遊戲」→ `/games/typing`

### 6.2 新增路由
- `/games/typing`：入口頁
  - 老師：建立房間（Create Room）
  - 學生：輸入房間代碼（Join Room）
- `/games/typing/teacher/[code]`：老師控制台（設定/等候室/開始/結束）
- `/games/typing/room/[code]`：學生頁（輸入姓名 → lobby → 遊戲）

### 6.3 Wordwall 風格（MVP 視覺）
- 入口頁採卡片 + 大按鈕
- 遊戲畫面：上方顯示房間代碼、速度、分數；中間遊戲區；下方輸入框（手機固定在底部）

---

## 7. RWD / 可用性 / 無障礙（必做）

- 觸控友善：按鈕高度 ≥ 44px，輸入框夠大、間距足夠
- 手機輸入：
  - 輸入框固定在底部，避免被遊戲區擠掉
  - Enter 送出；送出後自動清空
- 無障礙：
  - 分數與狀態變更用 `aria-live="polite"`
  - 所有按鈕有可讀 label
  - Tab 可操作主要控制項
- 效能：
  - `requestAnimationFrame` 單一 loop
  - DOM 更新只改 `transform`，避免頻繁改 layout
  - blocks 數量上限（例如 200）作為防爆保護

---

## 8. 安全與防呆（MVP 基線）

- 老師身分：
  - 建房時產生 `teacherSecret`（存在 `sessionStorage`）
  - 老師頁面操作（開始/結束/更新設定）需帶 `teacherSecret`
  - MVP 防呆等級：避免學生誤觸；不做高強度防作弊
- 房間狀態鎖定：
  - status = running 後禁止更改詞彙清單（避免不同步）
  - running 後加入：顯示「遊戲進行中」並提示等待下一局（MVP 可直接禁止加入）
- 名稱規則：
  - 長度 1–20
  - 去除前後空白
  - 同名允許或自動加尾碼（寫死規則）

---

## 9. 里程碑（MVP 省事順序）＋ Commit 規劃

### Milestone 0：路由與入口整合
- 新增 `/games/typing` 入口頁
- 主頁加入遊戲卡片
- **commit**：`feat: add typing game entry and routes`

### Milestone 1：單人遊戲核心（不含多人）
- 遊戲區 + 掉落方塊 + 輸入消除 + 結束 + 分數
- 速度 1–5（生成頻率 + 下落速度）
- **commit**：`feat: implement typing blocks single-player MVP`

### Milestone 2：老師建房 + 設定詞庫
- 老師端可編輯詞彙（預設 20，可調）
- 產生房間代碼，顯示分享連結與代碼
- **commit**：`feat: add teacher room setup and word editor`

### Milestone 3：學生加入 + 等候室 + 開始同步
- 學生輸入姓名加入 lobby
- 老師看到名單
- 老師按開始 → `GAME_START`（seed + startAt + words + settings）
- **commit**：`feat: add lobby join flow and game start broadcast`

### Milestone 4：分數同步與排行榜
- 學生端每次得分 publish `SCORE_UPDATE`
- 老師端彙整排行榜並 broadcast `ROOM_STATE`
- 學生端顯示排行榜（MVP：前 10 名）
- **commit**：`feat: add realtime scoreboard and ranking`

### Milestone 5：部署檢查與文件
- README：本機啟動、Ably 設定、Vercel env vars
- **commit**：`docs: add v3 typing game setup and deploy instructions`

---

## 10. 建議檔案結構（web/）

```
web/
  app/
    page.tsx                       # 既有主頁：新增遊戲入口卡片
    games/
      typing/
        page.tsx                   # 遊戲入口（老師/學生）
        teacher/
          [code]/
            page.tsx               # 老師控制台（Client）
        room/
          [code]/
            page.tsx               # 學生頁（Client）
    api/
      ably/
        token/
          route.ts                 # 簽發 Ably token（Server）
  components/
    typing/
      TeacherSetupPanel.tsx
      Lobby.tsx
      GameBoard.tsx
      Scoreboard.tsx
      SpeedSelector.tsx
      WordGridEditor.tsx
  lib/
    typing/
      constants.ts                 # DEFAULT_WORD_COUNT, SPEED_PRESETS...
      rng.ts                       # mulberry32 / seed utils
      roomCode.ts                  # 6 碼代碼產生
      types.ts
      ablyClient.ts                # 連線封裝（token auth）
      gameEngine.ts                # blocks 更新、碰撞/堆疊、消除
```

---

## 11. 測試清單（最少要跑）

### 11.1 功能
- 老師：建立房間 → 編輯 20 個詞 → 設定完成 → lobby 可加入
- 學生：輸入代碼 → 輸入姓名 → 進 lobby
- 老師：開始遊戲 → 學生端同步開始
- 學生：輸入命中可消除最底部同詞方塊、分數增加、排行榜更新
- 堆滿畫面：玩家遊戲結束；老師可手動結束房間

### 11.2 裝置
- Chrome（桌機）
- iOS Safari（手機）
- Android Chrome（手機）
- iPad（直/橫）
- 鍵盤輸入：Enter、快速連續輸入

### 11.3 可靠性
- 重新整理頁面：
  - 老師端：重新進入仍可重新 broadcast `ROOM_STATE`
  - 學生端：顯示「請重新加入房間」（MVP 可接受）
- 斷線：
  - Ably reconnect 後能重新訂閱 channel
  - UI 顯示「連線中/已斷線」狀態（MVP 可用簡單 badge）

---

## 12. 部署到 Vercel（MVP 步驟）

### 12.1 Ably 設定
- 建立 Ably App，取得 API Key
- 在 Vercel 專案設定 Environment Variables（Production/Preview 都設）：
  - `ABLY_API_KEY`：Ably API key（只在 server 端使用）
  - `NEXT_PUBLIC_APP_URL`：站台 URL（可選，用於產生分享連結）

### 12.2 Vercel 設定
- Root Directory = `web`（沿用你的專案設定）
- Build Command：`npm run build`
- Output：Next.js default
- 部署後確認：
  - `/games/typing` 可開
  - teacher / student flow 可走通

---

## 13. 可選增強（v3.1+）
- 匯入/匯出詞庫（JSON/CSV）
- 房間保存（Vercel KV / Supabase）讓老師刷新也不丟房間
- 觀戰模式（running 時加入只能看排行榜）
- 題目分級（同一房間多回合、回合結果統計）
- Cheating 抑制：僅接受「由遊戲端產生的可驗證事件」（需要 server arbitration，v4 再做）

---

## 14. 交付定義（Definition of Done）
- 入口頁與路由整合完成（主頁可進遊戲）
- 老師可建房、設定詞庫、開局
- 學生可加入、玩遊戲、計分、看排行榜
- Vercel production build 成功，線上可操作
- README 含本機啟動、Ably env vars、Vercel 部署流程
