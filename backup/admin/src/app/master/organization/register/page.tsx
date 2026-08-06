"use client";

import Link from "next/link";
import OrgMemberForm from "@/components/master/OrgMemberForm";

export default function OrgRegisterPage() {
  return (
    <div className="animate-float-up">
      <div className="mb-4">
        <Link href="/master/organization/members" className="text-sm text-slate-400 hover:text-slate-200">← 회원 리스트</Link>
        <h1 className="mt-1 text-xl font-black text-white">본부·센터 등록</h1>
        <p className="text-sm text-slate-500">본부/센터 계정을 user 테이블에 등록합니다. (소속 = center_code.idx → sales_center_id)</p>
      </div>
      <OrgMemberForm mode="new" />
    </div>
  );
}
