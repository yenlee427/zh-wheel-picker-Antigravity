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
