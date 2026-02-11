import { WheelList, AppState } from "@/types/wheelList";

export const createNewList = (name: string, slotCount: number = 10): WheelList => {
    // UUID generation will be handled where crypto is available or passed in
    // For now we assume a simple random string or proper UUID in the Context
    const id = crypto.randomUUID();
    return {
        id,
        name,
        settings: { slotCount },
        slots: Array.from({ length: slotCount }, () => ({ label: "" })),
        history: [],
        updatedAt: Date.now(),
        createdAt: Date.now(),
    };
};

export const updateListInState = (
    state: AppState,
    listId: string,
    updates: Partial<WheelList>
): AppState => {
    const newList = state.lists.map((list) => {
        if (list.id === listId) {
            return { ...list, ...updates, updatedAt: Date.now() };
        }
        return list;
    });

    return {
        ...state,
        lists: newList,
        lastSaved: Date.now(),
    } as AppState; // Type assertion to handle StoredAppState expansion if needed
};

export const addListToState = (state: AppState, newList: WheelList): AppState => {
    return {
        ...state,
        lists: [...state.lists, newList],
        activeListId: newList.id, // Auto switch to new list
        lastSaved: Date.now(),
    } as AppState;
};

export const deleteListFromState = (state: AppState, listId: string): AppState => {
    if (state.lists.length <= 1) return state; // Prevent deleting last list

    const newLists = state.lists.filter((l) => l.id !== listId);
    let newActiveId = state.activeListId;

    if (state.activeListId === listId) {
        // If deleted active list, switch to the first one available
        newActiveId = newLists[0].id;
    }

    return {
        ...state,
        lists: newLists,
        activeListId: newActiveId,
        lastSaved: Date.now(),
    } as AppState;
};
