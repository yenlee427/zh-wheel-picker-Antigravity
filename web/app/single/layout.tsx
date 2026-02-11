import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "單輪盤管理 | 繁中輪盤抽選器",
    description: "新增、編輯與抽選您的輪盤清單",
};

export default function SingleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="py-6">{children}</div>;
}
