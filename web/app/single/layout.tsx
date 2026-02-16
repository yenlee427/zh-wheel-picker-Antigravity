import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "單人模式 | 中文小遊戲樂園",
    description: "新增、編輯與抽題您的中文題庫",
};

export default function SingleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="py-6">{children}</div>;
}
