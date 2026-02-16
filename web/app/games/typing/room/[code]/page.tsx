import StudentRoomClient from "@/components/typing/StudentRoomClient";

export default function TypingStudentPage({
  params,
}: {
  params: { code: string };
}) {
  return <StudentRoomClient roomCode={params.code} />;
}

