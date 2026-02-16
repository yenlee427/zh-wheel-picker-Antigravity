"use client";

import React, { useMemo } from "react";
import { Player } from "@/lib/typing/types";

type ScoreboardProps = {
  players: Player[];
  limit?: number;
  myPlayerId?: string;
  title?: string;
};

export default function Scoreboard({
  players,
  limit = 10,
  myPlayerId,
  title = "排行榜",
}: ScoreboardProps) {
  const ranked = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.joinedAt - b.joinedAt;
      })
      .slice(0, limit);
  }, [players, limit]);

  return (
    <section
      className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 space-y-3"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-500">前 {limit} 名</span>
      </div>

      {ranked.length === 0 ? (
        <p className="text-sm text-gray-500">目前尚無玩家資料。</p>
      ) : (
        <ol className="space-y-2">
          {ranked.map((player, index) => (
            <li
              key={player.id}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                player.id === myPlayerId
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="min-w-0 pr-2">
                <span className="font-mono text-xs text-gray-500 mr-2">#{index + 1}</span>
                <span className="font-medium text-gray-800 truncate">
                  {player.name}
                  {player.id === myPlayerId ? "（你）" : ""}
                </span>
              </div>
              <span className="font-semibold text-gray-700">{player.score}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

