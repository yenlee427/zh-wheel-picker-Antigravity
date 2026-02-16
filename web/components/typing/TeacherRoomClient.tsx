"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Users } from "lucide-react";
import { createTypingRealtimeClient } from "@/lib/typing/ablyClient";
import {
  DEFAULT_MAX_PLAYERS,
  DEFAULT_ROUND_DURATION_SEC,
  DEFAULT_WORD_COUNT,
  DEFAULT_WORDS,
  ROOM_STATE_THROTTLE_MS,
  getEventsChannelName,
  getStateChannelName,
  getTeacherClientIdKey,
  getTeacherTicketKey,
} from "@/lib/typing/constants";
import {
  EventsChannelEvent,
  GameStartEvent,
  Player,
  RoomState,
  RoomStateEvent,
} from "@/lib/typing/types";
import Lobby from "./Lobby";
import Scoreboard from "./Scoreboard";
import TeacherSetupPanel from "./TeacherSetupPanel";
import WordGridEditor from "./WordGridEditor";
import { ConnectionBadge, ConnectionToast } from "./ConnectionStatus";

const getDefaultWords = (count: number): string[] => {
  const words = Array.from({ length: count }, (_, index) => DEFAULT_WORDS[index] || "");
  return words;
};

const normalizeRoundDurationSec = (value: number): number =>
  Math.max(60, Math.min(600, Math.round(value)));

const createInitialRoomState = (roomCode: string, teacherClientId: string): RoomState => ({
  roomCode,
  status: "lobby",
  settings: {
    wordCount: DEFAULT_WORD_COUNT,
    speedLevel: 2,
    maxPlayers: DEFAULT_MAX_PLAYERS,
    roundDurationSec: DEFAULT_ROUND_DURATION_SEC,
  },
  words: getDefaultWords(DEFAULT_WORD_COUNT),
  teacherClientId,
  seed: null,
  startAt: null,
  revision: 1,
  updatedAt: Date.now(),
  players: [],
});

type TeacherRoomClientProps = {
  roomCode: string;
};

export default function TeacherRoomClient({ roomCode }: TeacherRoomClientProps) {
  const router = useRouter();
  const [teacherSession, setTeacherSession] = useState<{
    ticket: string;
    clientId: string;
  } | null>(null);
  const teacherTicket = teacherSession?.ticket ?? "";
  const teacherClientId = teacherSession?.clientId ?? "";
  const hasTeacherCredentials = Boolean(teacherTicket && teacherClientId);
  const [roomState, setRoomState] = useState<RoomState>(() =>
    createInitialRoomState(roomCode, "")
  );
  const roomStateRef = useRef(roomState);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionToast, setConnectionToast] = useState<{
    tone: "info" | "success" | "warning";
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const credentialError =
    teacherSession === null
      ? null
      : hasTeacherCredentials
      ? null
      : "找不到老師憑證，請回入口頁重新建立房間。";

  const realtimeRef = useRef<Ably.Realtime | null>(null);
  const stateChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const eventsChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const roomStateTimerRef = useRef<number | null>(null);
  const roundAutoEndTimerRef = useRef<number | null>(null);
  const connectionToastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    const ticket = sessionStorage.getItem(getTeacherTicketKey(roomCode)) || "";
    const clientId = sessionStorage.getItem(getTeacherClientIdKey(roomCode)) || "";
    queueMicrotask(() => {
      setTeacherSession({ ticket, clientId });
    });
  }, [roomCode]);

  useEffect(() => {
    return () => {
      if (connectionToastTimerRef.current !== null) {
        window.clearTimeout(connectionToastTimerRef.current);
      }
      if (roundAutoEndTimerRef.current !== null) {
        window.clearTimeout(roundAutoEndTimerRef.current);
        roundAutoEndTimerRef.current = null;
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

  const publishStateEvent = useCallback(
    async (name: "ROOM_STATE" | "GAME_START" | "GAME_END", data: RoomStateEvent | GameStartEvent | { type: "GAME_END"; payload: { endedAt: number } }) => {
      const channel = stateChannelRef.current;
      if (!channel) return;
      await channel.publish(name, data);
    },
    []
  );

  const queueRoomStateBroadcast = useCallback(
    (next: RoomState, immediate: boolean = false) => {
      const publishSnapshot = () => {
        void publishStateEvent("ROOM_STATE", {
          type: "ROOM_STATE",
          payload: roomStateRef.current,
        });
      };

      if (immediate) {
        if (roomStateTimerRef.current !== null) {
          window.clearTimeout(roomStateTimerRef.current);
          roomStateTimerRef.current = null;
        }
        roomStateRef.current = next;
        publishSnapshot();
        return;
      }

      roomStateRef.current = next;
      if (roomStateTimerRef.current !== null) return;
      roomStateTimerRef.current = window.setTimeout(() => {
        roomStateTimerRef.current = null;
        publishSnapshot();
      }, ROOM_STATE_THROTTLE_MS);
    },
    [publishStateEvent]
  );

  const applyRoomUpdate = useCallback(
    (
      updater: (previous: RoomState) => RoomState,
      options?: {
        immediate?: boolean;
        broadcast?: boolean;
      }
    ) => {
      setRoomState((previous) => {
        const candidate = updater(previous);
        const next: RoomState = {
          ...candidate,
          teacherClientId: candidate.teacherClientId || teacherClientId,
          revision: previous.revision + 1,
          updatedAt: Date.now(),
        };
        roomStateRef.current = next;
        if (options?.broadcast !== false) {
          queueRoomStateBroadcast(next, options?.immediate);
        }
        return next;
      });
    },
    [queueRoomStateBroadcast, teacherClientId]
  );

  const clearRoundAutoEndTimer = useCallback(() => {
    if (roundAutoEndTimerRef.current !== null) {
      window.clearTimeout(roundAutoEndTimerRef.current);
      roundAutoEndTimerRef.current = null;
    }
  }, []);

  const endGame = useCallback(async () => {
    clearRoundAutoEndTimer();
    let endedAt = Date.now();
    applyRoomUpdate(
      (previous) => {
        if (previous.status !== "running") return previous;
        endedAt = Date.now();
        return {
          ...previous,
          status: "finished",
        };
      },
      { immediate: true }
    );
    await publishStateEvent("GAME_END", { type: "GAME_END", payload: { endedAt } });
  }, [applyRoomUpdate, clearRoundAutoEndTimer, publishStateEvent]);

  useEffect(() => {
    if (!hasTeacherCredentials || error) return;

    const realtime = createTypingRealtimeClient({
      role: "teacher",
      roomCode,
      clientId: teacherClientId,
      teacherTicket,
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

    const stateChannel = realtime.channels.get(getStateChannelName(roomCode));
    const eventsChannel = realtime.channels.get(getEventsChannelName(roomCode));
    stateChannelRef.current = stateChannel;
    eventsChannelRef.current = eventsChannel;

    const attachAndSubscribe = async () => {
      try {
        await Promise.all([stateChannel.attach(), eventsChannel.attach()]);

        queueRoomStateBroadcast(roomStateRef.current, true);

        await eventsChannel.subscribe("JOIN_REQUEST", (message) => {
          const event = message.data as EventsChannelEvent;
          if (event?.type !== "JOIN_REQUEST") return;
          const payload = event.payload;
          if (!payload?.playerId || !payload.name) return;

          applyRoomUpdate(
            (previous) => {
              if (previous.status === "running") return previous;
              if (previous.players.length >= previous.settings.maxPlayers) return previous;

              const existing = previous.players.find((player) => player.id === payload.playerId);
              if (existing) {
                return {
                  ...previous,
                  players: previous.players.map((player) =>
                    player.id === payload.playerId
                      ? {
                          ...player,
                          name: payload.name.trim().slice(0, 20),
                          lastSeenAt: Date.now(),
                        }
                      : player
                  ),
                };
              }

              const newPlayer: Player = {
                id: payload.playerId,
                name: payload.name.trim().slice(0, 20),
                score: 0,
                joinedAt: Date.now(),
                lastSeenAt: Date.now(),
                isGameOver: false,
              };

              return {
                ...previous,
                status: "lobby",
                players: [...previous.players, newPlayer],
              };
            },
            { immediate: true }
          );
        });

        await eventsChannel.subscribe("SCORE_REPORT", (message) => {
          const event = message.data as EventsChannelEvent;
          if (event?.type !== "SCORE_REPORT") return;
          const payload = event.payload;
          if (!payload?.playerId) return;

          applyRoomUpdate((previous) => {
            if (previous.status !== "running") return previous;
            return {
              ...previous,
              players: previous.players.map((player) =>
                player.id === payload.playerId
                  ? {
                      ...player,
                      score: Math.max(player.score, payload.score),
                      lastSeenAt: Date.now(),
                    }
                  : player
              ),
            };
          });
        });

        await eventsChannel.subscribe("PLAYER_GAME_OVER", (message) => {
          const event = message.data as EventsChannelEvent;
          if (event?.type !== "PLAYER_GAME_OVER") return;
          const payload = event.payload;
          if (!payload?.playerId) return;

          let shouldEnd = false;
          applyRoomUpdate(
            (previous) => {
              if (previous.status !== "running") return previous;
              const nextPlayers = previous.players.map((player) =>
                player.id === payload.playerId
                  ? { ...player, isGameOver: true, lastSeenAt: Date.now() }
                  : player
              );
              shouldEnd =
                nextPlayers.length > 0 &&
                nextPlayers.every((player) => player.isGameOver === true);

              return {
                ...previous,
                players: nextPlayers,
              };
            },
            { immediate: true }
          );

          if (shouldEnd) {
            void endGame();
          }
        });

        await eventsChannel.subscribe("LEAVE_NOTICE", (message) => {
          const event = message.data as EventsChannelEvent;
          if (event?.type !== "LEAVE_NOTICE") return;
          const payload = event.payload;
          if (!payload?.playerId) return;

          applyRoomUpdate((previous) => ({
            ...previous,
            players: previous.players.map((player) =>
              player.id === payload.playerId
                ? { ...player, isGameOver: true, lastSeenAt: Date.now() }
                : player
            ),
          }));
        });
      } catch (attachError) {
        console.error(attachError);
        setError("連線初始化失敗，請稍後再試。");
      }
    };

    void attachAndSubscribe();

    return () => {
      if (roomStateTimerRef.current !== null) {
        window.clearTimeout(roomStateTimerRef.current);
        roomStateTimerRef.current = null;
      }
      clearRoundAutoEndTimer();
      stateChannel.unsubscribe();
      eventsChannel.unsubscribe();
      realtime.connection.off(handleConnection);
      try {
        if (
          realtime.connection.state !== "closed" &&
          realtime.connection.state !== "closing"
        ) {
          realtime.close();
        }
      } catch (closeError) {
        if (
          !(closeError instanceof Error) ||
          !closeError.message.includes("Connection closed")
        ) {
          console.warn("Unexpected realtime close error", closeError);
        }
      }
      realtimeRef.current = null;
      stateChannelRef.current = null;
      eventsChannelRef.current = null;
    };
  }, [
    applyRoomUpdate,
    clearRoundAutoEndTimer,
    endGame,
    error,
    hasTeacherCredentials,
    queueRoomStateBroadcast,
    roomCode,
    showConnectionToast,
    teacherClientId,
    teacherTicket,
  ]);

  const onSettingsChange = (next: RoomState["settings"]) => {
    applyRoomUpdate((previous) => {
      if (previous.status === "running") return previous;
      const nextCount = Math.max(5, Math.min(60, next.wordCount));
      const nextDurationSec = normalizeRoundDurationSec(next.roundDurationSec);
      const paddedWords = Array.from({ length: nextCount }, (_, index) =>
        previous.words[index] ?? ""
      );
      return {
        ...previous,
        settings: {
          ...previous.settings,
          ...next,
          wordCount: nextCount,
          roundDurationSec: nextDurationSec,
        },
        words: paddedWords,
      };
    });
  };

  const onWordChange = (index: number, value: string) => {
    applyRoomUpdate((previous) => {
      if (previous.status === "running") return previous;
      const words = [...previous.words];
      words[index] = value;
      return { ...previous, words };
    });
  };

  const startGame = async () => {
    if (roomState.status === "running") return;

    const validWords = roomState.words
      .map((word) => word.trim())
      .filter((word) => word.length > 0)
      .slice(0, roomState.settings.wordCount);
    if (validWords.length === 0) {
      alert("請至少填入一個生詞。");
      return;
    }
    if (roomState.players.length === 0) {
      alert("至少需要一位學生加入。");
      return;
    }

    const seed = crypto.randomUUID();
    const startAt = Date.now() + 3000;
    const roundDurationSec = normalizeRoundDurationSec(roomState.settings.roundDurationSec);
    const nextSettings = {
      ...roomState.settings,
      wordCount: validWords.length,
      roundDurationSec,
    };

    applyRoomUpdate(
      (previous) => ({
        ...previous,
        status: "running",
        seed,
        startAt,
        settings: nextSettings,
        words: validWords,
        players: previous.players.map((player) => ({
          ...player,
          score: 0,
          isGameOver: false,
          lastSeenAt: Date.now(),
        })),
      }),
      { immediate: true }
    );

    await publishStateEvent("GAME_START", {
      type: "GAME_START",
      payload: {
        seed,
        startAt,
        settings: nextSettings,
        words: validWords,
      },
    });

    clearRoundAutoEndTimer();
    const roundEndAt = startAt + roundDurationSec * 1000;
    const autoEndDelay = Math.max(0, roundEndAt - Date.now());
    roundAutoEndTimerRef.current = window.setTimeout(() => {
      void endGame();
    }, autoEndDelay);
  };

  const appUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    return typeof window === "undefined" ? "" : window.location.origin;
  }, []);

  if (teacherSession === null) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 text-gray-600">
          正在讀取老師憑證...
        </div>
      </main>
    );
  }

  if (error || credentialError) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white border border-red-200 rounded-xl p-6 space-y-4">
          <h1 className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={18} />
            無法進入老師控制台
          </h1>
          <p className="text-gray-700">{error || credentialError}</p>
          <div className="flex gap-3">
            <Link href="/games/typing" className="px-4 py-2 rounded-md bg-indigo-600 text-white">
              返回遊戲入口
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700"
            >
              重新整理
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">老師控制台</h1>
            <p className="text-sm text-gray-500">房間 {roomCode}</p>
          </div>
          <ConnectionBadge state={connectionState} />
        </header>

        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-5">
            <TeacherSetupPanel
              roomCode={roomCode}
              status={roomState.status}
              settings={roomState.settings}
              playerCount={roomState.players.length}
              appUrl={appUrl}
              onSettingsChange={onSettingsChange}
              onStartGame={startGame}
              onEndGame={endGame}
            />

            <WordGridEditor
              words={roomState.words}
              disabled={roomState.status === "running"}
              onChange={onWordChange}
            />
          </div>

          <div className="lg:col-span-5 space-y-5">
            <Lobby status={roomState.status} players={roomState.players} />
            <Scoreboard players={roomState.players} limit={10} title="即時排行榜" />

            <section className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
              <p className="flex items-center gap-2 font-medium text-gray-800">
                <Users size={16} />
                房間規則
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>遊戲進行中禁止新玩家加入。</li>
                <li>老師刷新或離開頁面，房間將中斷。</li>
                <li>同分時依加入時間排序。</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <ConnectionToast
        message={connectionToast?.message ?? null}
        tone={connectionToast?.tone ?? "info"}
      />
    </main>
  );
}
