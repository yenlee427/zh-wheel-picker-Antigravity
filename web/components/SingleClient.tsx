"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/contexts/AppStateContext";
import Wheel from "@/components/Wheel";
import Controls from "@/components/Controls";
import SlotEditor from "@/components/SlotEditor";
import ResultBanner from "@/components/ResultBanner";
import HistoryList from "@/components/HistoryList";
import ListSelector from "@/components/ListSelector";
import { calculateFinalRotation } from "@/lib/wheelMath";

export default function SingleClient() {
    const {
        activeList: list,
        setActiveListId,
        state,
        updateList,
        addList,
        renameList,
        deleteList,
        moveList,
        isLoaded
    } = useAppState();

    const searchParams = useSearchParams();
    const queryListId = searchParams.get("list");

    // Local state for animation
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentResult, setCurrentResult] = useState<string | null>(null);
    const pendingResultRef = useRef<{ label: string; selectedIndex: number } | null>(null);

    // Sync active list from query param on mount
    useEffect(() => {
        if (queryListId && state && state.lists.find(l => l.id === queryListId)) {
            if (state.activeListId !== queryListId) {
                setActiveListId(queryListId);
            }
        }
    }, [queryListId, state, setActiveListId]);

    if (!isLoaded || !list) {
        return <div className="p-8 text-center text-gray-500">載入中...</div>;
    }

    // --- Handlers ---

    const handleSlotCountChange = (count: number) => {
        if (isSpinning) return;

        // Resize slots array
        let newSlots = [...list.slots];
        if (count > newSlots.length) {
            newSlots = [
                ...newSlots,
                ...Array.from({ length: count - newSlots.length }, () => ({ label: "" })),
            ];
        } else {
            newSlots = newSlots.slice(0, count);
        }

        updateList(list.id, {
            settings: { ...list.settings, slotCount: count },
            slots: newSlots,
        });
    };

    const handleSlotChange = (index: number, value: string) => {
        if (isSpinning) return;
        const newSlots = [...list.slots];
        newSlots[index] = { label: value };
        updateList(list.id, { slots: newSlots });
    };

    const handleSpin = () => {
        if (isSpinning) return;

        // Filter valid slots
        const validIndices = list.slots
            .map((s, i) => (s.label.trim() ? i : -1))
            .filter((i) => i >= 0);

        if (validIndices.length === 0) {
            alert("請至少填寫一個題目！");
            return;
        }

        setIsSpinning(true);
        setCurrentResult(null);

        // Random selection
        const randomIndex = Math.floor(Math.random() * validIndices.length);
        const selectedIndex = validIndices[randomIndex];
        const selectedLabel = list.slots[selectedIndex].label;

        // Calculate rotation
        // Add randomness to rotation count (5-10 spins)
        const spins = 5 + Math.floor(Math.random() * 5);
        const newRotation = calculateFinalRotation(selectedIndex, list.settings.slotCount, rotation, spins);

        setRotation(newRotation);

        // Store result temporarily to add to history on finish
        // We used a closure or ref in plan, here we rely on the callback
        // But we need to know the result in callback.
        // Let's use a ref to track pending result
        pendingResultRef.current = { label: selectedLabel, selectedIndex };
    };



    const handleSpinEnd = () => {
        setIsSpinning(false);
        const result = pendingResultRef.current;
        if (result) {
            setCurrentResult(result.label);

            // Add to history
            const newHistoryItem = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                label: result.label,
                selectedIndex: result.selectedIndex
            };

            const newHistory = [newHistoryItem, ...list.history].slice(0, 100);
            updateList(list.id, { history: newHistory });
        }
    };

    const handleClearHistory = () => {
        if (confirm("確定要清除所有出題紀錄嗎？")) {
            updateList(list.id, { history: [] });
        }
    };

    const handleClearSlots = () => {
        if (confirm("確定要清空所有題目嗎？")) {
            const newSlots = list.slots.map(() => ({ label: "" }));
            updateList(list.id, { slots: newSlots });
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <ListSelector
                lists={state!.lists}
                activeListId={list.id}
                onSelectList={setActiveListId}
                onAddList={addList}
                onRenameList={renameList}
                onDeleteList={deleteList}
                onMoveList={moveList}
            />

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Wheel & Result */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                        <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
                            {list.name}
                        </h2>
                        <Wheel
                            slots={list.slots}
                            rotation={rotation}
                            isSpinning={isSpinning}
                            onSpinEnd={handleSpinEnd}
                            variant="multi"
                        />
                    </div>

                    <ResultBanner result={currentResult} />
                </div>

                {/* Right Column: Controls & Editor */}
                <div className="lg:col-span-5 space-y-6">
                    <Controls
                        onSpin={handleSpin}
                        onClearHistory={handleClearHistory}
                        onClearSlots={handleClearSlots}
                        isSpinning={isSpinning}
                        disabled={list.slots.every(s => !s.label.trim())}
                    />

                    <SlotEditor
                        slots={list.slots}
                        slotCount={list.settings.slotCount}
                        onSlotCountChange={handleSlotCountChange}
                        onSlotChange={handleSlotChange}
                    />

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-700">出題紀錄 (本題庫)</h3>
                        </div>
                        <HistoryList history={list.history} />
                    </div>
                </div>
            </div>
        </div>
    );
}
