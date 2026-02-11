import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/lib/contexts/AppStateContext";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "繁中輪盤抽選器",
  description: "簡單好用的線上抽籤工具",
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
