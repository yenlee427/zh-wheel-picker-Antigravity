import Link from "next/link";
import { Disc, LayoutGrid, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            中文小遊戲樂園
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            用抽題方式玩中文挑戰，支援多題庫管理、快速切換與統計追蹤。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Single Mode Card */}
          <Link
            href="/single"
            className="group relative flex flex-col items-start p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all duration-300"
          >
            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors mb-4">
              <Disc className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              單人抽題模式
            </h2>
            <p className="text-gray-500 mb-6 flex-grow">
              自訂一組中文題目，單人快速抽題並保留每回合出題紀錄。
            </p>
            <div className="flex items-center text-indigo-600 font-medium group-hover:translate-x-1 transition-transform">
              開始挑戰 <ArrowRight className="w-4 h-4 ml-1" />
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
              多題庫快速挑戰
            </h2>
            <p className="text-gray-500 mb-6 flex-grow">
              同步操作多個中文題庫，適合課堂互動、分組競賽與活動帶領。
            </p>
            <div className="flex items-center text-emerald-600 font-medium group-hover:translate-x-1 transition-transform">
              打開總覽 <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>

        <div className="text-center text-sm text-gray-400 mt-12">
          v2.0.0 • 中文小遊戲版
        </div>
      </div>
    </main>
  );
}
