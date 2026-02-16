"use client";

import React, { useState, useRef, memo } from "react";
import Link from "next/link";
import { Play, Edit2, Clock } from "lucide-react";
import { WheelList } from "@/types/wheelList";
import Wheel from "@/components/Wheel";
import { calculateFinalRotation } from "@/lib/wheelMath";

interface DashboardWheelCardProps {
    list: WheelList;
    monoColor: string;
    onUpdateList: (id: string, updates: Partial<WheelList>) => void;
}

const DashboardWheelCard = memo(({ list, monoColor, onUpdateList }: DashboardWheelCardProps) => {
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<{ label: string; timestamp: number } | null>(
        list.history.length > 0
            ? { label: list.history[0].label, timestamp: list.history[0].timestamp }
            : null
    );

    const pendingResultRef = useRef<{ label: string; selectedIndex: number } | null>(null);

    // Set random initial rotation on mount (client-side only to match hydration)
    React.useEffect(() => {
        setRotation(Math.floor(Math.random() * 360));
    }, []);

    const handleSpin = () => {
        if (isSpinning) return;

        const validIndices = list.slots
            .map((s, i) => (s.label.trim() ? i : -1))
            .filter((i) => i >= 0);

        if (validIndices.length === 0) {
            alert("此題庫沒有有效題目");
            return;
        }

        setIsSpinning(true);

        const randomIndex = Math.floor(Math.random() * validIndices.length);
        const selectedIndex = validIndices[randomIndex];
        const selectedLabel = list.slots[selectedIndex].label;

        const spins = 5 + Math.floor(Math.random() * 3); // Slightly fewer spins for dashboard
        const newRotation = calculateFinalRotation(selectedIndex, list.settings.slotCount, rotation, spins);

        setRotation(newRotation);
        pendingResultRef.current = { label: selectedLabel, selectedIndex };
    };

    const handleSpinEnd = () => {
        setIsSpinning(false);
        const result = pendingResultRef.current;
        if (result) {
            const timestamp = Date.now();
            setLastResult({ label: result.label, timestamp });

            // Update global state history
            const newHistoryItem = {
                id: crypto.randomUUID(),
                timestamp,
                label: result.label,
                selectedIndex: result.selectedIndex
            };

            const newHistory = [newHistoryItem, ...list.history].slice(0, 100);
            onUpdateList(list.id, { history: newHistory });
        }
    };

    const hasSlots = list.slots.some(s => s.label.trim() !== "");

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-800 truncate" title={list.name}>
                    {list.name}
                </h3>
                <Link
                    href={`/single?list=${list.id}`}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="編輯此題庫"
                >
                    <Edit2 size={16} />
                </Link>
            </div>

            <div className="p-6 flex-grow flex flex-col items-center justify-center gap-6 relative">
                <div className="w-full max-w-[240px]">
                    <Wheel
                        slots={list.slots}
                        rotation={rotation}
                        isSpinning={isSpinning}
                        onSpinEnd={handleSpinEnd}
                        variant="mono"
                        monoColor={monoColor}
                    />
                </div>

                {/* Result Overlay or Area */}
                {lastResult && (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-2">
                        <div className="text-xs text-gray-400 flex items-center justify-center gap-1 mb-1">
                            <Clock size={12} />
                            {new Date(lastResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-lg font-bold text-gray-800 break-words line-clamp-2 px-4">
                            {lastResult.label}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <button
                    onClick={handleSpin}
                    disabled={isSpinning || !hasSlots}
                    className={`
            w-full py-3 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2
            ${isSpinning || !hasSlots
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "text-white hover:shadow-md active:scale-95"
                        }
          `}
                    style={{
                        backgroundColor: isSpinning || !hasSlots ? undefined : monoColor,
                    }}
                >
                    <Play size={16} fill={isSpinning ? "currentColor" : "none"} className={isSpinning ? "animate-spin" : ""} />
                    {isSpinning ? "出題中" : "抽一題"}
                </button>
            </div>
        </div>
    );
});

DashboardWheelCard.displayName = "DashboardWheelCard";

export default DashboardWheelCard;
