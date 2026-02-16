import { BLOCK_HEIGHT_PX, MAX_BLOCKS, SCORE_PER_HIT, SPEED_PRESETS } from "./constants";
import { randomInt, createSeededRandom } from "./rng";
import { FallingBlock, SpeedLevel } from "./types";

export type GameEngineSnapshot = {
  blocks: FallingBlock[];
  score: number;
  isGameOver: boolean;
  lanes: number;
  width: number;
  height: number;
};

export type SubmitInputResult = {
  hit: boolean;
  score: number;
  removedBlockId?: string;
};

type TypingGameEngineOptions = {
  words: string[];
  speedLevel: SpeedLevel;
  seed: string;
  width: number;
  height: number;
  lanes: number;
  startAt: number;
  maxBlocks?: number;
};

const normalizeInput = (value: string): string => value.trim();

export class TypingGameEngine {
  private readonly words: string[];
  private readonly speedLevel: SpeedLevel;
  private readonly random: () => number;
  private readonly startAt: number;
  private readonly maxBlocks: number;
  private readonly lanes: number;
  private laneSettledCounts: number[];
  private width: number;
  private height: number;
  private blocks: FallingBlock[];
  private score: number;
  private isGameOver: boolean;
  private nextSpawnAtMs: number;
  private lastTickAt: number | null;
  private nextBlockId: number;

  constructor({
    words,
    speedLevel,
    seed,
    width,
    height,
    lanes,
    startAt,
    maxBlocks = MAX_BLOCKS,
  }: TypingGameEngineOptions) {
    this.words = words.filter((word) => word.trim().length > 0);
    this.speedLevel = speedLevel;
    this.random = createSeededRandom(seed);
    this.startAt = startAt;
    this.maxBlocks = maxBlocks;
    this.lanes = Math.max(2, lanes);
    this.laneSettledCounts = Array.from({ length: this.lanes }, () => 0);
    this.width = width;
    this.height = height;
    this.blocks = [];
    this.score = 0;
    this.isGameOver = false;
    this.nextSpawnAtMs = 0;
    this.lastTickAt = null;
    this.nextBlockId = 0;
  }

  setSize(width: number, height: number, lanes: number): void {
    this.width = width;
    this.height = height;
    if (lanes !== this.lanes) {
      // Lane count should remain stable during a round.
      return;
    }
  }

  getSnapshot(): GameEngineSnapshot {
    return {
      blocks: [...this.blocks],
      score: this.score,
      isGameOver: this.isGameOver,
      lanes: this.lanes,
      width: this.width,
      height: this.height,
    };
  }

  submitInput(rawValue: string): SubmitInputResult {
    if (this.isGameOver) return { hit: false, score: this.score };

    const normalized = normalizeInput(rawValue);
    if (!normalized) return { hit: false, score: this.score };

    const candidates = this.blocks.filter((block) => block.word === normalized);
    if (candidates.length === 0) return { hit: false, score: this.score };

    const target = candidates.reduce((closest, current) =>
      current.y > closest.y ? current : closest
    );

    this.removeBlock(target.id);
    this.score += SCORE_PER_HIT;

    return { hit: true, score: this.score, removedBlockId: target.id };
  }

  update(nowMs: number): boolean {
    if (this.isGameOver || this.words.length === 0) return false;
    if (nowMs < this.startAt) return false;

    if (this.lastTickAt === null) {
      this.lastTickAt = nowMs;
      return false;
    }

    const deltaMs = Math.max(0, nowMs - this.lastTickAt);
    this.lastTickAt = nowMs;
    const deltaSec = deltaMs / 1000;
    const preset = SPEED_PRESETS[this.speedLevel];

    let changed = false;

    for (const block of this.blocks) {
      if (block.isSettled) continue;
      block.y += block.vy * deltaSec;
      const settleY = this.height - BLOCK_HEIGHT_PX * (this.laneSettledCounts[block.lane] + 1);
      if (block.y >= settleY) {
        block.y = settleY;
        block.isSettled = true;
        this.laneSettledCounts[block.lane] += 1;
        changed = true;
        if (settleY < 0) {
          this.isGameOver = true;
          break;
        }
      } else {
        changed = true;
      }
    }

    if (this.blocks.length >= this.maxBlocks) {
      this.isGameOver = true;
      return true;
    }

    const elapsedMs = nowMs - this.startAt;
    while (elapsedMs >= this.nextSpawnAtMs && !this.isGameOver) {
      const spawned = this.spawnOne(preset.fallSpeedPxPerSec, nowMs);
      this.nextSpawnAtMs += preset.spawnIntervalMs;
      changed = changed || spawned;
    }

    return changed;
  }

  private spawnOne(vy: number, nowMs: number): boolean {
    if (this.words.length === 0) return false;
    if (this.blocks.length >= this.maxBlocks) return false;

    const activeLaneSet = new Set(
      this.blocks.filter((block) => !block.isSettled).map((block) => block.lane)
    );
    const availableLanes = Array.from({ length: this.lanes }, (_, lane) => lane).filter(
      (lane) => !activeLaneSet.has(lane)
    );
    if (availableLanes.length === 0) return false;

    const wordIndex = randomInt(this.random, this.words.length);
    const laneIndex = randomInt(this.random, availableLanes.length);
    const lane = availableLanes[laneIndex];

    this.blocks.push({
      id: `block-${this.nextBlockId++}`,
      word: this.words[wordIndex],
      lane,
      y: -BLOCK_HEIGHT_PX,
      vy,
      isSettled: false,
      createdAt: nowMs,
    });
    return true;
  }

  private removeBlock(blockId: string): void {
    const target = this.blocks.find((block) => block.id === blockId);
    if (!target) return;

    this.blocks = this.blocks.filter((block) => block.id !== blockId);
    if (!target.isSettled) return;

    this.laneSettledCounts[target.lane] = Math.max(0, this.laneSettledCounts[target.lane] - 1);

    // Pull all settled blocks above the removed one downward.
    for (const block of this.blocks) {
      if (block.lane !== target.lane || !block.isSettled) continue;
      if (block.y < target.y) {
        block.y += BLOCK_HEIGHT_PX;
      }
    }
  }
}

export const getLaneCount = (width: number): number => {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  return 4;
};

