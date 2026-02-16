"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BLOCK_HEIGHT_PX,
  SCORE_PER_HIT,
  SPEED_PRESETS,
} from "@/lib/typing/constants";
import {
  GameEngineSnapshot,
  getLaneCount,
  TypingGameEngine,
} from "@/lib/typing/gameEngine";
import { SpeedLevel } from "@/lib/typing/types";

type GameBoardProps = {
  words: string[];
  speedLevel: SpeedLevel;
  seed: string;
  startAt: number;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
  className?: string;
};

type HitEffect = {
  id: string;
  word: string;
  x: number;
  y: number;
  width: number;
};

const BOARD_MIN_HEIGHT = 420;
const BOARD_MAX_HEIGHT = 680;

export default function GameBoard({
  words,
  speedLevel,
  seed,
  startAt,
  onScoreChange,
  onGameOver,
  className = "",
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const engineRef = useRef<TypingGameEngine | null>(null);
  const emittedGameOverRef = useRef(false);
  const onScoreChangeRef = useRef(onScoreChange);
  const onGameOverRef = useRef(onGameOver);
  const [snapshot, setSnapshot] = useState<GameEngineSnapshot | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [countdownNow, setCountdownNow] = useState(startAt);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const effectTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdownNow(Date.now()), 150);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      for (const timerId of effectTimersRef.current) {
        window.clearTimeout(timerId);
      }
      effectTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    onScoreChangeRef.current = onScoreChange;
  }, [onScoreChange]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    for (const timerId of effectTimersRef.current) {
      window.clearTimeout(timerId);
    }
    effectTimersRef.current = [];
    setHitEffects([]);

    const width = Math.max(280, board.clientWidth);
    const height = Math.max(
      BOARD_MIN_HEIGHT,
      Math.min(BOARD_MAX_HEIGHT, board.clientHeight || BOARD_MIN_HEIGHT)
    );
    const lanes = getLaneCount(width);

    const engine = new TypingGameEngine({
      words,
      speedLevel,
      seed,
      width,
      height,
      lanes,
      startAt,
    });
    engineRef.current = engine;
    emittedGameOverRef.current = false;
    setSnapshot(engine.getSnapshot());
    setInputValue("");

    const loop = () => {
      const activeEngine = engineRef.current;
      if (!activeEngine) return;

      const changed = activeEngine.update(Date.now());
      if (changed) {
        const next = activeEngine.getSnapshot();
        setSnapshot(next);
        if (next.isGameOver && !emittedGameOverRef.current) {
          emittedGameOverRef.current = true;
          onGameOverRef.current?.();
        }
      } else {
        const next = activeEngine.getSnapshot();
        if (next.isGameOver && !emittedGameOverRef.current) {
          emittedGameOverRef.current = true;
          onGameOverRef.current?.();
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = Math.max(280, board.clientWidth);
      const nextHeight = Math.max(
        BOARD_MIN_HEIGHT,
        Math.min(BOARD_MAX_HEIGHT, board.clientHeight || BOARD_MIN_HEIGHT)
      );
      engine.setSize(nextWidth, nextHeight, getLaneCount(nextWidth));
      setSnapshot(engine.getSnapshot());
    });
    resizeObserver.observe(board);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      engineRef.current = null;
    };
  }, [words, speedLevel, seed, startAt]);

  const handleSubmit = () => {
    const engine = engineRef.current;
    if (!engine || !snapshot || snapshot.isGameOver) return;

    const result = engine.submitInput(inputValue);
    if (result.hit) {
      setInputValue("");
      if (result.removedBlockId && snapshot) {
        const removed = snapshot.blocks.find((block) => block.id === result.removedBlockId);
        if (removed) {
          const effectWidth = Math.max(54, laneWidth - 8);
          const effectX = removed.lane * laneWidth + 4;
          const effectId = `${removed.id}-${Date.now()}`;
          setHitEffects((prev) => [
            ...prev,
            {
              id: effectId,
              word: removed.word,
              x: effectX,
              y: removed.y,
              width: effectWidth,
            },
          ]);
          const timerId = window.setTimeout(() => {
            setHitEffects((prev) => prev.filter((effect) => effect.id !== effectId));
            effectTimersRef.current = effectTimersRef.current.filter((id) => id !== timerId);
          }, 560);
          effectTimersRef.current.push(timerId);
        }
      }
      const next = engine.getSnapshot();
      setSnapshot(next);
      onScoreChangeRef.current?.(result.score);
    }
  };

  const laneWidth = useMemo(() => {
    if (!snapshot) return 0;
    return snapshot.width / snapshot.lanes;
  }, [snapshot]);

  const countdownMs = Math.max(0, startAt - countdownNow);
  const countdownLabel =
    countdownMs > 0 ? `${(countdownMs / 1000).toFixed(1)} 秒後開始` : "遊戲進行中";

  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">得分規則</p>
          <p className="font-semibold text-gray-800">命中 +{SCORE_PER_HIT}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">速度 L{speedLevel}</p>
          <p className="font-semibold text-indigo-700">{countdownLabel}</p>
        </div>
      </div>

      <div
        ref={boardRef}
        className="relative w-full h-[62vh] min-h-[420px] max-h-[680px] bg-gradient-to-b from-slate-50 to-indigo-50"
      >
        {snapshot &&
          Array.from({ length: snapshot.lanes }, (_, lane) => (
            <div
              key={lane}
              className="absolute top-0 bottom-0 border-r border-indigo-100/60"
              style={{
                left: `${(lane / snapshot.lanes) * 100}%`,
                width: `${100 / snapshot.lanes}%`,
              }}
            />
          ))}

        {snapshot?.blocks.map((block) => {
          const x = block.lane * laneWidth + 4;
          const blockWidth = Math.max(54, laneWidth - 8);
          return (
            <div
              key={block.id}
              className={`absolute flex items-center justify-center rounded-md px-1.5 py-0.5 text-center text-xs font-semibold text-indigo-900 border ${
                block.isSettled
                  ? "bg-indigo-200/90 border-indigo-300"
                  : "bg-white/95 border-indigo-200 shadow-sm"
              }`}
              style={{
                width: `${blockWidth}px`,
                height: `${BLOCK_HEIGHT_PX}px`,
                transform: `translate3d(${x}px, ${block.y}px, 0)`,
              }}
            >
              <span className="block max-w-full truncate leading-4">{block.word}</span>
            </div>
          );
        })}

        {hitEffects.map((effect) => (
          <div
            key={effect.id}
            className="absolute pointer-events-none"
            style={{
              width: `${effect.width}px`,
              height: `${BLOCK_HEIGHT_PX}px`,
              transform: `translate3d(${effect.x}px, ${effect.y}px, 0)`,
            }}
          >
            <div className="relative h-full w-full overflow-visible">
              <div
                className="absolute inset-0 rounded-md border-2 border-amber-300/95 bg-amber-100/75"
                style={{ animation: "typing-hit-pop 560ms cubic-bezier(0.2, 1, 0.3, 1) forwards" }}
              />
              <div
                className="absolute inset-0 rounded-md bg-amber-300/80"
                style={{ animation: "typing-hit-flash 360ms ease-out forwards" }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-amber-900"
                style={{ animation: "typing-hit-word 420ms ease-out forwards" }}
              >
                {effect.word}
              </div>
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-amber-200/90 px-2 py-0.5 text-xs font-black text-amber-700 shadow-sm"
                style={{ animation: "typing-hit-score 560ms ease-out forwards" }}
              >
                +{SCORE_PER_HIT}
              </div>
            </div>
          </div>
        ))}

        {snapshot?.isGameOver && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <div className="rounded-lg bg-white px-6 py-4 text-center shadow-lg">
              <p className="text-sm text-gray-500">遊戲結束</p>
              <p className="text-lg font-bold text-gray-900 mt-1">方塊已堆滿畫面</p>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-3">
        <label htmlFor="typing-input" className="sr-only">
          輸入生詞
        </label>
        <div className="flex gap-2">
          <input
            id="typing-input"
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isComposing && !event.nativeEvent.isComposing) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            disabled={snapshot?.isGameOver || countdownMs > 0}
            placeholder={`輸入生詞後按 Enter（L${speedLevel}: ${
              SPEED_PRESETS[speedLevel].spawnIntervalMs
            }ms）`}
            className="flex-1 h-11 rounded-md border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={snapshot?.isGameOver || countdownMs > 0}
            className="h-11 px-4 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            送出
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes typing-hit-pop {
          0% {
            transform: scale(1);
            opacity: 0.95;
            filter: saturate(1);
          }
          45% {
            transform: scale(1.2);
            opacity: 0.92;
            filter: saturate(1.4);
          }
          100% {
            transform: scale(0.82);
            opacity: 0;
            filter: saturate(1);
          }
        }
        @keyframes typing-hit-flash {
          0% {
            opacity: 0.95;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes typing-hit-word {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.08);
          }
        }
        @keyframes typing-hit-score {
          0% {
            opacity: 0;
            transform: translate(-50%, 4px) scale(0.86);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, 0px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -28px) scale(1.06);
          }
        }
      `}</style>
    </section>
  );
}
