"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown } from "lucide-react";
import { WheelList } from "@/types/wheelList";

interface ListSelectorProps {
    lists: WheelList[];
    activeListId: string;
    onSelectList: (id: string) => void;
    onAddList: () => void;
    onRenameList: (id: string, newName: string) => void;
    onDeleteList: (id: string) => void;
    onMoveList: (id: string, direction: "up" | "down") => void;
}

export default function ListSelector({
    lists,
    activeListId,
    onSelectList,
    onAddList,
    onRenameList,
    onDeleteList,
    onMoveList,
}: ListSelectorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");

    const activeList = lists.find((l) => l.id === activeListId);
    const activeIndex = lists.findIndex((l) => l.id === activeListId);

    const handleStartEdit = () => {
        if (activeList) {
            setEditName(activeList.name);
            setIsEditing(true);
        }
    };

    const handleSaveEdit = () => {
        if (editName.trim() && activeList) {
            onRenameList(activeListId, editName.trim());
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (lists.length <= 1) {
            alert("至少需要保留一個清單");
            return;
        }
        if (confirm(`確定要刪除「${activeList?.name}」嗎？此動作無法復原。`)) {
            onDeleteList(activeListId);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-grow flex items-center gap-2 w-full sm:w-auto">
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-grow px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                            }}
                        />
                        <button
                            onClick={handleSaveEdit}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                            title="儲存"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title="取消"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 w-full">
                        <button
                            onClick={() => onMoveList(activeListId, "up")}
                            disabled={activeIndex <= 0}
                            className={`p-2 rounded-md transition-colors ${activeIndex <= 0 ? "text-gray-300" : "text-gray-500 hover:bg-gray-100"}`}
                            title="上移"
                        >
                            <ArrowUp size={18} />
                        </button>
                        <button
                            onClick={() => onMoveList(activeListId, "down")}
                            disabled={activeIndex >= lists.length - 1}
                            className={`p-2 rounded-md transition-colors ${activeIndex >= lists.length - 1 ? "text-gray-300" : "text-gray-500 hover:bg-gray-100"}`}
                            title="下移"
                        >
                            <ArrowDown size={18} />
                        </button>
                        <div className="h-6 w-px bg-gray-200 mx-1"></div>
                        <select
                            value={activeListId}
                            onChange={(e) => onSelectList(e.target.value)}
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-700 font-medium"
                        >
                            {lists.map((list) => (
                                <option key={list.id} value={list.id}>
                                    {list.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleStartEdit}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="重新命名"
                        >
                            <Edit2 size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                    onClick={() => onAddList()}
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors font-medium text-sm"
                >
                    <Plus size={16} />
                    <span>新增清單</span>
                </button>
                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                <button
                    onClick={handleDelete}
                    disabled={lists.length <= 1}
                    className={`p-2 rounded-md transition-colors ${lists.length <= 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                    title="刪除目前清單"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
