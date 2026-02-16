import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "./constants";

export const generateRoomCode = (length: number = ROOM_CODE_LENGTH): string => {
  let result = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    result += ROOM_CODE_ALPHABET[index];
  }
  return result;
};

export const normalizeRoomCode = (value: string): string => {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
};

export const isValidRoomCode = (value: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(value);
};

