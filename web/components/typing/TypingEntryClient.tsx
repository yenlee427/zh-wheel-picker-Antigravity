"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Keyboard, Users, ArrowRight, PlusCircle } from "lucide-react";
import {
  getTeacherClientIdKey,
  getTeacherTicketKey,
} from "@/lib/typing/constants";
import { normalizeRoomCode } from "@/lib/typing/roomCode";
import { CreateRoomResponse } from "@/lib/typing/types";

export default function TypingEntryClient() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/typing/rooms/create", { method: "POST" });
      const data = (await response.json()) as CreateRoomResponse & { error?: string };
      if (!response.ok || !data.roomCode || !data.teacherTicket) {
        throw new Error(data.error || "建立房間失敗");
      }

      sessionStorage.setItem(getTeacherTicketKey(data.roomCode), data.teacherTicket);
      sessionStorage.setItem(getTeacherClientIdKey(data.roomCode), data.teacherClientId);
      router.push(`/games/typing/teacher/${data.roomCode}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "建立房間失敗");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeRoomCode(roomCode);
    if (normalized.length !== 6) {
      alert("請輸入 6 碼房間代碼");
      return;
    }
    router.push(`/games/typing/room/${normalized}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-indigo-100 px-4 py-1.5 text-sm text-indigo-700 font-medium">
            <Keyboard size={16} />
            Typing Blocks
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            中文輸入法遊戲
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            老師建房後分享代碼，學生輸入生詞消除方塊，排行榜即時更新。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">老師端</h2>
            <p className="text-sm text-gray-600">
              建立房間、設定詞庫與速度，控制開始與結束，並監看排行榜。
            </p>
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full h-12 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <PlusCircle size={18} />
              {isCreating ? "建立中..." : "建立新房間"}
            </button>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">學生端</h2>
            <p className="text-sm text-gray-600">
              輸入老師提供的 6 碼房間代碼，填寫姓名後加入等候室。
            </p>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <label htmlFor="room-code" className="text-sm font-medium text-gray-700 block">
                房間代碼
              </label>
              <input
                id="room-code"
                type="text"
                value={roomCode}
                onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))}
                maxLength={6}
                placeholder="例如 A1B2C3"
                className="w-full h-12 rounded-xl border border-gray-300 px-4 text-lg font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Users size={18} />
                加入房間
              </button>
            </form>
          </section>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            返回小遊戲首頁 <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}

