import TeacherRoomClient from "@/components/typing/TeacherRoomClient";

export default async function TypingTeacherPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <TeacherRoomClient roomCode={code} />;
}
