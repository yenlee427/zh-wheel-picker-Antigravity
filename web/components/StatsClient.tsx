"use client";

import React, { useMemo } from "react";
import { useAppState } from "@/lib/contexts/AppStateContext";
import { BarChart3 } from "lucide-react";

export default function StatsClient() {
    const { state, isLoaded } = useAppState();

    const stats = useMemo(() => {
        if (!state) return [];
        return state.lists.map(list => {
            const frequency: Record<string, number> = {};
            list.history.forEach(item => {
                frequency[item.label] = (frequency[item.label] || 0) + 1;
            });

            const sorted = Object.entries(frequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5); // Top 5

            return {
                id: list.id,
                name: list.name,
                totalSpins: list.history.length,
                topOptions: sorted
            };
        }).filter(item => item.totalSpins > 0); // Only show lists with history
    }, [state]);

    if (!isLoaded || !state) {
        return <div className="p-8 text-center text-gray-500">載入中...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">統計數據</h1>
            </div>

            {stats.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">尚無任何抽選紀錄</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map(list => (
                        <div key={list.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-lg mb-2 text-gray-800 border-b border-gray-100 pb-2 flex justify-between">
                                <span className="truncate pr-2">{list.name}</span>
                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full self-start">
                                    共 {list.totalSpins} 次
                                </span>
                            </h3>

                            <div className="space-y-3 mt-4">
                                {list.topOptions.map(([label, count], index) => {
                                    const percentage = Math.round((count / list.totalSpins) * 100);
                                    return (
                                        <div key={label} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-gray-700 truncate w-2/3">{label}</span>
                                                <span className="text-gray-500">{count} 次 ({percentage}%)</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${index === 0 ? 'bg-indigo-500' : 'bg-indigo-300'}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
