"use client";

import React from "react";
import { Player, RoomStatus } from "@/lib/typing/types";

type LobbyProps = {
  status: RoomStatus;
  players: Player[];
  myPlayerId?: string;
};

export default function Lobby({ status, players, myPlayerId }: LobbyProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">等候室</h3>
        <span className="text-sm text-gray-500">共 {players.length} 人</span>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-gray-500">目前尚無學生加入。</p>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {players.map((player) => (
            <li
              key={player.id}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                player.id === myPlayerId
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <span className="font-medium text-gray-800 truncate pr-2">
                {player.name}
                {player.id === myPlayerId ? "（你）" : ""}
              </span>
              <span className="text-xs text-gray-500">{player.score} 分</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500">
        {status === "running"
          ? "遊戲進行中，新的加入請等待下一局。"
          : status === "finished"
          ? "本局已結束，老師可重新開始。"
          : "等待老師開始遊戲。"}
      </p>
    </section>
  );
}

