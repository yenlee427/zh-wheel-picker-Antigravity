import StudentRoomClient from "@/components/typing/StudentRoomClient";

export default async function TypingStudentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <StudentRoomClient roomCode={code} />;
}
