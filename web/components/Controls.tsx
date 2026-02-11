"use client";

import React from "react";
import { Play, RotateCcw, Trash2 } from "lucide-react";

interface ControlsProps {
    onSpin: () => void;
    onClearHistory: () => void;
    onClearSlots: () => void;
    isSpinning: boolean;
    disabled: boolean;
}

export default function Controls({
    onSpin,
    onClearHistory,
    onClearSlots,
    isSpinning,
    disabled,
}: ControlsProps) {
    return (
        <div className="flex flex-col gap-3 w-full">
            <button
                onClick={onSpin}
                disabled={disabled || isSpinning}
                className={`
          w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all
          flex items-center justify-center gap-2
          ${disabled || isSpinning
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95"
                    }
        `}
            >
                <Play className={isSpinning ? "animate-spin" : ""} fill="currentColor" />
                {isSpinning ? "抽選中..." : "開始旋轉"}
            </button>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onClearHistory}
                    disabled={isSpinning}
                    className="py-3 px-4 rounded-lg bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCcw size={18} />
                    清除紀錄
                </button>
                <button
                    onClick={onClearSlots}
                    disabled={isSpinning}
                    className="py-3 px-4 rounded-lg bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 size={18} />
                    清空格子
                </button>
            </div>
        </div>
    );
}
