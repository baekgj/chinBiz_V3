"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdForm, { type AdData } from "@/components/master/AdForm";
import { apiGet } from "@/lib/api";

export default function EditAdPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AdData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    apiGet<AdData>(`/api/ads/${params.id}`).then((res) => {
      if (res.ok && res.data) { setData(res.data); setStatus("ok"); }
      else setStatus("notfound");
    });
  }, [params.id]);

  return (
    <div className="animate-float-up">
      <div className="mb-4">
        <Link href="/master/ads" className="text-sm text-slate-400 hover:text-slate-200">← 광고리스트</Link>
        <h1 className="mt-1 text-xl font-black text-white">광고 수정</h1>
        <p className="text-sm text-slate-500">{data ? data.areaId : "광고 정보를 수정합니다."}</p>
      </div>
      {status === "loading" && <p className="text-sm text-slate-500">불러오는 중…</p>}
      {status === "notfound" && <p className="text-sm text-danger">광고를 찾을 수 없습니다.</p>}
      {status === "ok" && data && <AdForm initial={data} />}
    </div>
  );
}
