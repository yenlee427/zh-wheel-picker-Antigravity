import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "挑戰統計 | 中文小遊戲樂園",
    description: "查看中文小遊戲的抽題統計記錄",
};

export default function StatsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section className="py-8">{children}</section>;
}
