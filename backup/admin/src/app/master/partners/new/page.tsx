"use client";

import Link from "next/link";
import PartnerForm from "@/components/master/PartnerForm";

export default function NewPartnerPage() {
  return (
    <div className="animate-float-up">
      <div className="mb-4">
        <Link href="/master/partners" className="text-sm text-slate-400 hover:text-slate-200">← 파트너사 목록</Link>
        <h1 className="mt-1 text-xl font-black text-white">파트너사 등록</h1>
        <p className="text-sm text-slate-500">신규 파트너사 계정 및 정보를 등록합니다. (partner 테이블 저장)</p>
      </div>
      <PartnerForm mode="new" />
    </div>
  );
}
