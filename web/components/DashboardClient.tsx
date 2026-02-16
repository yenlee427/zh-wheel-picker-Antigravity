"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/lib/contexts/AppStateContext";
import DashboardWheelCard from "@/components/DashboardWheelCard";
import { MONO_COLORS } from "@/lib/constants";

export default function DashboardClient() {
    const { state, updateList, addList, isLoaded } = useAppState();
    const [searchQuery, setSearchQuery] = useState("");

    // Sort lists by updatedAt desc and take top 6
    // Use useMemo to prevent re-sorting on every render if state logic changes freq
    const displayLists = useMemo(() => {
        if (!state) return [];
        let lists = [...state.lists];

        if (searchQuery.trim()) {
            lists = lists.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return lists
            // .sort((a, b) => b.updatedAt - a.updatedAt) // Removed to respect manual order
            // .slice(0, 6); // Optional: Keep limit or remove? Let's remove limit for now or keep it? Plan says "Quickly find lists...". If reordering is enabled, maybe we should show all? 
            // User request "Order" usually implies they want to control what's seen. 
            // Let's keep all lists if reasonable, or top N. The prompt didn't specify.
            // But keeping top 6 might hide the ones they moved down. 
            // Let's keep the slice for "Dashboard" concept (Overview), but maybe increase limit or remove current sort.
            .slice(0, 12); // Increase limit to 12 for better visibility?
    }, [state, searchQuery]); // update when lists array changes

    if (!isLoaded || !state) {
        return <div className="p-8 text-center text-gray-500">載入中...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">題庫總覽</h1>
                    <div className="text-sm text-gray-500 hidden sm:block mt-1">
                        顯示 {displayLists.length} / {state.lists.length} 組題庫
                    </div>
                </div>

                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="搜尋題庫..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    )}
                </div>
            </div>

            {state.lists.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">尚無題庫</p>
                    <button
                        onClick={() => addList("新題庫")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        建立第一個題庫
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayLists.map((list, index) => (
                        <DashboardWheelCard
                            key={list.id}
                            list={list}
                            monoColor={MONO_COLORS[index % MONO_COLORS.length]}
                            onUpdateList={updateList}
                        />
                    ))}

                    {/* Optional: Add "New List" card if fewer than 6? 
              Plan says "If < 6: Show existing lists (no empty cards for MVP)".
              So we just render what we have.
           */}
                </div>
            )}
        </div>
    );
}
