"use client";

import React from "react";
import { HistoryItem } from "@/types/wheel";

interface HistoryListProps {
    history: HistoryItem[];
}

export default function HistoryList({ history }: HistoryListProps) {
    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 text-sm border-t border-gray-100">
                尚無歷史紀錄
            </div>
        );
    }

    return (
        <div className="border-t border-gray-100">
            <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">時間</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">結果</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {history.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-400 font-mono text-xs whitespace-nowrap">
                                    {new Date(item.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                    })}
                                </td>
                                <td className="px-4 py-2 text-gray-800 font-medium">{item.label}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
