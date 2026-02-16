"use client";

import * as Ably from "ably";
import { TokenRequestBody, TypingRole } from "./types";

type CreateTypingRealtimeClientParams = {
  role: TypingRole;
  roomCode: string;
  clientId: string;
  teacherTicket?: string;
};

type AblyAuthPayload = string | Ably.TokenRequest | Ably.TokenDetails;

type TokenApiResponse = {
  tokenRequest: AblyAuthPayload;
  error?: string;
};

const fetchTokenRequest = async (
  body: TokenRequestBody
): Promise<AblyAuthPayload> => {
  const response = await fetch("/api/ably/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as TokenApiResponse;
  if (!response.ok || !data.tokenRequest) {
    throw new Error(data.error || "Token request failed");
  }
  return data.tokenRequest;
};

export const createTypingRealtimeClient = ({
  role,
  roomCode,
  clientId,
  teacherTicket,
}: CreateTypingRealtimeClientParams) => {
  const client = new Ably.Realtime({
    clientId,
    authCallback: async (_tokenParams, callback) => {
      try {
        const tokenRequest = await fetchTokenRequest({
          roomCode,
          role,
          clientId,
          teacherTicket,
        });
        callback(null, tokenRequest);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Token request failed";
        callback(message, null);
      }
    },
  });

  return client;
};
