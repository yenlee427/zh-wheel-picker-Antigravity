import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { TEACHER_TICKET_TTL_MS } from "./constants";

type TeacherTicketPayload = {
  roomCode: string;
  teacherClientId: string;
  issuedAt: number;
  nonce: string;
  version: 1;
};

type VerifyTeacherTicketResult =
  | {
      ok: true;
      payload: TeacherTicketPayload;
    }
  | {
      ok: false;
      reason: string;
    };

const toBase64Url = (value: string): string => {
  return Buffer.from(value, "utf8").toString("base64url");
};

const fromBase64Url = (value: string): string => {
  return Buffer.from(value, "base64url").toString("utf8");
};

const signPayload = (payload: string, secret: string): string => {
  return createHmac("sha256", secret).update(payload).digest("base64url");
};

export const createTeacherTicket = ({
  roomCode,
  teacherClientId,
  secret,
}: {
  roomCode: string;
  teacherClientId: string;
  secret: string;
}): string => {
  const payload: TeacherTicketPayload = {
    roomCode,
    teacherClientId,
    issuedAt: Date.now(),
    nonce: randomUUID(),
    version: 1,
  };

  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signaturePart = signPayload(payloadPart, secret);
  return `${payloadPart}.${signaturePart}`;
};

export const verifyTeacherTicket = ({
  ticket,
  roomCode,
  teacherClientId,
  secret,
  maxAgeMs = TEACHER_TICKET_TTL_MS,
}: {
  ticket: string;
  roomCode: string;
  teacherClientId: string;
  secret: string;
  maxAgeMs?: number;
}): VerifyTeacherTicketResult => {
  const [payloadPart, signaturePart] = ticket.split(".");
  if (!payloadPart || !signaturePart) {
    return { ok: false, reason: "Malformed ticket" };
  }

  const expectedSignature = signPayload(payloadPart, secret);
  const sigA = Buffer.from(signaturePart, "utf8");
  const sigB = Buffer.from(expectedSignature, "utf8");
  if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
    return { ok: false, reason: "Invalid ticket signature" };
  }

  let payload: TeacherTicketPayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadPart)) as TeacherTicketPayload;
  } catch {
    return { ok: false, reason: "Invalid ticket payload" };
  }

  if (payload.version !== 1) {
    return { ok: false, reason: "Unsupported ticket version" };
  }
  if (payload.roomCode !== roomCode) {
    return { ok: false, reason: "Ticket room mismatch" };
  }
  if (payload.teacherClientId !== teacherClientId) {
    return { ok: false, reason: "Ticket client mismatch" };
  }
  if (Date.now() - payload.issuedAt > maxAgeMs) {
    return { ok: false, reason: "Ticket expired" };
  }

  return { ok: true, payload };
};
