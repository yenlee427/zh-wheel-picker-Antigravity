"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AppState, StoredAppState, WheelList } from "@/types/wheelList";
import { APP_STATE_KEY } from "@/lib/constants";
import { runMigration } from "@/lib/migration";
import { createNewList, updateListInState, addListToState, deleteListFromState } from "@/lib/listUtils";

interface AppStateContextType {
    state: AppState | null;
    activeList: WheelList | null;
    setActiveListId: (id: string) => void;
    updateList: (id: string, updates: Partial<WheelList>) => void;
    addList: (name?: string) => void;
    renameList: (id: string, newName: string) => void;
    deleteList: (id: string) => void;
    moveList: (id: string, direction: "up" | "down") => void;
    importState: (newState: AppState) => void;
    isLoaded: boolean;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<StoredAppState | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load state and run migration on mount
    useEffect(() => {
        const migratedState = runMigration();
        if (migratedState) {
            setState(migratedState);
        } else {
            // If migration returned null (SSR or error), rely on client-side check or just wait
            // But runMigration handles standard checks.
            // If no data, it creates default.
        }
        setIsLoaded(true);
    }, []);

    // Sync state to localStorage whenever it changes
    useEffect(() => {
        if (state && isLoaded) {
            localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
        }
    }, [state, isLoaded]);

    // Listen for storage events (cross-tab sync)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === APP_STATE_KEY && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    // Only update if remote version is newer or different?
                    // Since we save timestamp, we can compare.
                    // For now, just sync.
                    setState(parsed);
                } catch (error) {
                    console.error("Failed to sync state from storage event", error);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const activeList = state ? state.lists.find((l) => l.id === state.activeListId) || state.lists[0] : null;

    const setActiveListId = useCallback((id: string) => {
        setState((prev) => {
            if (!prev) return null;
            return { ...prev, activeListId: id, lastSaved: Date.now() };
        });
    }, []);

    const updateList = useCallback((id: string, updates: Partial<WheelList>) => {
        setState((prev) => {
            if (!prev) return null;
            return updateListInState(prev, id, updates) as StoredAppState;
        });
    }, []);

    const addList = useCallback((name: string = `清單 ${state ? state.lists.length + 1 : 1}`) => {
        const newList = createNewList(name);
        setState((prev) => {
            if (!prev) return null;
            return addListToState(prev, newList) as StoredAppState;
        });
    }, [state]);

    const deleteList = useCallback((id: string) => {
        setState((prev) => {
            if (!prev) return null;
            return deleteListFromState(prev, id) as StoredAppState;
        });
    }, []);

    const renameList = useCallback((id: string, newName: string) => {
        updateList(id, { name: newName });
    }, [updateList]);

    const moveList = useCallback((id: string, direction: "up" | "down") => {
        setState((prev) => {
            if (!prev) return null;
            const index = prev.lists.findIndex((l) => l.id === id);
            if (index === -1) return prev;

            const newLists = [...prev.lists];
            if (direction === "up") {
                if (index === 0) return prev; // Already at top
                [newLists[index - 1], newLists[index]] = [newLists[index], newLists[index - 1]];
            } else {
                if (index === newLists.length - 1) return prev; // Already at bottom
                [newLists[index + 1], newLists[index]] = [newLists[index], newLists[index + 1]];
            }

            return { ...prev, lists: newLists, lastSaved: Date.now() };
        });
    }, []);

    const importState = useCallback((newState: AppState) => {
        setState({
            ...newState,
            lastSaved: Date.now(),
        });
    }, []);

    return (
        <AppStateContext.Provider
            value={{
                state,
                activeList,
                setActiveListId,
                updateList,
                addList,
                renameList,
                deleteList,
                moveList,
                importState,
                isLoaded,
            }}
        >
            {children}
        </AppStateContext.Provider>
    );
}

export function useAppState() {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error("useAppState must be used within an AppStateProvider");
    }
    return context;
}
