import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "統計數據 | 繁中輪盤抽選器",
    description: "查看還盤的歷史統計記錄",
};

export default function StatsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <section className="py-8">{children}</section>;
}
