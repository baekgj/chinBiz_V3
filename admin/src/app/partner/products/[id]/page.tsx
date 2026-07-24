"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/partner/PartnerUI";
import ProductForm, { type ProductData } from "@/components/partner/ProductForm";
import { apiGet } from "@/lib/api";

export default function PartnerProductEditPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProductData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    apiGet<ProductData>(`/api/partner/products/${params.id}`).then((r) => {
      if (r.ok && r.data) setData(r.data);
      else setErr(r.message ?? "상품을 찾을 수 없습니다.");
    });
  }, [params?.id]);

  return (
    <div className="animate-float-up">
      <PageHead title="상품 수정" sub="위탁 상품 정보 및 총수당 배분 수정" />
      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{err}</div>
      ) : data ? (
        <ProductForm mode="edit" initial={data} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">불러오는 중…</div>
      )}
    </div>
  );
}
