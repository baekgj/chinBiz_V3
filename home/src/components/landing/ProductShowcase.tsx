"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet, mediaUrl } from "@/lib/api";

type Product = {
  id: number; name: string; partnerName?: string | null; categoryName?: string | null;
  description?: string; image1?: string | null; popular?: boolean; recommended?: boolean;
};

/** 홈 대표 상품 그리드 — 공개 API(/api/public/products) 실데이터. 단가·수당은 미노출(가드레일) */
export default function ProductShowcase() {
  const [rows, setRows] = useState<Product[] | null>(null);

  useEffect(() => {
    apiGet<Product[]>("/api/public/products?limit=4").then((r) => setRows(r.ok && r.data ? r.data : []));
  }, []);

  if (rows === null) {
    return <div className="mt-12 grid gap-5 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl border border-line bg-white" />)}
    </div>;
  }

  if (rows.length === 0) {
    return <p className="mt-12 rounded-2xl border border-dashed border-line bg-white py-12 text-center text-sm text-muted">
      현재 노출 가능한 상품이 없습니다.
    </p>;
  }

  return (
    <div className="mt-12 grid gap-5 md:grid-cols-2">
      {rows.map((p) => (
        <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:border-forest-300 hover:shadow-md">
          {/* 상품 이미지 — 카드 절반 정도의 큰 영역 */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-forest-50">
            {p.image1
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={mediaUrl(p.image1)} alt={p.name} className="h-full w-full object-cover" />
              : <span className="grid h-full w-full place-items-center text-forest-300">
                  <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 20h8M12 18v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </span>}
            {(p.popular || p.recommended) && (
              <div className="absolute right-3 top-3 flex gap-1">
                {p.popular && <span className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-bold text-gold-600 ring-1 ring-gold-400/30">인기</span>}
                {p.recommended && <span className="rounded-full bg-forest-100 px-2.5 py-1 text-xs font-bold text-forest-600 ring-1 ring-forest-300/40">추천</span>}
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-6">
            <p className="text-xs font-medium text-muted">{p.partnerName ?? "파트너사"}{p.categoryName ? ` · ${p.categoryName}` : ""}</p>
            <h3 className="mt-0.5 text-base font-bold text-ink">{p.name}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{p.description || "로그인 후 상세 정보를 확인하세요."}</p>
            <Link href={`/products/${p.id}`} className="mt-5 flex items-center gap-2 text-sm font-semibold text-forest-600 hover:text-forest-700">
              상세정보 보기 <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
