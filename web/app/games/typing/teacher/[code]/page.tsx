import TeacherRoomClient from "@/components/typing/TeacherRoomClient";

export default function TypingTeacherPage({
  params,
}: {
  params: { code: string };
}) {
  return <TeacherRoomClient roomCode={params.code} />;
}

