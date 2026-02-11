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

export interface AppState {
  /** 資料結構版本號（用於 migration） */
  version: number;
  
  /** 當前使用的清單 ID */
  activeListId: string;
  
  /** 所有清單陣列 */
  lists: WheelList[];
}

export interface StoredAppState extends AppState {
  /** 最後儲存時間（用於偵測跨 tab 同步） */
  lastSaved: number;
}
