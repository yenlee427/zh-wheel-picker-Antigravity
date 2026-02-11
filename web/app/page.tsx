import Link from "next/link";
import { Disc, LayoutGrid, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            繁中輪盤抽選器
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            簡單好用的線上抽籤工具，支援多組清單管理與同時抽選功能。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Single Wheel Card */}
          <Link
            href="/single"
            className="group relative flex flex-col items-start p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all duration-300"
          >
            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors mb-4">
              <Disc className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              單輪盤管理
            </h2>
            <p className="text-gray-500 mb-6 flex-grow">
              完整功能的輪盤編輯器。可以新增、編輯選項，查看詳細歷史記錄，並管理多組清單。
            </p>
            <div className="flex items-center text-indigo-600 font-medium group-hover:translate-x-1 transition-transform">
              開始使用 <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Dashboard Card */}
          <Link
            href="/dashboard"
            className="group relative flex flex-col items-start p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all duration-300"
          >
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors mb-4">
              <LayoutGrid className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              多輪盤總覽
            </h2>
            <p className="text-gray-500 mb-6 flex-grow">
              Dashboard 模式。同時顯示並操作多個不重複的輪盤，適合需要多工處理的場景。
            </p>
            <div className="flex items-center text-emerald-600 font-medium group-hover:translate-x-1 transition-transform">
              進入總覽 <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>

        <div className="text-center text-sm text-gray-400 mt-12">
          v2.0.0 • 由 Antigravity 協助開發
        </div>
      </div>
    </main>
  );
}
