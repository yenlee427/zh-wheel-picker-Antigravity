import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "題庫總覽 | 中文小遊戲樂園",
    description: "同時檢視與操作多個中文題庫",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="py-6">{children}</div>;
}
