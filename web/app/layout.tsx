import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/lib/contexts/AppStateContext";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "中文小遊戲樂園",
  description: "用抽題方式玩中文挑戰，支援多題庫管理與即時統計。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <AppStateProvider>
          <Navigation />
          {children}
        </AppStateProvider>
      </body>
    </html>
  );
}
