"use client";

import Link from "next/link";
import AdForm from "@/components/master/AdForm";

export default function NewAdPage() {
  return (
    <div className="animate-float-up">
      <div className="mb-4">
        <Link href="/master/ads" className="text-sm text-slate-400 hover:text-slate-200">← 광고리스트</Link>
        <h1 className="mt-1 text-xl font-black text-white">광고등록</h1>
        <p className="text-sm text-slate-500">HOME 메인화면에 노출할 광고를 등록합니다.</p>
      </div>
      <AdForm />
    </div>
  );
}
