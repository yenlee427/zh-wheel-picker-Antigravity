import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "中文輸入法遊戲 | 中文小遊戲樂園",
  description: "Typing Blocks 多人即時中文輸入挑戰。",
};

export default function TypingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
