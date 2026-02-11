"use client";

import React, { useRef } from "react";
import { X, Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { useAppState } from "@/lib/contexts/AppStateContext";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { state, importState } = useAppState();

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleExport = () => {
        if (!state) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `zh-wheel-picker-backup-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Validate basic structure
                if (json && typeof json === 'object' && Array.isArray(json.lists)) {
                    if (confirm("匯入將會覆蓋現有的所有資料。確定要繼續嗎？")) {
                        importState(json);
                        onClose();
                        alert("匯入成功！");
                    }
                } else {
                    alert("無效的備份檔案格式");
                }
            } catch (err) {
                console.error(err);
                alert("讀取檔案失敗");
            }
        };
        reader.readAsText(file);

        // Reset input
        e.target.value = "";
    };

    const handleCleanLegacy = () => {
        if (!confirm("確定要刪除所有舊版備份資料嗎？此動作無法復原。")) return;

        let count = 0;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("zhWheelPicker:legacy:")) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            count++;
        });

        if (count > 0) {
            alert(`已清除 ${count} 筆舊版備份資料。`);
        } else {
            alert("找不到舊版備份資料。");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">設定與資料管理</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Backup Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">備份與還原</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleExport}
                                className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
                            >
                                <div className="p-3 bg-gray-100 rounded-full group-hover:bg-white text-gray-600 group-hover:text-indigo-600 transition-colors">
                                    <Download size={24} />
                                </div>
                                <span className="font-medium">匯出備份</span>
                            </button>

                            <button
                                onClick={handleImportClick}
                                className="flex flex-col items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-all group"
                            >
                                <div className="p-3 bg-gray-100 rounded-full group-hover:bg-white text-gray-600 group-hover:text-amber-600 transition-colors">
                                    <Upload size={24} />
                                </div>
                                <span className="font-medium">匯入資料</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {/* Legacy Cleanup Section */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">進階選項</h3>
                        <button
                            onClick={handleCleanLegacy}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 size={20} className="text-gray-400 group-hover:text-red-500" />
                                <span className="font-medium">清除舊版 v1 備份資料</span>
                            </div>
                            <AlertTriangle size={16} className="text-gray-300 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <p className="text-xs text-gray-400 px-1">
                            若您已經確認 v2 版本運作正常，且不需要 v1 的舊資料，可以執行此動作釋放空間。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
