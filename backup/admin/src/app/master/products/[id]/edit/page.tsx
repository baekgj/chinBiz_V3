"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductForm, { type ProductData } from "@/components/master/ProductForm";
import { apiGet } from "@/lib/api";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProductData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    apiGet<ProductData>(`/api/products/${params.id}`).then((res) => {
      if (res.ok && res.data) { setData(res.data); setStatus("ok"); }
      else setStatus("notfound");
    });
  }, [params.id]);

  return (
    <div className="animate-float-up">
      <div className="mb-4">
        <Link href="/master/products" className="text-sm text-slate-400 hover:text-slate-200">← 상품 리스트</Link>
        <h1 className="mt-1 text-xl font-black text-white">상품 정보 수정</h1>
        <p className="text-sm text-slate-500">{data ? String(data.name) : "상품 정보를 수정합니다."}</p>
      </div>
      {status === "loading" && <p className="text-sm text-slate-500">불러오는 중…</p>}
      {status === "notfound" && <p className="text-sm text-danger">상품을 찾을 수 없습니다.</p>}
      {status === "ok" && data && <ProductForm mode="edit" initial={data} />}
    </div>
  );
}
