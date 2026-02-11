import { Suspense } from "react";
import SingleClient from "@/components/SingleClient";

export default function SinglePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">載入中...</div>}>
            <SingleClient />
        </Suspense>
    );
}
