import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "多輪盤總覽 | 繁中輪盤抽選器",
    description: "同時檢視與操作多個輪盤",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="py-6">{children}</div>;
}
