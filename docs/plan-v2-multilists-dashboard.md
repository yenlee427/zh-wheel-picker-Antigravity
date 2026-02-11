你是資深全端工程師與產品設計師。請為 zh-wheel-picker 規劃下一階段功能（Next.js 專案位於 web/ 子目錄），輸出可執行的工程規格與任務拆解（Plan）。限制：只修改 web/ 內程式碼、維持 Tailwind、維持既有 RWD/a11y、不引入重型 UI 框架、維持現有輪盤抽選正確性（selectedIndex 對齊角度、transitionend 完成事件）。

========================
0) 既有狀態（請在 Plan 中先確認）
========================
- 目前是單一輪盤配置：slotCount + slots + history，存 localStorage。
- 已有 SVG 輪盤、旋轉動畫、結果顯示、History、localStorage、RWD、a11y。
- 需要升級成「多套清單（多配置）」並新增「多輪盤 Dashboard」。

========================
1) 新功能總目標（必做）
========================
A) 版面一（Single / baseline）：
- 支援多套清單（多個配置），使用者可以新增/切換/改名/刪除清單。
- 每套清單都包含：settings(slotCount)、slots、history。
- 切換清單後，輪盤、編輯區、結果、history 都切換到該清單資料。

B) 版面二（Dashboard）：
- 同頁顯示 5 個「不同清單」的輪盤，每個輪盤各自抽選、各自顯示結果、各自寫入自己的 history。
- Dashboard 的每個輪盤採「單色風格」：整個輪盤只用一個主色系（不需要每一格彩色）。可用同色深淺或同色+分隔線，但整體看起來是單色系。
- Dashboard 不必顯示完整 history（MVP 建議只顯示「最新結果 + 時間」，但仍需照常把結果寫入該清單的 history）。

C) 入口/導覽：
- 請你判斷採用「入口首頁（/）」+ 路由分頁（/single、/dashboard） vs 同頁選單切換，並給出理由後做最終決策。
- 最終決策需在 Plan 中寫死，並列出對應路由、導覽按鈕與繁中文案。

========================
2) 資料設計（必做，含 migration）
========================
請在 Plan 中定義 TS 型別與 localStorage keys，並提供 migration 策略（舊資料不可遺失）：

建議資料模型（可微調，但要完整）：
- WheelList: {
    id: string;
    name: string;
    settings: { slotCount: number };
    slots: { label: string }[];
    history: { id: string; timestamp: number; label: string; selectedIndex: number }[];
    updatedAt: number;
  }
- AppState: {
    version: number;               // 用於 migration
    activeListId: string;
    lists: WheelList[];
  }

localStorage keys（舉例）：
- APP_STATE = "zhWheelPicker:appState"  （推薦集中一個 key）
或拆分：
- LISTS = "zhWheelPicker:lists"
- ACTIVE_LIST_ID = "zhWheelPicker:activeListId"
- VERSION = "zhWheelPicker:version"

Migration 要求（必寫步驟）：
- 偵測舊版 keys（原本單清單的 slots/settings/history key）
- 若偵測到且新結構不存在：
  - 產生一個預設清單（例如 name="預設清單"）
  - 把舊資料搬進這個清單
  - 設 activeListId 指向它
  - 寫入新結構並標記 version
- 若新結構已存在，不能覆蓋使用者資料
- migration 必須具備「可重入」：重整多次不會重複建立多個預設清單
- 清楚定義：舊 key 是否保留或清除（建議保留一段時間或清除，但需在 Plan 中說明）

========================
3) 版面一（Single）UI/互動細節（必做）
========================
清單管理：
- 列表/下拉選單顯示清單名稱，支援切換。
- 新增清單：
  - 預設建立空白 slots（DEFAULT_SLOTS=10）與空 history
  - 預設名稱「清單 1 / 清單 2…」或讓使用者輸入（MVP 可自動命名，之後可改名）
- 改名：簡單 inline 或 modal（擇一），繁中提示與防呆（空名稱不可）
- 刪除：需確認（confirm），且要處理：
  - 若只剩 1 套清單，刪除按鈕 disabled 或提示「至少保留一套清單」
  - 若刪除的是 active list，需自動切到另一套（例如第一套）

資料互動：
- slotCount 調整、slots 編輯、旋轉抽選、history/清除/清空格子，都只影響 active list。

========================
4) 版面二（Dashboard）UI/互動細節（必做）
========================
- 固定顯示 5 個「不同清單」：
  - 若清單 >=5：顯示「最近更新的前 5 套」或「清單排序前 5 套」（請在 Plan 中寫死規則）
  - 若清單 <5：仍顯示最多現有數量；空位顯示「尚無清單」+ 引導建立（MVP 可只顯示現有的，不補空卡，但需寫死）
- 每個輪盤卡片內容（建議）：
  - 清單名稱
  - 輪盤（單色）
  - 開始旋轉按鈕（只控制該輪盤）
  - 最新結果區（時間+結果）
  - 一個快捷入口「前往編輯」→ 導到 /single 並切到該清單（需設計路由參數或全域狀態切換方式）

單色輪盤策略（必寫）：
- 方案 A：Wheel 元件新增 prop：variant="multi"|"mono" 或 themeColor，Dashboard 用 mono
- 方案 B：DashboardWheelWrapper 使用同一個 Wheel，但提供單色 palette
請在 Plan 中選一種並寫清楚 CSS/SVG 如何實作（扇形 fill、分隔線、hover/active）。

效能要求（必寫）：
- 5 個輪盤同頁，狀態要隔離，避免任一輪盤 setState 造成全部重繪太頻繁。
- 建議：每個輪盤卡片是獨立 component，只有該清單資料變動時更新（寫出策略：memo / 局部 state / selector）。

========================
5) 路由與導覽（必做，寫死）
========================
請你最終決策採用：
- (推薦) / 入口頁：兩個大按鈕「單輪盤管理」「多輪盤總覽」
- /single：版面一
- /dashboard：版面二
並在 Plan 中列出：
- 頁面結構與繁中文案
- 導覽方式（頂部返回/切換按鈕）
- Dashboard → Single 的「前往編輯」如何帶入 listId（query string 或全域狀態）

========================
6) 測試清單（必做）
========================
請列出可手動驗證步驟，至少包含：
- migration：舊版資料存在時升級後仍保留
- 新增/切換/改名/刪除清單（含刪除 active 與剩最後一套）
- Single 抽選、history 寫入與清除、清空格子
- Dashboard：5 個不同清單各自抽、互不影響、最新結果正確、history 寫入正確
- RWD：桌機/平板/手機
- localStorage：重整後資料仍在
- a11y：Tab 操作、aria-live 結果提示
- 壓力：快速連點旋轉按鈕仍不會錯亂（按鈕鎖定有效）

========================
7) 任務拆解與 Git 里程碑（必做）
========================
請輸出任務拆解（可直接照做的順序），並附對應 commit 建議（Conventional Commits），例如：
- feat: add multi-list data model and storage migration
- feat: add list selector and CRUD actions in single view
- feat: add home page and routing for single/dashboard
- feat: add dashboard view with 5 wheels and mono theme
- perf: isolate dashboard wheel state and reduce rerenders
- docs: update readme for new pages and vercel root directory
（實際以你的拆解為準）

========================
8) 輸出格式要求
========================
- 用小標題 + 條列
- 先給「最小可交付 MVP」範圍，再給「可選增強」（例如：清單排序拖拉、匯入匯出、搜尋、統計）
- 不要產生程式碼，只產生工程規格與任務拆解（Plan）。
