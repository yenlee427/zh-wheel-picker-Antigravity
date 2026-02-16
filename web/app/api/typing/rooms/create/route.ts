import { NextResponse } from "next/server";
import { createTeacherTicket } from "@/lib/typing/auth";
import { generateRoomCode } from "@/lib/typing/roomCode";
import { CreateRoomResponse } from "@/lib/typing/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const secret = process.env.ROOM_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing ROOM_SIGNING_SECRET environment variable." },
      { status: 500 }
    );
  }

  const roomCode = generateRoomCode();
  const teacherClientId = `teacher-${roomCode}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const teacherTicket = createTeacherTicket({
    roomCode,
    teacherClientId,
    secret,
  });

  const payload: CreateRoomResponse = {
    roomCode,
    teacherTicket,
    teacherClientId,
  };

  return NextResponse.json(payload);
}

