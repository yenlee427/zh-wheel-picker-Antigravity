import { StoredAppState, WheelList } from "@/types/wheelList";
import { APP_STATE_KEY, LEGACY_KEYS } from "./constants";
import { WheelSettings, HistoryItem } from "@/types/wheel";

// Helper for UUID generation
function generateUUID(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older environments (unlikely in modern browsers but safe)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function buildEmptySlots(count: number): { label: string }[] {
    return Array.from({ length: count }, () => ({ label: "" }));
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

export function runMigration(): StoredAppState | null {
    if (typeof window === "undefined") return null;

    // Step 1: Check if new state already exists
    const newState = localStorage.getItem(APP_STATE_KEY);
    if (newState) {
        try {
            const parsed = JSON.parse(newState);
            if (parsed.version === 2 && Array.isArray(parsed.lists)) {
                return parsed as StoredAppState;
            }
        } catch (e) {
            console.error("Failed to parse existing app state", e);
        }
    }

    // Step 2: Detect legacy data
    const legacySlotsStr = localStorage.getItem(LEGACY_KEYS.SLOTS);
    const legacySettingsStr = localStorage.getItem(LEGACY_KEYS.SETTINGS);
    const legacyHistoryStr = localStorage.getItem(LEGACY_KEYS.HISTORY);

    const hasLegacyData = legacySlotsStr || legacySettingsStr || legacyHistoryStr;

    if (!hasLegacyData) {
        // New install
        const defaultState = createDefaultAppState();
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(defaultState));
        return defaultState;
    }

    // Step 3: Migrate legacy data
    let slots: Array<{ label: string }> = buildEmptySlots(10);
    let settings: WheelSettings = { slotCount: 10 };
    let history: HistoryItem[] = [];

    try {
        if (legacySlotsStr) slots = JSON.parse(legacySlotsStr);
        if (legacySettingsStr) settings = JSON.parse(legacySettingsStr);
        if (legacyHistoryStr) history = JSON.parse(legacyHistoryStr);
    } catch (e) {
        console.error("Failed to parse legacy data during migration", e);
    }

    const migratedList: WheelList = {
        id: generateUUID(),
        name: "預設清單", // Migrated list name
        settings: { slotCount: settings.slotCount },
        slots: slots.map(s => ({ label: s.label })), // Ensure structure match
        history: history.map(h => ({
            id: h.id,
            timestamp: h.timestamp,
            label: h.label,
            selectedIndex: h.selectedIndex
        })),
        updatedAt: Date.now(),
        createdAt: Date.now(), // Estimate creation time as now
    };

    const newAppState: StoredAppState = {
        version: 2,
        activeListId: migratedList.id,
        lists: [migratedList],
        lastSaved: Date.now(),
    };

    // Step 4: Write new state
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(newAppState));

    // Step 5: Backup legacy keys
    const timestamp = Date.now();
    if (legacySlotsStr) {
        localStorage.setItem(`${LEGACY_KEYS.SLOTS}:backup:${timestamp}`, legacySlotsStr);
    }
    if (legacySettingsStr) {
        localStorage.setItem(`${LEGACY_KEYS.SETTINGS}:backup:${timestamp}`, legacySettingsStr);
    }
    if (legacyHistoryStr) {
        localStorage.setItem(`${LEGACY_KEYS.HISTORY}:backup:${timestamp}`, legacyHistoryStr);
    }

    return newAppState;
}
