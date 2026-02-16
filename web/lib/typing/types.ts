export type TypingRole = "teacher" | "student";

export type SpeedLevel = 1 | 2 | 3 | 4 | 5;

export type RoomStatus = "setup" | "lobby" | "running" | "finished";

export type RoomSettings = {
  wordCount: number;
  speedLevel: SpeedLevel;
  maxPlayers: number;
};

export type Player = {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
  lastSeenAt: number;
  isGameOver: boolean;
};

export type RoomState = {
  roomCode: string;
  status: RoomStatus;
  settings: RoomSettings;
  words: string[];
  teacherClientId: string;
  seed: string | null;
  startAt: number | null;
  revision: number;
  updatedAt: number;
  players: Player[];
};

export type FallingBlock = {
  id: string;
  word: string;
  lane: number;
  y: number;
  vy: number;
  isSettled: boolean;
  createdAt: number;
};

export type SpeedPreset = {
  spawnIntervalMs: number;
  fallSpeedPxPerSec: number;
};

export type RoomStateEvent = {
  type: "ROOM_STATE";
  payload: RoomState;
};

export type GameStartPayload = {
  seed: string;
  startAt: number;
  settings: RoomSettings;
  words: string[];
};

export type GameStartEvent = {
  type: "GAME_START";
  payload: GameStartPayload;
};

export type GameEndEvent = {
  type: "GAME_END";
  payload: {
    endedAt: number;
  };
};

export type JoinRequestEvent = {
  type: "JOIN_REQUEST";
  payload: {
    playerId: string;
    name: string;
  };
};

export type ScoreReportEvent = {
  type: "SCORE_REPORT";
  payload: {
    playerId: string;
    score: number;
  };
};

export type PlayerGameOverEvent = {
  type: "PLAYER_GAME_OVER";
  payload: {
    playerId: string;
  };
};

export type LeaveNoticeEvent = {
  type: "LEAVE_NOTICE";
  payload: {
    playerId: string;
  };
};

export type StateChannelEvent = RoomStateEvent | GameStartEvent | GameEndEvent;

export type EventsChannelEvent =
  | JoinRequestEvent
  | ScoreReportEvent
  | PlayerGameOverEvent
  | LeaveNoticeEvent;

export type RoomEvent = StateChannelEvent | EventsChannelEvent;

export type CreateRoomResponse = {
  roomCode: string;
  teacherTicket: string;
  teacherClientId: string;
};

export type TokenRequestBody = {
  roomCode: string;
  role: TypingRole;
  clientId: string;
  teacherTicket?: string;
};

export type TokenRequestResponse = {
  tokenRequest: unknown;
};

