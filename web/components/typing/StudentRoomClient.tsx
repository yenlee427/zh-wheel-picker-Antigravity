"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createTypingRealtimeClient } from "@/lib/typing/ablyClient";
import {
  STORAGE_KEYS,
  getEventsChannelName,
  getPlayerIdKey,
  getStateChannelName,
} from "@/lib/typing/constants";
import { normalizeRoomCode } from "@/lib/typing/roomCode";
import {
  EventsChannelEvent,
  GameStartPayload,
  RoomState,
  StateChannelEvent,
} from "@/lib/typing/types";
import GameBoard from "./GameBoard";
import Lobby from "./Lobby";
import Scoreboard from "./Scoreboard";
import { ConnectionBadge, ConnectionToast } from "./ConnectionStatus";

type StudentRoomClientProps = {
  roomCode: string;
};

const getStoredPlayerId = (roomCode: string): string => {
  const key = getPlayerIdKey(roomCode);
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = `player-${crypto.randomUUID()}`;
  sessionStorage.setItem(key, id);
  return id;
};

export default function StudentRoomClient({ roomCode }: StudentRoomClientProps) {
  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const [displayName, setDisplayName] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME) || "";
  });
  const [submittedName, setSubmittedName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [joinRequested, setJoinRequested] = useState(false);
  const [joinAccepted, setJoinAccepted] = useState(false);
  const [joinBlocked, setJoinBlocked] = useState(false);
  const [roomInterrupted, setRoomInterrupted] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameStart, setGameStart] = useState<GameStartPayload | null>(null);
  const [localScore, setLocalScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameEndedAt, setGameEndedAt] = useState<number | null>(null);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionToast, setConnectionToast] = useState<{
    tone: "info" | "success" | "warning";
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const realtimeRef = useRef<Ably.Realtime | null>(null);
  const eventsChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const wasAcceptedRef = useRef(false);
  const connectionToastTimerRef = useRef<number | null>(null);

  const publishEvent = useCallback(
    async (
      name: "JOIN_REQUEST" | "SCORE_REPORT" | "PLAYER_GAME_OVER" | "LEAVE_NOTICE",
      event: EventsChannelEvent
    ) => {
      const channel = eventsChannelRef.current;
      if (!channel) return;
      await channel.publish(name, event);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (connectionToastTimerRef.current !== null) {
        window.clearTimeout(connectionToastTimerRef.current);
      }
    };
  }, []);

  const showConnectionToast = useCallback(
    (tone: "info" | "success" | "warning", message: string) => {
      setConnectionToast({ tone, message });
      if (connectionToastTimerRef.current !== null) {
        window.clearTimeout(connectionToastTimerRef.current);
      }
      connectionToastTimerRef.current = window.setTimeout(() => {
        setConnectionToast(null);
        connectionToastTimerRef.current = null;
      }, 2600);
    },
    []
  );

  const requestJoin = useCallback(async () => {
    if (!playerId || !submittedName) return;
    await publishEvent("JOIN_REQUEST", {
      type: "JOIN_REQUEST",
      payload: {
        playerId,
        name: submittedName,
      },
    });
  }, [playerId, publishEvent, submittedName]);

  useEffect(() => {
    if (!joinRequested || !submittedName || !normalizedRoomCode || !playerId) return;

    const realtime = createTypingRealtimeClient({
      role: "student",
      roomCode: normalizedRoomCode,
      clientId: playerId,
    });
    realtimeRef.current = realtime;

    const handleConnection = (change: Ably.ConnectionStateChange) => {
      setConnectionState(change.current);
      if (
        change.current === "connected" &&
        change.previous &&
        change.previous !== "connected"
      ) {
        showConnectionToast(
          "success",
          change.previous === "connecting" || change.previous === "initialized"
            ? "即時連線已建立。"
            : "即時連線已恢復。"
        );
      }
      if (
        (change.current === "disconnected" ||
          change.current === "suspended" ||
          change.current === "failed") &&
        change.current !== change.previous
      ) {
        showConnectionToast("warning", "即時連線中斷，正在嘗試重新連線...");
      }
    };
    realtime.connection.on(handleConnection);

    const stateChannel = realtime.channels.get(getStateChannelName(normalizedRoomCode));
    const eventsChannel = realtime.channels.get(getEventsChannelName(normalizedRoomCode));
    eventsChannelRef.current = eventsChannel;

    const initialize = async () => {
      try {
        await Promise.all([stateChannel.attach(), eventsChannel.attach()]);

        await stateChannel.subscribe("ROOM_STATE", (message) => {
          const event = message.data as StateChannelEvent;
          if (event?.type !== "ROOM_STATE") return;

          const nextState = event.payload;
          setRoomState(nextState);
          const accepted = nextState.players.some((player) => player.id === playerId);

          if (wasAcceptedRef.current && !accepted) {
            setRoomInterrupted(true);
          }
          if (accepted) {
            setRoomInterrupted(false);
          }
          wasAcceptedRef.current = accepted;

          setJoinAccepted(accepted);
          if (nextState.status === "running" && !accepted) {
            setJoinBlocked(true);
          } else {
            setJoinBlocked(false);
          }
        });

        await stateChannel.subscribe("GAME_START", (message) => {
          const event = message.data as StateChannelEvent;
          if (event?.type !== "GAME_START") return;
          setGameStart(event.payload);
          setLocalScore(0);
          setIsGameOver(false);
          setGameEndedAt(null);
          setRoomInterrupted(false);
        });

        await stateChannel.subscribe("GAME_END", (message) => {
          const event = message.data as StateChannelEvent;
          if (event?.type !== "GAME_END") return;
          setGameEndedAt(event.payload.endedAt);
        });

        await requestJoin();
      } catch (connectError) {
        console.error(connectError);
        setError("無法連線到房間，請稍後再試。");
      }
    };

    void initialize();

    return () => {
      void publishEvent("LEAVE_NOTICE", {
        type: "LEAVE_NOTICE",
        payload: {
          playerId,
        },
      });
      stateChannel.unsubscribe();
      realtime.connection.off(handleConnection);
      realtime.close();
      realtimeRef.current = null;
      eventsChannelRef.current = null;
    };
  }, [
    joinRequested,
    normalizedRoomCode,
    playerId,
    publishEvent,
    requestJoin,
    showConnectionToast,
    submittedName,
  ]);

  const handleJoinSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      alert("請先輸入姓名");
      return;
    }
    if (trimmed.length > 20) {
      alert("姓名最多 20 字");
      return;
    }
    localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, trimmed);
    setPlayerId(getStoredPlayerId(normalizedRoomCode));
    setSubmittedName(trimmed);
    setJoinRequested(true);
  };

  const onScoreChange = async (score: number) => {
    if (!playerId) return;
    setLocalScore(score);
    await publishEvent("SCORE_REPORT", {
      type: "SCORE_REPORT",
      payload: {
        playerId,
        score,
      },
    });
  };

  const onGameOver = async () => {
    if (!playerId || isGameOver) return;
    setIsGameOver(true);
    await publishEvent("PLAYER_GAME_OVER", {
      type: "PLAYER_GAME_OVER",
      payload: {
        playerId,
      },
    });
  };

  const gameRunning =
    roomState?.status === "running" && !!gameStart && !joinBlocked && joinAccepted;

  const myPlayer = useMemo(() => {
    if (!roomState || !playerId) return null;
    return roomState.players.find((player) => player.id === playerId) || null;
  }, [playerId, roomState]);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white border border-red-200 rounded-xl p-6 space-y-3">
          <h1 className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={18} />
            進入房間失敗
          </h1>
          <p className="text-gray-700">{error}</p>
          <Link href="/games/typing" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md">
            返回入口
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">學生遊戲頁</h1>
            <p className="text-sm text-gray-500">房間代碼：{normalizedRoomCode}</p>
          </div>
          <ConnectionBadge state={connectionState} />
        </header>

        {!joinRequested ? (
          <section className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
            <h2 className="text-lg font-semibold text-gray-900">加入房間</h2>
            <p className="text-sm text-gray-600 mt-1">請輸入你的姓名以加入等候室。</p>
            <form onSubmit={handleJoinSubmit} className="mt-4 space-y-3">
              <label htmlFor="display-name" className="text-sm font-medium text-gray-700 block">
                姓名
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="例如 王小明"
                className="w-full h-11 rounded-md border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full h-11 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                加入等候室
              </button>
            </form>
          </section>
        ) : (
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 space-y-5">
              {gameRunning && gameStart ? (
                <GameBoard
                  words={gameStart.words}
                  speedLevel={gameStart.settings.speedLevel}
                  seed={gameStart.seed}
                  startAt={gameStart.startAt}
                  onScoreChange={onScoreChange}
                  onGameOver={onGameOver}
                />
              ) : (
                <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">等待遊戲開始</h2>
                  {joinBlocked ? (
                    <p className="text-sm text-amber-700">
                      遊戲進行中，請等待老師開啟下一局。
                    </p>
                  ) : roomInterrupted ? (
                    <div className="space-y-2">
                      <p className="text-sm text-red-700">
                        房間狀態已中斷，請重新送出加入請求。
                      </p>
                      <button
                        type="button"
                        onClick={() => void requestJoin()}
                        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm"
                      >
                        重新加入
                      </button>
                    </div>
                  ) : joinAccepted ? (
                    <p className="text-sm text-gray-600">已加入房間，請等待老師開始。</p>
                  ) : (
                    <p className="text-sm text-gray-600">加入請求已送出，等待老師接收。</p>
                  )}
                  {gameEndedAt && (
                    <p className="text-sm text-gray-500">
                      上一局已於 {new Date(gameEndedAt).toLocaleTimeString()} 結束。
                    </p>
                  )}
                </section>
              )}
            </div>

            <div className="lg:col-span-4 space-y-5">
              <section className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">我的狀態</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {myPlayer?.name || submittedName}
                </p>
                <p className="text-sm text-indigo-700 mt-1">目前分數：{localScore}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {isGameOver ? "你已達到遊戲結束條件。" : "持續輸入命中可提升分數。"}
                </p>
              </section>

              <Lobby status={roomState?.status || "lobby"} players={roomState?.players || []} myPlayerId={playerId} />
              <Scoreboard players={roomState?.players || []} myPlayerId={playerId} limit={10} />
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          <Link href="/games/typing" className="text-indigo-600 hover:text-indigo-700">
            返回遊戲入口
          </Link>
        </div>
      </div>
      <ConnectionToast
        message={connectionToast?.message ?? null}
        tone={connectionToast?.tone ?? "info"}
      />
    </main>
  );
}
