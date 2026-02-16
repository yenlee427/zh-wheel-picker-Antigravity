"use client";

import React from "react";
import type { ConnectionState } from "ably";

type ToastTone = "info" | "success" | "warning";

type ConnectionToastProps = {
  message: string | null;
  tone: ToastTone;
};

const STATE_LABELS: Record<ConnectionState, string> = {
  initialized: "初始化",
  connecting: "連線中",
  connected: "已連線",
  disconnected: "已斷線",
  suspended: "暫停中",
  closing: "關閉中",
  closed: "已關閉",
  failed: "連線失敗",
};

const STATE_COLOR: Record<ConnectionState, string> = {
  initialized: "bg-gray-400",
  connecting: "bg-amber-500",
  connected: "bg-emerald-500",
  disconnected: "bg-rose-500",
  suspended: "bg-rose-500",
  closing: "bg-gray-500",
  closed: "bg-gray-500",
  failed: "bg-rose-600",
};

const TOAST_CLASSES: Record<ToastTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-gray-700">
      <span className={`h-2.5 w-2.5 rounded-full ${STATE_COLOR[state]}`} />
      <span>Ably: {STATE_LABELS[state]}</span>
    </div>
  );
}

export function ConnectionToast({ message, tone }: ConnectionToastProps) {
  if (!message) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-xs sm:max-w-sm">
      <div
        role="status"
        aria-live="polite"
        className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${TOAST_CLASSES[tone]}`}
      >
        {message}
      </div>
    </div>
  );
}

