import * as Ably from "ably";
import { NextRequest, NextResponse } from "next/server";
import { verifyTeacherTicket } from "@/lib/typing/auth";
import { getEventsChannelName, getStateChannelName } from "@/lib/typing/constants";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/typing/roomCode";
import { TokenRequestBody } from "@/lib/typing/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 1000 * 60 * 60;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ABLY_API_KEY;
  const secret = process.env.ROOM_SIGNING_SECRET;
  if (!apiKey || !secret) {
    return NextResponse.json(
      { error: "Missing ABLY_API_KEY or ROOM_SIGNING_SECRET." },
      { status: 500 }
    );
  }

  let body: TokenRequestBody;
  try {
    body = (await request.json()) as TokenRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const roomCode = normalizeRoomCode(body.roomCode || "");
  const role = body.role;
  const clientId = (body.clientId || "").trim();

  if (!isValidRoomCode(roomCode)) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }
  if (role !== "teacher" && role !== "student") {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }
  if (!clientId || clientId.length > 64) {
    return NextResponse.json({ error: "Invalid clientId." }, { status: 400 });
  }

  if (role === "teacher") {
    const ticket = body.teacherTicket || "";
    const verification = verifyTeacherTicket({
      ticket,
      roomCode,
      teacherClientId: clientId,
      secret,
    });
    if (!verification.ok) {
      return NextResponse.json(
        { error: `Teacher ticket rejected: ${verification.reason}` },
        { status: 401 }
      );
    }
  }

  const stateChannel = getStateChannelName(roomCode);
  const eventsChannel = getEventsChannelName(roomCode);
  const capability =
    role === "teacher"
      ? {
          [stateChannel]: ["publish", "subscribe"],
          [eventsChannel]: ["publish", "subscribe"],
        }
      : {
          [stateChannel]: ["subscribe"],
          [eventsChannel]: ["publish"],
        };

  try {
    const rest = new Ably.Rest(apiKey);
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId,
      ttl: TOKEN_TTL_MS,
      capability: JSON.stringify(capability),
    });

    return NextResponse.json({ tokenRequest });
  } catch (error) {
    console.error("Failed to create Ably token request", error);
    return NextResponse.json(
      { error: "Unable to create token request." },
      { status: 500 }
    );
  }
}

