import { SpeedLevel, SpeedPreset } from "./types";

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const DEFAULT_WORD_COUNT = 20;
export const DEFAULT_MAX_PLAYERS = 50;

export const SCORE_PER_HIT = 10;
export const BLOCK_HEIGHT_PX = 48;
export const MAX_BLOCKS = 200;
export const ROOM_STATE_THROTTLE_MS = 250;

export const TEACHER_TICKET_TTL_MS = 1000 * 60 * 60 * 12;

export const DEFAULT_WORDS: string[] = [
  "蘋果",
  "香蕉",
  "老師",
  "學生",
  "閱讀",
  "寫字",
  "快樂",
  "學習",
  "電腦",
  "網路",
  "漢字",
  "詞語",
  "句子",
  "段落",
  "語法",
  "課本",
  "考試",
  "練習",
  "專心",
  "努力",
];

export const SPEED_PRESETS: Record<SpeedLevel, SpeedPreset> = {
  1: { spawnIntervalMs: 1600, fallSpeedPxPerSec: 80 },
  2: { spawnIntervalMs: 1300, fallSpeedPxPerSec: 105 },
  3: { spawnIntervalMs: 1000, fallSpeedPxPerSec: 130 },
  4: { spawnIntervalMs: 780, fallSpeedPxPerSec: 160 },
  5: { spawnIntervalMs: 620, fallSpeedPxPerSec: 190 },
};

export const STORAGE_KEYS = {
  DISPLAY_NAME: "typingGame:displayName",
};

export const getTeacherTicketKey = (roomCode: string) =>
  `typingGame:teacherTicket:${roomCode}`;

export const getTeacherClientIdKey = (roomCode: string) =>
  `typingGame:teacherClientId:${roomCode}`;

export const getPlayerIdKey = (roomCode: string) => `typingGame:playerId:${roomCode}`;

export const getStateChannelName = (roomCode: string) =>
  `typing-room:${roomCode}:state`;

export const getEventsChannelName = (roomCode: string) =>
  `typing-room:${roomCode}:events`;

