"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PartnerForm, { type PartnerData } from "@/components/master/PartnerForm";
import { apiGet } from "@/lib/api";

export default function EditPartnerPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PartnerData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    let alive = true;
    apiGet<PartnerData>(`/api/partners/${params.id}`).then((res) => {
      if (!alive) return;
      if (res.ok && res.data) { setData(res.data); setStatus("ok"); }
      else setStatus("notfound");
    });
    return () => { alive = false; };
  }, [params.id]);

  return (
    <div className="animate-float-up">
      <div className="mb-4">
        <Link href="/master/partners" className="text-sm text-slate-400 hover:text-slate-200">← 파트너사 목록</Link>
        <h1 className="mt-1 text-xl font-black text-white">파트너사 정보 수정</h1>
        <p className="text-sm text-slate-500">
          {data ? `${data.companyName} (${data.partnerId})` : "파트너사 정보를 수정합니다."} · 비밀번호는 변경 시에만 입력
        </p>
      </div>

      {status === "loading" && <p className="text-sm text-slate-500">불러오는 중…</p>}
      {status === "notfound" && <p className="text-sm text-danger">파트너사를 찾을 수 없습니다.</p>}
      {status === "ok" && data && <PartnerForm mode="edit" initial={data} />}
    </div>
  );
}
