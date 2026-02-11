## Plan: 繁體中文輪盤抽選網站開發規格

**專案概述：** 建置一個 MVP 級別的繁體中文輪盤抽選網站，使用 Next.js 14+ App Router + TypeScript，支援響應式設計（桌機/平板/手機），資料持久化使用 localStorage，並可部署至 Vercel。採用 Git 版控，遵循 Conventional Commits 規範，透過功能分支開發策略確保程式碼品質。

---

## 一、使用者流程

### 主要路徑
1. **首次進入** → 看到預設 10 格空白輪盤 + 編輯區
2. **填寫格子內容** → 在輸入框逐一輸入選項（例如：「蘋果」「香蕉」「西瓜」）
3. **調整格子數量**（可選）→ 透過數字輸入或加減按鈕調整（2–50）
4. **開始旋轉** → 點擊按鈕，輪盤旋轉 2–4 秒後停止
5. **顯示結果** → 明確顯示抽到的選項（視覺+文字）
6. **查看歷史** → 下方 History 區塊新增一筆記錄（時間 + 結果）
7. **重複抽選** → 可再次點擊「開始旋轉」
8. **管理功能**：
   - 清除歷史：清空 History 列表
   - 清空格子：將所有格子內容清為空字串
9. **重新整理頁面** → 格子內容、格子數、歷史紀錄皆保留（localStorage）

### 防呆路徑
- 所有格子內容皆空時，「開始旋轉」按鈕 disabled 或彈出提示
- 格子數變更時：若減少，保留前 N 格；若增加，補空字串

---

## 二、資料模型（TypeScript）

```typescript
// types/wheel.ts

/** 輪盤格子 */
export interface WheelSlot {
  id: number;          // 扇形位置索引（與陣列 index 一致，方便角度計算）
  label: string;       // 格子文字內容
}

/** 抽選結果歷史 */
export interface HistoryRecord {
  id: string;          // 唯一 ID（建議用 crypto.randomUUID()）
  result: string;      // 抽到的格子文字
  timestamp: number;   // Unix timestamp（毫秒）
}

/** 應用狀態 */
export interface WheelState {
  slotCount: number;        // 格子數量（2–50）
  slots: WheelSlot[];       // 格子陣列
  history: HistoryRecord[]; // 歷史紀錄（最新在前，最多保留 100 筆）
}

/** localStorage 結構 */
export interface LocalStorageData {
  slotCount: number;
  slots: WheelSlot[];
  history: HistoryRecord[];
  version: string;     // 例如 "1.0"，供未來資料遷移使用
}
```

### localStorage Key 設計
- **Key**: `zh-wheel-picker-state`
- **Value**: JSON.stringify(LocalStorageData)
- **寫入時機**: 
  - 格子內容變更（debounce 500ms）
  - 格子數量變更（即時）
  - 抽選完成後新增歷史（即時）
  - 清除歷史/清空格子（即時）

---

## 三、技術選型

| 項目 | 選擇 | 理由 |
|------|------|------|
| **框架** | Next.js 14+ (App Router) | SSR/SSG 支援、Vercel 原生最佳化 |
| **語言** | TypeScript 5+ | 型別安全、開發體驗 |
| **樣式** | Tailwind CSS（MVP） | 原子類別快速開發、RWD 方便；MVP 先不混用 CSS Modules，避免規格不一致 |
| **狀態管理** | React useState + useEffect | MVP 級別，無需 Zustand/Redux |
| **動畫** | CSS `transform` + `transition` | 硬體加速、效能最佳 |
| **日期處理** | 原生 `Date` / `Intl.DateTimeFormat` | 避免 dayjs 增加 bundle size |
| **部署** | Vercel | 一鍵部署、自動 HTTPS、CDN |

---

## 四、元件拆分

```
app/
├── page.tsx                    // 主頁面（Client Component）
├── layout.tsx                  // Root Layout（設定中文 lang）
└── components/
    ├── Wheel.tsx               // 輪盤視覺元件（SVG）
    ├── WheelEditor.tsx         // 格子內容編輯區
    ├── Controls.tsx            // 控制按鈕區（開始旋轉、清除、清空）
    ├── Result.tsx              // 顯示抽選結果（含 aria-live）
    └── History.tsx             // 歷史紀錄列表
```

### 各元件職責

#### **Wheel.tsx**
- Props: `slots: WheelSlot[]`, `rotationDeg: number`, `isSpinning: boolean`, `onSpinEnd?: () => void`
- 繪製輪盤（SVG，MVP 固定採用）
- 旋轉動畫（CSS `transform: rotate()`）
- 指針固定於頂部中央
- 格子文字過長處理：
  - 長度 > 8 字：截斷顯示「XXX...」
  - 或使用 `textOverflow` + 自適應 `font-size`（建議前者）

#### **WheelEditor.tsx**
- Props: `slots: WheelSlot[]`, `onSlotChange: (id, value) => void`, `slotCount: number`, `onSlotCountChange: (count) => void`
- 顯示格子數量調整器（數字輸入 + ± 按鈕）
- 每格一個 `<input>` 或 `<textarea>`（限高）
- 即時更新 state + debounce localStorage

#### **Controls.tsx**
- Props: `onSpin: () => void`, `onClearHistory: () => void`, `onClearSlots: () => void`, `isSpinDisabled: boolean`
- 三個按鈕（高度 ≥ 44px）
- `onSpin` 按鈕在「所有格子皆空」時 disabled

#### **Result.tsx**
- Props: `result: string | null`
- 顯示最新一次抽選結果
- 使用 `aria-live="polite"` 通知螢幕閱讀器

#### **History.tsx**
- Props: `history: HistoryRecord[]`
- 列表顯示（時間 + 結果）
- 最新在最上方
- UI 顯示可滾動（建議 `max-height` + `overflow-y: auto`），資料層建議最多保留 **100 筆**（超過就移除最舊）

---

## 五、抽選與動畫策略

### 核心原則（避免「抽到 A 但轉到 B」）
- **抽選與角度計算一律使用原本 slots 的索引（selectedIndex）**  
  即使某些格子內容為空，也只是在「可抽選名單」中排除，不改變扇形位置與索引。

### 抽選邏輯（使用原索引）
1. **建立可抽選索引清單（保留原 index）**  
   ```ts
   const validIndices = slots
     .map((s, i) => (s.label.trim() ? i : -1))
     .filter((i) => i >= 0);
   ```
2. **防呆：全部為空不可抽**  
   - 若 `validIndices.length === 0` → 提示「請先填入至少一個選項」，不啟動旋轉。
3. **隨機抽選 selectedIndex（原扇形索引）**  
   ```ts
   const selectedIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
   const selectedLabel = slots[selectedIndex].label;
   ```

### 角度計算（指針固定在 12 點方向）
- 每格角度：`segment = 360 / slotCount`
- 目標扇形中心角（以 0 度為 12 點方向、順時針為正）：  
  `targetCenter = selectedIndex * segment + segment / 2`
- 最終旋轉角度（順時針旋轉，讓目標中心對準指針）：  
  `finalDeg = baseDeg + spins * 360 + (360 - targetCenter)`

> `spins` 建議 5–8 圈；`baseDeg` 可用目前 rotationDeg（讓連續抽選看起來更自然）。

### 動畫與完成事件（以 transitionend 為準）
- 使用 CSS：`transition: transform 2500ms cubic-bezier(...); transform: rotate(finalDegdeg);`
- 開始旋轉時：
  - `isSpinning = true`
  - disable「開始旋轉」按鈕（避免連點）
- **旋轉結束時**（建議用 `onTransitionEnd`）：
  - 顯示結果（Result 區塊/彈窗）
  - 寫入 History
  - `isSpinning = false`（解鎖按鈕）

### 文字顯示規則（輪盤內）
- 輪盤扇形文字建議：
  - 超過固定長度就顯示省略（例如 8–10 字）
  - 完整文字在右側結果區/歷史區完整顯示

---

## 六、防呆規則

| 情境 | 規則 |
|------|------|
| **所有格子皆空** | 「開始旋轉」按鈕 disabled，顯示提示「請至少填寫一個選項」 |
| **格子數減少** | 保留前 N 格內容，丟棄後面的 |
| **格子數增加** | 新增空字串格子 |
| **localStorage 讀取失敗** | 使用預設值（10 格空白） |
| **localStorage quota 滿** | catch 錯誤，提示使用者清除歷史 |

---

## 七、響應式設計（RWD）規範

### 斷點策略
- **Desktop**（≥ 1024px）：輪盤與編輯區左右兩欄（flex-row）
- **Tablet**（768px – 1023px）：依寬度自動切換，建議仍左右排
- **Mobile**（< 768px）：上下單欄（flex-column），輪盤在上

### 容器規則
```css
.wheelContainer {
  aspect-ratio: 1 / 1;
  max-width: min(90vw, 480px); /* 手機不溢出 */
  margin: 0 auto;
}
```

### 觸控友善
- 所有按鈕 `min-height: 44px`（符合 Apple HIG / Material Design）
- 輸入框間距 ≥ 8px
- 避免誤觸：按鈕與輸入框間距 ≥ 12px

### 滾動處理
- History 區塊：`max-height: 300px; overflow-y: auto;`（手機）
- 編輯區超過畫面高度時允許頁面滾動

### 文字處理
- 輪盤格子文字：長度 > 8 字時截斷 + 「...」
- History 文字：使用 `word-break: break-word` 避免溢出

---

## 八、無障礙（Accessibility）

- **語義化 HTML**：按鈕用 `<button>`，輸入框用 `<input>`
- **ARIA 標籤**：
  - 輪盤：`<div role="img" aria-label="抽選輪盤">`
  - 結果區：`<div aria-live="polite" aria-atomic="true">`
- **鍵盤操作**：
  - 所有按鈕可用 Tab 聚焦
  - Enter/Space 觸發按鈕
  - 輸入框可 Tab 切換
- **對比度**：文字與背景對比 ≥ 4.5:1（WCAG AA）

---

## 九、效能最佳化

- **動畫**：使用 `transform` + `will-change` 觸發 GPU 加速
- **localStorage 寫入**：debounce 500ms（`useDebounce` hook）
- **避免不必要 re-render**：使用 `React.memo` 包裹純展示元件
- **圖片/資源**：若有背景圖，使用 Next.js `<Image>` 優化

---

## 十、建議檔案結構

```
zh-wheel-picker/
├── .git/
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── README.md
├── app/
│   ├── layout.tsx              // <html lang="zh-TW">
│   ├── page.tsx                // 主頁面（'use client'）
│   ├── globals.css
│   └── components/
│       ├── Wheel.tsx
│       ├── WheelEditor.tsx
│       ├── Controls.tsx
│       ├── Result.tsx
│       └── History.tsx
├── lib/
│   ├── storage.ts              // localStorage 讀寫邏輯
│   ├── wheelLogic.ts           // 抽選邏輯、角度計算
│   └── types.ts                // TypeScript 型別定義
├── hooks/
│   └── useLocalStorage.ts      // Custom hook for localStorage
└── public/
    └── favicon.ico
```

---

## 十一、測試清單（手動測試）

### 瀏覽器測試
- [ ] **Chrome Desktop**（最新版）：所有功能正常
- [ ] **Safari Desktop**（macOS）：輪盤動畫流暢
- [ ] **iOS Safari**（iPhone）：觸控友善、滾動順暢
- [ ] **Android Chrome**（手機）：RWD 正確、按鈕可點擊
- [ ] **iPad Safari**（橫/直）：兩種方向皆正常

### 功能測試
- [ ] 調整格子數（2/10/50）：UI 更新正確
- [ ] 填寫格子內容：localStorage 即時儲存
- [ ] 開始旋轉：動畫流暢、結果正確
- [ ] 清除歷史：History 清空
- [ ] 清空格子：所有輸入框變空
- [ ] 重新整理頁面：資料保留

### RWD 測試
- [ ] 視窗寬度 1920px：兩欄排版
- [ ] 視窗寬度 768px：版面切換正確
- [ ] 視窗寬度 375px：單欄、輪盤不溢出
- [ ] 手機橫向：輪盤不被截斷

### 無障礙測試
- [ ] Tab 鍵可循序聚焦所有互動元素
- [ ] 螢幕閱讀器（NVDA/VoiceOver）：結果區塊可讀取
- [ ] 鍵盤操作：Enter 可觸發按鈕

### localStorage 測試
- [ ] 開發者工具刪除 localStorage → 頁面顯示預設值
- [ ] 填入大量資料（50 格長文字 + 100 筆歷史）→ 無錯誤

---

## 十二、部署 Vercel 步驟

### 前置條件
1. 確保專案根目錄有 `package.json`、`next.config.js`
2. Git 已 commit 所有變更至 `main` 分支
3. 註冊 Vercel 帳號（建議使用 GitHub OAuth）

### 部署流程
```bash
# 1. 安裝 Vercel CLI（可選）
npm i -g vercel

# 2. 登入
vercel login

# 3. 部署（首次會詢問專案設定）
vercel --prod

# 或使用 Vercel Dashboard 部署（推薦）
```

### Vercel Dashboard 部署（推薦）
1. 前往 [vercel.com/new](https://vercel.com/new)
2. 選擇 GitHub repo：`zh-wheel-picker`
3. Framework Preset：自動偵測 Next.js
4. Root Directory：`./`
5. Build Command：`npm run build`（預設）
6. Output Directory：`.next`（預設）
7. 點擊 **Deploy**

### 環境變數（若未來需要）
- 本專案 MVP 無需環境變數
- 若加入 Analytics，可在 Vercel 設定 `NEXT_PUBLIC_GA_ID`

### 自訂網域（可選）
- Vercel Dashboard → Settings → Domains → Add Domain
- 設定 DNS A/CNAME 記錄指向 Vercel

---

## 十三、Git 版控規劃（必讀）

### 分支策略

**採用：GitHub Flow（簡化版）**
- **main**：主分支，永遠保持可部署狀態
- **feature/***：功能分支，從 `main` 切出，完成後合併回 `main`

```bash
# 範例
git checkout -b feature/wheel-component
git checkout -b feature/storage-logic
git checkout -b feature/rwd-styling
```

### Commit 規範（Conventional Commits）

**格式**：`<type>(<scope>): <subject>`

| Type | 說明 | 範例 |
|------|------|------|
| `feat` | 新增功能 | `feat(wheel): add spin animation` |
| `fix` | 修正 bug | `fix(storage): handle quota exceed error` |
| `style` | 樣式調整（不影響邏輯）| `style(wheel): adjust mobile layout` |
| `refactor` | 重構程式碼 | `refactor(editor): extract slot input component` |
| `docs` | 文件更新 | `docs(readme): add deployment guide` |
| `chore` | 建置/工具相關 | `chore: init next.js project` |
| `test` | 測試相關 | `test(wheel): add angle calculation test` |

**Good Commit 範例**：
```bash
git commit -m "feat(wheel): implement rotation logic"
git commit -m "fix(storage): prevent data loss on quota error"
git commit -m "style(mobile): improve touch target size"
```

### 里程碑與 Commit 點建議

#### **階段 1：專案初始化**
```bash
git commit -m "chore: initialize Next.js with TypeScript"
git commit -m "chore: setup Tailwind CSS and project structure"
git commit -m "docs(readme): add initial project description"
```

#### **階段 2：核心輪盤 UI**
```bash
git commit -m "feat(wheel): create Wheel component with SVG structure"
git commit -m "feat(wheel): implement slot rendering"
git commit -m "style(wheel): add basic styling and layout"
```

#### **階段 3：編輯器與狀態管理**
```bash
git commit -m "feat(editor): create WheelEditor component"
git commit -m "feat(editor): add slot count adjustment controls"
git commit -m "feat(state): implement client-side state management"
```

#### **階段 4：抽選邏輯與動畫**
```bash
git commit -m "feat(wheel): implement spin animation"
git commit -m "feat(logic): add random selection algorithm"
git commit -m "feat(logic): calculate final angle for result"
git commit -m "feat(result): display spin result with aria-live"
```

#### **階段 5：歷史記錄**
```bash
git commit -m "feat(history): create History component"
git commit -m "feat(history): add timestamp formatting"
git commit -m "feat(controls): add clear history button"
```

#### **階段 6：持久化儲存**
```bash
git commit -m "feat(storage): implement localStorage integration"
git commit -m "feat(storage): add debounce for slot updates"
git commit -m "fix(storage): handle quota exceeded error"
```

#### **階段 7：響應式設計**
```bash
git commit -m "style(rwd): implement desktop two-column layout"
git commit -m "style(rwd): add tablet responsive breakpoints"
git commit -m "style(rwd): optimize mobile single-column layout"
git commit -m "style(touch): ensure minimum touch target size (44px)"
```

#### **階段 8：無障礙與細節優化**
```bash
git commit -m "feat(a11y): add ARIA labels and keyboard navigation"
git commit -m "feat(a11y): implement aria-live for result announcement"
git commit -m "fix(editor): handle long text truncation in wheel"
git commit -m "fix(controls): disable spin button when all slots empty"
```

#### **階段 9：測試與修正**
```bash
git commit -m "test: manual cross-browser testing checklist"
git commit -m "fix(mobile): resolve overflow issue on small screens"
git commit -m "fix(safari): adjust CSS for webkit compatibility"
```

#### **階段 10：部署準備**
```bash
git commit -m "chore: add vercel.json configuration"
git commit -m "docs(readme): add deployment instructions"
git commit -m "chore: prepare for production deployment"
```

### 分支工作流程範例

```bash
# 1. 從 main 切出功能分支
git checkout main
git pull origin main
git checkout -b feature/wheel-component

# 2. 開發並 commit
git add .
git commit -m "feat(wheel): create Wheel component with SVG structure"

# 3. 完成後推送
git push origin feature/wheel-component

# 4. 建立 Pull Request（GitHub）
# - 在 GitHub 介面建立 PR: feature/wheel-component → main
# - Review 程式碼（若單人可快速檢查）

# 5. 合併後刪除分支
git checkout main
git pull origin main
git branch -d feature/wheel-component
```

### Git 忽略檔案（.gitignore）

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/

# Env
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

---

## 十四、開發順序建議（Sprint 規劃）

### Sprint 1（專案基礎）
- [ ] 初始化 Next.js + TypeScript 專案
- [ ] 設定 Tailwind CSS
- [ ] 定義 TypeScript 型別（`lib/types.ts`）
- [ ] 建立基本頁面結構（`app/page.tsx`）

### Sprint 2（輪盤核心）
- [ ] 實作 `Wheel.tsx`（靜態 SVG 輪盤）
- [ ] 實作 `WheelEditor.tsx`（格子內容輸入）
- [ ] 實作狀態管理（useState）

### Sprint 3（抽選邏輯）
- [ ] 實作 `wheelLogic.ts`（隨機選擇 + 角度計算）
- [ ] 實作旋轉動畫（CSS transition）
- [ ] 實作 `Result.tsx`（顯示結果）

### Sprint 4（歷史與控制）
- [ ] 實作 `History.tsx`
- [ ] 實作 `Controls.tsx`（所有按鈕）
- [ ] 整合歷史記錄新增邏輯

### Sprint 5（持久化）
- [ ] 實作 `lib/storage.ts`
- [ ] 整合 localStorage 讀寫
- [ ] 測試重新整理後資料保留

### Sprint 6（RWD）
- [ ] 實作桌機版面（兩欄）
- [ ] 實作手機版面（單欄）
- [ ] 調整輪盤自適應大小

### Sprint 7（最終優化）
- [ ] 實作無障礙功能
- [ ] 跨瀏覽器測試與修正
- [ ] 效能優化（debounce、memo）

### Sprint 8（部署）
- [ ] 部署至 Vercel
- [ ] 實機測試（手機/平板）
- [ ] 撰寫完整 README

---

## 十五、驗收標準（Definition of Done）

每個功能完成時應滿足：
- [ ] 程式碼符合 TypeScript 型別檢查（無 `any` 濫用）
- [ ] 桌機 + 手機瀏覽器測試通過
- [ ] localStorage 功能正常
- [ ] 無 console error/warning
- [ ] Commit message 符合 Conventional Commits
- [ ] 已合併至 `main` 分支

---

## 十六、風險與備案

| 風險 | 影響 | 備案 |
|------|------|------|
| **Safari 動畫卡頓** | UX 不佳 | 降低動畫時長、簡化 SVG 複雜度 |
| **localStorage quota 限制** | 資料無法儲存 | 限制歷史記錄最多 100 筆 |
| **長文字破版** | 輪盤顯示錯亂 | 強制截斷 + tooltip 顯示全文 |
| **Vercel 部署失敗** | 無法上線 | 檢查 `.next` 目錄、Node 版本 |

---

## 總結

此規格涵蓋 **功能需求、技術選型、元件設計、RWD 規範、Git 版控、測試清單與部署流程**，可直接作為工程規格執行。建議依 Sprint 順序開發，每個里程碑完成後 commit 並推送至 `main`，最終部署至 Vercel 驗證。

**關鍵檢查點**：
- ✅ 所有功能需求已轉換為可執行任務
- ✅ RWD 規範明確（斷點、容器、觸控）
- ✅ Git 策略包含分支、commit 規範、里程碑
- ✅ 測試清單涵蓋跨瀏覽器、RWD、無障礙
- ✅ 部署流程清晰（Vercel）

**建議立即執行**：
```bash
git checkout -b feature/project-init
npx create-next-app@latest . --typescript --tailwind --app
git add .
git commit -m "chore: initialize Next.js with TypeScript and Tailwind"
git push origin feature/project-init
```
