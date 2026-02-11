# zh-wheel-picker v2 多清單與多輪盤總覽 - 完整執行規格

## 1. 設計決策（所有「請你判斷」問題的最終決定）

### 1.1 路由策略 ✅ 最終決定

**採用：Option A - 入口頁面 + 路由分頁**

**理由：**
- Next.js App Router 天然支援檔案路由，利於 SEO 與深層連結
- 使用者可直接收藏特定頁面 URL（如 `/dashboard`）
- 各頁面可獨立載入，Dashboard 不需載入 Single 的完整編輯邏輯，效能較佳
- 符合多功能應用的擴充性（未來可加統計頁、設定頁）

**路由結構：**
```
/ (首頁入口)
  ├─ /single (單輪盤管理 - 原有功能升級版)
  └─ /dashboard (多輪盤總覽)
```

**導覽 UI：**
- **首頁 (`/`)**：顯示兩個大型卡片按鈕
  - 按鈕 1：「單輪盤管理」→ `/single`
  - 按鈕 2：「多輪盤總覽」→ `/dashboard`
  - 繁中說明文字：「新增、編輯、抽選清單」vs「同時檢視五套輪盤」
  
- **頁面頂部導覽列（Single & Dashboard 共用）**：
  - 左側：Logo/標題「繁中輪盤抽選器」連結至首頁
  - 右側：Tab 選單 `[單輪盤管理] [多輪盤總覽]`，當前頁面高亮

**Dashboard → Single 的 listId 傳遞：**
- 使用 **React Context + URL query string 混合方式**
- Dashboard 卡片的「前往編輯」按鈕：`<Link href={`/single?list=${listId}`}>`
- Single 頁面偵測 `?list=` 參數，存在時設為 activeListId 並更新 Context
- Context 提供全域 `activeListId` 與 `setActiveListId`，localStorage 同步

---

### 1.2 單色輪盤策略（Dashboard） ✅ 最終決定

**採用：Option A - Wheel 元件新增 `variant` prop**

**理由：**
- 語義清晰，Wheel 元件自行決定渲染邏輯
- 避免外層 Wrapper 需要深度理解 SVG 結構
- 可對單色模式獨立調整分隔線、hover 效果、文字對比度

**實作細節：**

```typescript
// Wheel.tsx 新增 prop
type WheelProps = {
  // ... 既有 props
  variant?: "multi" | "mono";  // 預設 "multi"
  monoColor?: string;          // 單色模式的主色，預設 "#6366f1" (indigo-500)
};
```

**SVG 渲染邏輯：**
- **multi 模式**（預設）：保持現有彩色 `COLORS` 陣列輪播
- **mono 模式**：
  - 所有扇形 fill 使用同一個 `monoColor`
  - 分隔線 `stroke` 改為白色 `#ffffff`，`strokeWidth="2"`
  - 文字 `fill` 改為白色 `#ffffff` 以提升對比度
  - Hover 效果（未來可選）：透過 CSS filter 調整亮度

**CSS/SVG 範例（不實作，僅供規格說明）：**
```tsx
const sliceFill = variant === "mono" ? monoColor : COLORS[index % COLORS.length];
const textFill = variant === "mono" ? "#ffffff" : "#1f2937";
```

**Dashboard 使用方式：**
```tsx
<Wheel 
  variant="mono" 
  monoColor={MONO_COLORS[listIndex % MONO_COLORS.length]}
  // ... other props
/>
```

**預設單色色板（6 個不同單色）：**
```typescript
const MONO_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];
```

---

### 1.3 localStorage Key 策略 ✅ 最終決定

**採用：Option A - 單一 key `zhWheelPicker:appState`**

**理由：**
- 集中管理，migration 更簡單（只需讀寫一個 key）
- 原子性更新：activeListId 與 lists 同時變更時不會有中間狀態
- 利於未來新增全域設定（如主題、語言、使用者偏好）
- 單一 JSON 序列化效能足夠（資料量預估 < 100KB）

**Key 名稱：**
```typescript
const APP_STATE_KEY = "zhWheelPicker:appState";
```

**舊版 keys（用於 migration 偵測）：**
```typescript
const LEGACY_KEYS = {
  SLOTS: "zhWheelPicker:slots",
  SETTINGS: "zhWheelPicker:settings",
  HISTORY: "zhWheelPicker:history",
};
```

---

### 1.4 Dashboard 清單選擇規則 ✅ 最終決定

**當清單數量 >= 6 時：顯示「最近更新的前 6 套」（依 `updatedAt` DESC 排序）**

**理由：**
- 最近使用過的清單通常最相關（temporal locality）
- 避免使用者忘記之前的清單，Dashboard 自動反映活躍清單
- 6 個卡片形成 2×3 網格，視覺更平衡
- 比「建立順序」更符合多清單的使用情境

**實作規則：**
```typescript
// Dashboard 頁面載入時（進入時固定，避免使用中重排）
const [displayedListIds] = useState(() => 
  [...lists]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6)
    .map(l => l.id)
);
```

**當清單數量 < 6 時：**
- MVP：顯示現有所有清單（不補空卡）
- 可選增強（Phase 2）：顯示「新增清單」空卡引導

---

### 1.5 全域狀態管理（activeListId） ✅ 最終決定

**採用：React Context + localStorage 雙向同步**

**理由：**
- Context 提供跨元件共享，避免 prop drilling
- localStorage 持久化，重整後恢復
- URL query string 作為輔助入口（Dashboard → Single 時帶參數）
- 不使用純 URL params：避免每次切換清單都觸發路由變更

**實作架構：**
```typescript
// lib/contexts/AppStateContext.tsx
type AppStateContextValue = {
  activeListId: string;
  setActiveListId: (id: string) => void;
  lists: WheelList[];
  updateList: (id: string, updates: Partial<WheelList>) => void;
  addList: (list: WheelList) => void;
  deleteList: (id: string) => void;
};

// app/layout.tsx 包裹 <AppStateProvider>
// Single/Dashboard 頁面透過 useAppState() 存取
```

**同步策略：**
- Context 變更 → 立即寫入 localStorage
- localStorage 變更（其他 tab）→ `storage` 事件監聽 → 更新 Context
- URL query `?list=xxx` → 載入時設為 activeListId（僅單次）

---

## 2. 資料模型（完整 TypeScript 定義）

### 2.1 新增型別定義

**檔案：`web/types/wheelList.ts`**

```typescript
/**
 * 單一輪盤清單的完整配置與歷史記錄
 */
export interface WheelList {
  /** 清單唯一識別碼（UUID v4） */
  id: string;
  
  /** 清單名稱（使用者可編輯） */
  name: string;
  
  /** 輪盤設定 */
  settings: {
    slotCount: number;
  };
  
  /** 格子內容陣列 */
  slots: Array<{ label: string }>;
  
  /** 歷史記錄（最多 100 筆） */
  history: Array<{
    id: string;
    timestamp: number;
    label: string;
    selectedIndex: number;
  }>;
  
  /** 最後更新時間（Unix timestamp, ms） */
  updatedAt: number;
  
  /** 建立時間（Unix timestamp, ms） */
  createdAt: number;
}

/**
 * 應用程式全域狀態
 */
export interface AppState {
  /** 資料結構版本號（用於 migration） */
  version: number;
  
  /** 當前使用的清單 ID */
  activeListId: string;
  
  /** 所有清單陣列 */
  lists: WheelList[];
}

/**
 * localStorage 儲存的完整結構
 */
export interface StoredAppState extends AppState {
  /** 最後儲存時間（用於偵測跨 tab 同步） */
  lastSaved: number;
}
```

**檔案：`web/types/wheel.ts`（既有，保持相容）**

```typescript
// 保留既有型別，供 Wheel 元件繼續使用
export interface SlotItem {
  label: string;
}

export interface WheelSettings {
  slotCount: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  label: string;
  selectedIndex: number;
}
```

---

## 3. localStorage Schema

### 3.1 新版結構

**Key：** `zhWheelPicker:appState`

**JSON 範例：**
```json
{
  "version": 2,
  "activeListId": "550e8400-e29b-41d4-a716-446655440000",
  "lastSaved": 1739289600000,
  "lists": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "預設清單",
      "settings": {
        "slotCount": 10
      },
      "slots": [
        { "label": "選項 A" },
        { "label": "選項 B" },
        { "label": "" },
        { "label": "" },
        { "label": "" },
        { "label": "" },
        { "label": "" },
        { "label": "" },
        { "label": "" },
        { "label": "" }
      ],
      "history": [
        {
          "id": "1739289500000-abc123",
          "timestamp": 1739289500000,
          "label": "選項 A",
          "selectedIndex": 0
        }
      ],
      "updatedAt": 1739289500000,
      "createdAt": 1739200000000
    }
  ]
}
```

### 3.2 版本號策略

- **version: 1**：舊版（單清單，分散 keys）
- **version: 2**：新版（多清單，集中 key）

Migration 時檢查 `version` 欄位，若不存在則視為 v1 或全新安裝。

---

## 4. Migration 策略（逐步執行邏輯）

### 4.1 Migration 執行時機

- 應用程式初次載入（`AppStateProvider` mount 時）
- 執行於 `useEffect` 內，僅執行一次

### 4.2 Migration 流程（Pseudo-code）

```typescript
// lib/migration.ts

function runMigration(): StoredAppState | null {
  // Step 1: 檢查新版結構是否已存在
  const newState = localStorage.getItem(APP_STATE_KEY);
  if (newState) {
    const parsed = JSON.parse(newState);
    // 新版已存在，直接返回（不覆蓋）
    if (parsed.version === 2 && Array.isArray(parsed.lists)) {
      return parsed;
    }
  }

  // Step 2: 偵測舊版資料
  const legacySlots = localStorage.getItem(LEGACY_KEYS.SLOTS);
  const legacySettings = localStorage.getItem(LEGACY_KEYS.SETTINGS);
  const legacyHistory = localStorage.getItem(LEGACY_KEYS.HISTORY);

  const hasLegacyData = legacySlots || legacySettings || legacyHistory;

  if (!hasLegacyData) {
    // 全新安裝，建立預設清單
    return createDefaultAppState();
  }

  // Step 3: 轉換舊資料
  const slots = legacySlots ? JSON.parse(legacySlots) : buildEmptySlots(10);
  const settings = legacySettings ? JSON.parse(legacySettings) : { slotCount: 10 };
  const history = legacyHistory ? JSON.parse(legacyHistory) : [];

  const migratedList: WheelList = {
    id: generateUUID(),
    name: "預設清單",
    settings,
    slots,
    history,
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };

  const newAppState: StoredAppState = {
    version: 2,
    activeListId: migratedList.id,
    lists: [migratedList],
    lastSaved: Date.now(),
  };

  // Step 4: 寫入新結構
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(newAppState));

  // Step 5: 備份舊 keys（避免無法回復）
  const timestamp = Date.now();
  if (legacySlots) {
    localStorage.setItem(`zhWheelPicker:legacy:slots:${timestamp}`, legacySlots);
  }
  if (legacySettings) {
    localStorage.setItem(`zhWheelPicker:legacy:settings:${timestamp}`, legacySettings);
  }
  if (legacyHistory) {
    localStorage.setItem(`zhWheelPicker:legacy:history:${timestamp}`, legacyHistory);
  }
  // 註：原始 keys 保留不刪除，Phase 2 可提供手動清理功能

  return newAppState;
}

function createDefaultAppState(): StoredAppState {
  const defaultList: WheelList = {
    id: generateUUID(),
    name: "我的第一個清單",
    settings: { slotCount: 10 },
    slots: buildEmptySlots(10),
    history: [],
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };

  return {
    version: 2,
    activeListId: defaultList.id,
    lists: [defaultList],
    lastSaved: Date.now(),
  };
}
```

### 4.3 Idempotency（可重入性）保證

- **防護機制**：Step 1 優先檢查新版結構，若存在則直接返回
- **重整測試**：重新整理頁面 10 次，不會產生 10 個「預設清單」
- **跨 tab 安全**：A tab 完成 migration 後，B tab 重整會讀到新結構

### 4.4 舊 keys 處理決策

**✅ 最終決定：備份保留（不刪除）**

**理由：**
- 避免新版本出現問題時無法回復
- 備份 keys 使用帶時間戳的命名：`zhWheelPicker:legacy:{type}:{timestamp}`
- Phase 2 可提供手動清理功能（或設定頁的「清理舊資料」按鈕）
- 原始 keys 保留，確保資料安全

---

## 5. 元件架構

### 5.1 新增元件

#### 5.1.1 `components/ListSelector.tsx`
```typescript
type ListSelectorProps = {
  lists: WheelList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onAddList: () => void;
  onRenameList: (id: string, newName: string) => void;
  onDeleteList: (id: string) => void;
};
```
**責任：**
- 下拉選單顯示所有清單
- 新增、重新命名、刪除清單操作
- 保護機制：僅剩 1 個清單時禁用刪除

---

#### 5.1.2 `components/DashboardWheelCard.tsx`
```typescript
type DashboardWheelCardProps = {
  list: WheelList;
  monoColor: string;
  onUpdateList: (updates: Partial<WheelList>) => void;
};
```
**責任：**
- 顯示清單名稱
- 內嵌單色 Wheel 元件
- 「開始旋轉」按鈕（只控制該輪盤）
- 最新結果區（格式：`2026/02/11 14:30 - 選項 A`）
- 一個快捷入口「前往編輯」→ 導到 `/single` 並切到該清單（需設計路由參數或全域狀態切換方式）

---

#### 5.1.3 `components/Navigation.tsx`
```typescript
type NavigationProps = {
  currentPath: string; // "/single" | "/dashboard"
};
```
**責任：**
- 頂部導覽列
- Logo 連結首頁
- Tab 選單（單輪盤管理 / 多輪盤總覽）

---

#### 5.1.4 `lib/contexts/AppStateContext.tsx`
```typescript
type AppStateContextValue = {
  state: StoredAppState;
  activeList: WheelList | null;
  setActiveListId: (id: string) => void;
  updateList: (id: string, updates: Partial<WheelList>) => void;
  addList: (name?: string) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, newName: string) => void;
};
```
**責任：**
- 全域狀態管理
- localStorage 雙向同步
- 提供 CRUD 方法

---

### 5.2 修改元件

#### 5.2.1 `components/Wheel.tsx`
**變更：**
- 新增 props：`variant?: "multi" | "mono"`, `monoColor?: string`
- 條件渲染：mono 模式使用單色 fill 與白色文字

#### 5.2.2 `app/page.tsx`
**變更：**
- 移除原有輪盤邏輯（完整保留邏輯供 `/single` 使用）
- 改為首頁入口：兩個大型按鈕卡片

#### 5.2.3 `app/layout.tsx`
**變更：**
- 包裹 `<AppStateProvider>`
- 新增頂部 `<Navigation>` 元件（僅在非首頁顯示）

---

## 6. 檔案結構（完整新增檔案清單）

```
web/
├── app/
│   ├── layout.tsx                  ← 修改：加入 AppStateProvider
│   ├── page.tsx                    ← 修改：改為首頁入口（Server Component）
│   ├── globals.css                 ← 保持不變
│   ├── single/
│   │   ├── layout.tsx              ← 新增：定義 metadata（Server Component）
│   │   └── page.tsx                ← 新增：渲染 SingleClient（Server Component）
│   └── dashboard/
│       ├── layout.tsx              ← 新增：定義 metadata（Server Component）
│       └── page.tsx                ← 新增：渲染 DashboardClient（Server Component）
│
├── components/
│   ├── Wheel.tsx                   ← 修改：新增 variant prop
│   ├── Controls.tsx                ← 保持不變
│   ├── SlotEditor.tsx              ← 保持不變
│   ├── HistoryList.tsx             ← 保持不變
│   ├── ResultBanner.tsx            ← 保持不變
│   ├── ListSelector.tsx            ← 新增
│   ├── DashboardWheelCard.tsx      ← 新增
│   ├── Navigation.tsx              ← 新增
│   ├── SingleClient.tsx            ← 新增：Single 頁面的 Client Component
│   └── DashboardClient.tsx         ← 新增：Dashboard 頁面的 Client Component
│
├── hooks/
│   ├── useLocalStorageState.ts     ← 保持不變（可能棄用）
│   └── useAppState.ts              ← 新增：Context hook
│
├── lib/
│   ├── constants.ts                ← 修改：新增 APP_STATE_KEY, MONO_COLORS
│   ├── storage.ts                  ← 保持不變（低階 API 保留）
│   ├── wheelMath.ts                ← 保持不變
│   ├── migration.ts                ← 新增：Migration 邏輯
│   ├── listUtils.ts                ← 新增：清單 CRUD 工具函式
│   └── contexts/
│       └── AppStateContext.tsx     ← 新增：React Context
│
├── types/
│   ├── wheel.ts                    ← 保持不變
│   └── wheelList.ts                ← 新增：AppState, WheelList
│
└── public/                         ← 保持不變
```

---

## 7. 任務拆解（按順序執行）

### Phase 1: MVP 核心功能

#### Task 1: 定義新資料模型與 Migration
**檔案：**
- `types/wheelList.ts`（新增）
- `lib/migration.ts`（新增）
- `lib/constants.ts`（修改）

**Commit：**
```
feat: add multi-list data model and migration logic

- Define WheelList and AppState interfaces
- Implement localStorage migration from v1 to v2
- Add version number and idempotency check
- Backup legacy keys with timestamp (not removed)
```

---

#### Task 2: 建立全域狀態 Context
**檔案：**
- `lib/contexts/AppStateContext.tsx`（新增）
- `hooks/useAppState.ts`（新增）
- `lib/listUtils.ts`（新增）

**Commit：**
```
feat: add global AppState context with localStorage sync

- Create AppStateProvider with CRUD methods
- Implement activeListId management
- Add storage event listener for cross-tab sync
- Export useAppState hook for consumption
```

---

#### Task 3: 修改 Wheel 元件支援單色模式
**檔案：**
- `components/Wheel.tsx`（修改）
- `lib/constants.ts`（修改，新增 MONO_COLORS）

**Commit：**
```
feat(Wheel): add mono variant for dashboard view

- Add variant and monoColor props
- Conditional rendering for single-color fills
- Adjust text color to white in mono mode
- Maintain multi-color mode as default
```

---

#### Task 4: 建立首頁入口與路由導覽
**檔案：**
- `app/page.tsx`（修改）
- `app/layout.tsx`（修改）
- `app/single/layout.tsx`（新增）
- `app/dashboard/layout.tsx`（新增）
- `components/Navigation.tsx`（新增）

**Commit：**
```
feat: add home page and navigation for multi-page routing

- Convert root page.tsx to entry with two action cards
- Wrap layout with AppStateProvider
- Add Navigation component with tabs for single/dashboard
- Create single/dashboard layouts with metadata (Server Components)
- Traditional Chinese labels and a11y attributes
```

**Dependencies：** Task 2

---

#### Task 5: 建立清單選擇器元件
**檔案：**
- `components/ListSelector.tsx`（新增）

**Commit：**
```
feat: add ListSelector component for CRUD operations

- Dropdown to display and switch lists
- Add new list with auto-generated name
- Inline rename with validation
- Delete with confirmation (protect last list)
- Traditional Chinese UI and error messages
```

**Dependencies：** Task 2

---

#### Task 6: 建立 Single 頁面（多清單支援）
**檔案：**
- `app/single/page.tsx`（新增：Server Component，渲染 SingleClient）
- `components/SingleClient.tsx`（新增：Client Component，移植原 `app/page.tsx` 邏輯）

**Commit：**
```
feat: add single-wheel management page with multi-list support

- Create SingleClient component with original wheel logic
- Integrate ListSelector for list switching
- Detect URL query ?list= to set active list
- All operations (spin, edit, history) scoped to active list
- Maintain RWD and a11y from original implementation
- Server/Client separation for SEO optimization
```

**Dependencies：** Task 4, Task 5

---

#### Task 7: 建立 Dashboard 輪盤卡片元件
**檔案：**
- `components/DashboardWheelCard.tsx`（新增）

**Commit：**
```
feat: add DashboardWheelCard with isolated spin logic

- Display list name and mono-colored wheel
- Independent spin button and result banner
- Show latest result with timestamp
- "Edit" link to /single?list={id}
- Use React.memo for performance isolation
```

**Dependencies：** Task 3

---

#### Task 8: 建立 Dashboard 頁面
**檔案：**
- `app/dashboard/page.tsx`（新增：Server Component，渲染 DashboardClient）
- `components/DashboardClient.tsx`（新增：Client Component）

**Commit：**
```
feat: add dashboard page with 6 mono-colored wheels

- Sort lists by updatedAt DESC and display top 6
- Fix displayed list IDs on mount to prevent re-sorting during use
- Assign unique monoColor to each wheel (6 colors)
- Grid layout with responsive design (1 col mobile, 2 cols tablet, 3 cols desktop)
- Update list.updatedAt on every spin
- a11y: aria-live for spin results per card
- Server/Client separation for SEO optimization
```

**Dependencies：** Task 7

---

#### Task 9: 移除舊 localStorage keys（清理）
**檔案：**
- `lib/constants.ts`（移除 STORAGE_KEYS export）
- `README.md`（更新）

**Commit：**
```
chore: remove legacy storage keys after migration

- Clean up old STORAGE_KEYS references
- Update README with new multi-list architecture
- Document /single and /dashboard routes
```

**Dependencies：** Task 8

---

#### Task 10: 整合測試與修復
**檔案：**
- 各元件微調

**Commit：**
```
fix: resolve integration issues and improve UX

- Fix activeListId sync between routes
- Adjust Dashboard grid spacing for mobile
- Ensure Wheel transition callbacks work in both modes
- Add loading states for Context initialization
```

**Dependencies：** Task 9

---

### Phase 2: 可選增強（非 MVP）

#### Task 11（Optional）: 清單排序拖拉
```
feat: add drag-and-drop list reordering in ListSelector
```

#### Task 12（Optional）: 匯出/匯入清單（JSON）
```
feat: add export/import for lists via JSON download
```

#### Task 13（Optional）: Dashboard 搜尋與篩選
```
feat: add search bar to filter displayed lists in dashboard
```

#### Task 14（Optional）: 統計頁面（每個清單的抽選統計）
```
feat: add /stats route with per-list spin analytics
```

#### Task 15（Optional）: 清理舊資料功能
**檔案：**
- `lib/migration.ts`（新增 cleanupLegacyBackups 函數）
- Single 頁面新增「清理舊資料」按鈕（設定區）

**Commit：**
```
feat: add manual legacy data cleanup utility

- Add cleanupLegacyBackups function to remove backups older than 30 days
- Provide manual cleanup button in settings
- Display backup count and total size
- Confirmation dialog before cleanup
```

---

## 8. 驗證清單（手動測試步驟）

### 8.1 Migration 測試
- [ ] 開啟舊版應用（v1），新增 5 筆格子與 3 筆歷史
- [ ] 部署新版（v2），重整頁面
- [ ] 確認「預設清單」出現，資料完整（5 筆格子 + 3 筆歷史）
- [ ] 檢查 localStorage：`zhWheelPicker:appState` 存在，舊 keys 已移除
- [ ] 再次重整 10 次，確認不會重複建立清單

### 8.2 清單 CRUD 測試
- [ ] 新增清單：建立「清單 1」「清單 2」，確認預設 10 格與空歷史
- [ ] 切換清單：切到「清單 2」，編輯格子，旋轉抽選，確認歷史寫入正確清單
- [ ] 重新命名：將「清單 1」改名為「家庭聚會」，切回後名稱正確
- [ ] 刪除清單（非 active）：刪除「清單 2」，確認跳出確認對話框，刪除後清單消失
- [ ] 刪除清單（active）：刪除當前清單，確認自動切到第一個清單
- [ ] 刪除最後一個清單：僅剩 1 個清單時，刪除按鈕 disabled 或提示「至少保留一套清單」

### 8.3 Single 頁面測試
- [ ] 調整格子數量：增加到 20 個，減少到 5 個，確認格子陣列同步
- [ ] 編輯格子：填入繁中文字「選項甲」「選項乙」
- [ ] 旋轉抽選：點擊「開始旋轉」，確認旋轉動畫、結果橫幅、歷史記錄正確
- [ ] 清空全部格子：確認所有 label 清空，但數量不變
- [ ] 清除歷史：確認 history 陣列清空

### 8.4 Dashboard 頁面測試
- [ ] 建立 8 個清單，分別編輯不同格子
- [ ] 進入 Dashboard，確認顯示「最近更新的前 6 套」
- [ ] 在 Dashboard 停留期間旋轉輪盤，確認卡片順序不會跳動
- [ ] 每個輪盤：
  - [ ] 單色正確（6 個不同色彩）
  - [ ] 點擊「開始旋轉」，僅該輪盤旋轉，其他不動
  - [ ] 結果顯示在該卡片內，格式：`2026/02/11 14:30 - 選項 A`
  - [ ] 歷史記錄寫入正確清單（回 Single 確認）
- [ ] 點擊「前往編輯」，跳轉到 `/single?list=xxx`，確認自動切換到該清單

### 8.5 路由與導覽測試
- [ ] 首頁 `/`：顯示兩個大按鈕，點擊跳轉正確
- [ ] 頂部導覽：切換 Single ↔ Dashboard，URL 與內容正確
- [ ] URL 深層連結：直接訪問 `/dashboard`，載入正確
- [ ] 瀏覽器返回按鈕：從 Dashboard → Single → 返回，狀態正確

### 8.6 RWD 測試
- [ ] 桌機（>=1024px）：Dashboard 3 欄（2×3 網格），Single 左右分欄
- [ ] 平板（640-1023px）：Dashboard 2 欄（3×2 網格）
- [ ] 手機（<640px）：Dashboard 1 欄（垂直排列），Single 垂直排列

### 8.7 localStorage 持久化測試
- [ ] 編輯清單，重整頁面，確認資料保留
- [ ] 旋轉抽選，關閉 tab 重新開啟，確認歷史存在

### 8.8 a11y 測試
- [ ] Tab 鍵導覽：可依序 focus 到所有按鈕與輸入框
- [ ] 抽選結果：使用螢幕閱讀器，確認 aria-live 提示結果
- [ ] 按鈕標籤：確認所有按鈕有 `aria-label` 或可辨識文字

### 8.9 效能測試
- [ ] Dashboard 5 個輪盤：同時旋轉 3 個，確認無卡頓
- [ ] 快速連點「開始旋轉」，確認按鈕鎖定，不會觸發多次

### 8.10 跨 Tab 同步測試
- [ ] 開啟兩個 tab
- [ ] Tab A 新增清單「測試清單」
- [ ] Tab B 重整，確認「測試清單」出現

---

## 9. MVP vs 可選增強

### 9.1 Phase 1 - MVP（必做）

**範圍：**
- ✅ 多清單資料模型與 migration
- ✅ 全域狀態 Context
- ✅ 首頁入口 + 路由導覽
- ✅ Single 頁面清單 CRUD
- ✅ Dashboard 多輪盤單色顯示
- ✅ 各頁面 RWD 與 a11y
- ✅ localStorage 持久化

**交付標準：**
- 舊資料無損升級
- 可流暢新增、編輯、切換、刪除清單
- Dashboard 顯示最近 5 套清單，各自獨立抽選
- 手機/平板/桌機正常顯示
- Tab 導覽與螢幕閱讀器支援

---

### 9.2 Phase 2 - 可選增強（未來迭代）

#### 9.2.1 清單管理增強
- [ ] 拖拉排序清單順序（react-beautiful-dnd）
- [ ] 清單搜尋（依名稱過濾）
- [ ] 清單標籤/分類（工作、家庭、娛樂）
- [ ] 釘選功能（pin 到 Dashboard 固定顯示）

#### 9.2.2 資料匯入匯出
- [ ] 匯出單一清單為 JSON
- [ ] 匯出所有清單（含設定）
- [ ] 匯入 JSON 檔案（驗證格式）
- [ ] 複製清單功能

#### 9.2.3 Dashboard 增強
- [ ] 使用者自訂 Dashboard 顯示數量（3/5/10）
- [ ] Dashboard 顯示完整歷史（摺疊式）
- [ ] 同步旋轉按鈕（一鍵旋轉全部 5 套輪盤）
- [ ] 單色色板自訂（使用者選色）

#### 9.2.4 統計與分析
- [ ] `/stats` 路由：每個清單的抽選頻率圖表
- [ ] 匯出歷史為 CSV
- [ ] 最常抽中的選項排行

#### 9.2.5 進階功能
- [ ] 機率權重調整（某選項機率 × 2）
- [ ] 多輪盤同步設定（批次修改格子數）
- [ ] 主題切換（深色模式）
- [ ] 多語言支援（英文、簡中）

---

## 10. 注意事項與風險

### 10.1 技術風險

**Risk 1：Migration 失敗導致資料遺失**
- **緩解措施：**
  - Migration 前先讀取舊 keys，寫入新結構後再刪除
  - 若 JSON.parse 失敗，保留舊 keys 並提示使用者
  - 提供 `/debug` 路由顯示 localStorage 內容（開發期間）

**Risk 2：Context 重繪導致效能問題**
- **緩解措施：**
  - DashboardWheelCard 使用 `React.memo`
  - Context 分拆為 `state` 與 `actions`，避免 actions 變更觸發重繪
  - 每個輪盤狀態（rotationDeg, isSpinning）局部管理

**Risk 3：跨 tab 競爭條件（同時寫入 localStorage）**
- **緩解措施：**
  - 使用 `lastSaved` timestamp 偵測衝突
  - 若衝突，顯示提示「其他分頁已更新資料，請重新整理」
  - 未來可引入 Broadcast Channel API 即時同步

---

### 10.2 UX 風險

**Risk 1：使用者不理解「清單」概念**
- **緩解措施：**
  - 首頁新增說明文字：「清單讓你管理多組抽選名單，例如家庭聚會、公司抽獎、課堂點名」
  - 預設清單命名具描述性（如「我的第一個清單」）

**Risk 2：Dashboard 更新排序規則不透明**
- **緩解措施：**
  - Dashboard 頁面頂部提示：「顯示最近使用的 5 套清單」
  - 未來可新增「查看全部清單」按鈕

---

## 11. Next.js App Router 特定考量

### 11.1 Server vs Client Components

- **`app/layout.tsx`**：Server Component（預設），AppStateProvider 使用 `"use client"`
- **`app/page.tsx`（首頁）**：Server Component，靜態內容
- **`app/single/page.tsx`、`app/dashboard/page.tsx`**：Client Component（需 useState, Context）

### 11.2 Metadata 與 SEO

**✅ 最終決定：採用方案 B（Server/Client 分離）**

```typescript
// app/single/layout.tsx（Server Component）
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "單輪盤管理 | 繁中輪盤抽選器",
  description: "新增、編輯、管理多組抽選清單",
};

export default function SingleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

// app/single/page.tsx（Server Component）
import SingleClient from "@/components/SingleClient";

export default function SinglePage() {
  return <SingleClient />;
}

// app/dashboard/layout.tsx（Server Component）
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "六輪盤總覽 | 繁中輪盤抽選器",
  description: "同時檢視與操作六套輪盤清單",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

// app/dashboard/page.tsx（Server Component）
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage() {
  return <DashboardClient />;
}
```

### 11.3 Route Handlers（未來可選）

若需 API route 匯出資料：
```
app/api/export/[listId]/route.ts
```

---

## 12. Vercel 部署考量

### 12.1 環境變數（無需新增）

目前無需 API keys 或敏感資訊。

### 12.2 Build 設定

確認 `next.config.ts` 無需變更，靜態資源路徑正確。

### 12.3 Preview Deployment

每個 PR 自動產生 preview URL，可驗證：
- Migration 在 Vercel 環境正確執行
- RWD 在實際裝置測試

---

## 13. Git Workflow 建議

### 13.1 分支策略

```
main (production)
  ├─ dev (integration)
      ├─ feature/multi-list-data-model (Task 1)
      ├─ feature/global-state-context (Task 2)
      ├─ feature/mono-wheel-variant (Task 3)
      └─ ...
```

### 13.2 PR Review Checklist

每個 PR 需確認：
- [ ] Commit message 符合 Conventional Commits
- [ ] TypeScript 型別無 `any`（除非必要）
- [ ] 新增元件有 PropTypes 或 TS interface
- [ ] RWD 測試截圖（手機/桌機）
- [ ] a11y 測試報告（axe DevTools）

---

## 14. 完成定義（Definition of Done）

**MVP Phase 1 完成標準：**

- [ ] 所有 Task 1-10 已 merge 至 `main`
- [ ] Vercel production 部署成功
- [ ] 手動驗證清單 8.1-8.10 全數通過
- [ ] 無 console 錯誤或警告
- [ ] Lighthouse 分數：
  - Performance: ≥90
  - Accessibility: ≥95
  - Best Practices: ≥90
  - SEO: ≥90
- [ ] README.md 更新新功能說明
- [ ] 使用者可從舊版無痛升級

---

**總結：此規格文件已完整定義所有設計決策、資料結構、元件架構、任務拆解與驗證標準，可直接執行開發。所有「請你判斷」問題均已給出最終決策並附理由。**



## 補充：Dashboard RWD 建議斷點（v2.1 修正）
- < 640px：**1 欄**（避免卡片過小與按鈕難點）
- 640–1023px：**2 欄**
- >= 1024px：**3 欄**（寬螢幕可提升到 4 欄）
> 原則：避免手機 2 欄造成輪盤與文字過度縮小；避免強制 5 欄導致可用性下降。



## 補充：Migration 舊 key 清理策略（v2.1 最終決定）
**✅ 採用選項 A**：將 legacy keys 改名備份為 `zhWheelPicker:legacy:{type}:{timestamp}`，保留原始 keys 不刪除。

**實作細節：**
```typescript
// 備份格式
zhWheelPicker:legacy:slots:1739289600000
zhWheelPicker:legacy:settings:1739289600000
zhWheelPicker:legacy:history:1739289600000
```

**清理策略：**
- Phase 1（MVP）：不提供自動清理
- Phase 2（可選）：提供手動清理按鈕
  - 顯示備份檔案數量與大小
  - 清理 30 天前的備份
  - 需確認對話框


## 補充：Dashboard 排序穩定性（v2.1 最終決定）
**✅ 採用：進入時固定順序**

若 Dashboard 以 `updatedAt` 取前 6 套清單，且「旋轉/編輯」會更新 `updatedAt`，可能造成卡片在同一頁面使用中跳動重排。

**實作方式：**
```typescript
// DashboardClient.tsx
const [displayedListIds] = useState(() => 
  [...state.lists]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6)
    .map(l => l.id)
);

// 本次停留期間固定這些 IDs，不因 updatedAt 變化而重排
// 重新進入頁面時才會重新計算
```

**Phase 2 可選增強：**
- 新增「重新整理清單」按鈕，手動觸發重新排序


## 補充：跨分頁（tabs）同步與覆寫規則（v2.1 修正）
若監聽 `storage` 事件同步狀態，請寫死覆寫策略避免舊分頁覆蓋新分頁：
- 寫入節流：輸入框編輯採 debounce（例如 300ms）或 blur 才寫入。
- 衝突處理：以 `lastSaved` 較新的狀態為準，並提示「已從其他分頁同步更新」。


## 補充：ID 生成建議（v2.1 修正）
清單 id / history id 建議使用 `crypto.randomUUID()`（現代瀏覽器支援），避免額外引入 uuid 套件。
