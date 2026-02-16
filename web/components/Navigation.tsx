"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disc, Settings } from "lucide-react";
import SettingsModal from "./SettingsModal";

export default function Navigation() {
    const pathname = usePathname();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    if (pathname === "/") return null;

    return (
        <>
            <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="font-bold text-xl text-indigo-600 flex items-center gap-2">
                                <Disc className="w-6 h-6" />
                                <span>中文小遊戲樂園</span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex space-x-4">
                                <Link
                                    href="/single"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/single"
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    單人模式
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/dashboard"
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    題庫總覽
                                </Link>
                                <Link
                                    href="/stats"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/stats"
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    挑戰統計
                                </Link>
                            </div>
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                title="設定與資料管理"
                            >
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
