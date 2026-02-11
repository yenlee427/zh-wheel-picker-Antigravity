"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

interface SlotEditorProps {
    slots: { label: string }[];
    slotCount: number;
    onSlotCountChange: (count: number) => void;
    onSlotChange: (index: number, value: string) => void;
}

export default function SlotEditor({
    slots,
    slotCount,
    onSlotCountChange,
    onSlotChange,
}: SlotEditorProps) {
    const handleCountChange = (delta: number) => {
        const newCount = Math.max(2, Math.min(50, slotCount + delta));
        onSlotCountChange(newCount);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">選項編輯</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleCountChange(-1)}
                        disabled={slotCount <= 2}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                        aria-label="減少格子"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="font-mono font-medium w-8 text-center">{slotCount}</span>
                    <button
                        onClick={() => handleCountChange(1)}
                        disabled={slotCount >= 50}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                        aria-label="增加格子"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                {slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400 w-6 text-right">
                            {index + 1}.
                        </span>
                        <input
                            type="text"
                            value={slot.label}
                            onChange={(e) => onSlotChange(index, e.target.value)}
                            placeholder={`選項 ${index + 1}`}
                            className="flex-grow px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
