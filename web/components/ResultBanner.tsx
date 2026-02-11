"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface ResultBannerProps {
    result: string | null;
}

export default function ResultBanner({ result }: ResultBannerProps) {
    if (!result) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg text-center animate-in fade-in zoom-in duration-300 transform"
        >
            <div className="flex items-center justify-center gap-2 mb-1 text-indigo-200 text-sm font-medium uppercase tracking-wider">
                <Sparkles size={16} />
                抽選結果
                <Sparkles size={16} />
            </div>
            <div className="text-3xl font-bold break-words">{result}</div>
        </div>
    );
}
