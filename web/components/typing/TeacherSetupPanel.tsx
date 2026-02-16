"use client";

import React from "react";
import { Play, Square, Copy } from "lucide-react";
import { RoomSettings, RoomStatus } from "@/lib/typing/types";
import SpeedSelector from "./SpeedSelector";

type TeacherSetupPanelProps = {
  roomCode: string;
  status: RoomStatus;
  settings: RoomSettings;
  playerCount: number;
  appUrl?: string;
  disabled?: boolean;
  onSettingsChange: (next: RoomSettings) => void;
  onStartGame: () => void;
  onEndGame: () => void;
};

export default function TeacherSetupPanel({
  roomCode,
  status,
  settings,
  playerCount,
  appUrl,
  disabled = false,
  onSettingsChange,
  onStartGame,
  onEndGame,
}: TeacherSetupPanelProps) {
  const canEditSettings = status === "setup" || status === "lobby";
  const shareUrl = `${appUrl || ""}/games/typing/room/${roomCode}`;

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    alert("已複製房間代碼");
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    alert("已複製分享連結");
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">房間代碼</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold font-mono text-indigo-700">{roomCode}</p>
            <button
              type="button"
              onClick={copyRoomCode}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
            >
              <Copy size={14} />
              複製
            </button>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            status === "running"
              ? "bg-emerald-100 text-emerald-700"
              : status === "finished"
              ? "bg-gray-200 text-gray-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {status === "running" ? "進行中" : status === "finished" ? "已結束" : "等待開始"}
        </span>
      </div>

      <div className="rounded-md bg-indigo-50 border border-indigo-100 p-3 space-y-2">
        <p className="text-sm text-indigo-900">學生加入連結</p>
        <p className="text-xs break-all text-indigo-700">{shareUrl}</p>
        <button
          type="button"
          onClick={copyShareLink}
          className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-white px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50"
        >
          <Copy size={14} />
          複製連結
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">生詞數量</label>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={!canEditSettings || disabled || settings.wordCount <= 5}
              onClick={() =>
                onSettingsChange({ ...settings, wordCount: settings.wordCount - 1 })
              }
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              -
            </button>
            <span className="w-12 text-center font-semibold">{settings.wordCount}</span>
            <button
              type="button"
              disabled={!canEditSettings || disabled || settings.wordCount >= 60}
              onClick={() =>
                onSettingsChange({ ...settings, wordCount: settings.wordCount + 1 })
              }
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        <SpeedSelector
          value={settings.speedLevel}
          disabled={!canEditSettings || disabled}
          onChange={(speedLevel) => onSettingsChange({ ...settings, speedLevel })}
        />

        <div className="text-sm text-gray-600">玩家上限：{settings.maxPlayers}</div>
        <div className="text-sm text-gray-600">目前玩家：{playerCount}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onStartGame}
          disabled={disabled || status === "running" || playerCount === 0}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Play size={16} />
          開始遊戲
        </button>
        <button
          type="button"
          onClick={onEndGame}
          disabled={disabled || status !== "running"}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Square size={16} />
          結束遊戲
        </button>
      </div>
    </section>
  );
}

