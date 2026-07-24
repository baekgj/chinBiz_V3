"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrgMemberForm, { type OrgMember } from "@/components/master/OrgMemberForm";
import { apiGet } from "@/lib/api";

export default function EditMemberPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<OrgMember | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    apiGet<OrgMember>(`/api/org/members/${params.id}`).then((res) => {
      if (res.ok && res.data) { setData(res.data); setStatus("ok"); }
      else setStatus("notfound");
    });
  }, [params.id]);

  return (
    <div className="animate-float-up">
      <div className="mb-4">
        <Link href="/master/organization/members" className="text-sm text-slate-400 hover:text-slate-200">← 회원 리스트</Link>
        <h1 className="mt-1 text-xl font-black text-white">회원 정보 수정</h1>
        <p className="text-sm text-slate-500">{data ? `${data.name} (${data.userId})` : "회원 정보를 수정합니다."} · 비밀번호는 변경 시에만 입력</p>
      </div>
      {status === "loading" && <p className="text-sm text-slate-500">불러오는 중…</p>}
      {status === "notfound" && <p className="text-sm text-danger">회원을 찾을 수 없습니다.</p>}
      {status === "ok" && data && <OrgMemberForm mode="edit" initial={data} />}
    </div>
  );
}
