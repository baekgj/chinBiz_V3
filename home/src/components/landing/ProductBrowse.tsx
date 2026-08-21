"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiGet, mediaUrl } from "@/lib/api";

type Product = {
  id: number; name: string; partnerName?: string | null; categoryName?: string | null;
  description?: string; image1?: string | null; popular?: boolean; recommended?: boolean;
};
type PageResp = { content: Product[]; page: number; totalPages: number; totalElements: number };
type Cat = { id: number; name: string };

const SIZE = 9;
const SORTS: { key: string; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "popular", label: "인기순" },
];

export default function ProductBrowse() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [kw, setKw] = useState("");
  const [q, setQ] = useState({ kw: "", categoryId: null as number | null, sort: "latest" });

  useEffect(() => { apiGet<Cat[]>("/api/public/categories").then((r) => { if (r.data) setCats(r.data); }); }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: String(SIZE), sort: q.sort });
    if (q.kw) params.set("keyword", q.kw);
    if (q.categoryId != null) params.set("categoryId", String(q.categoryId));
    const r = await apiGet<PageResp>(`/api/public/products/list?${params}`);
    if (r.data) { setRows(r.data.content); setTotal(r.data.totalElements); setTotalPages(r.data.totalPages || 1); setPage(r.data.page); }
    setLoading(false);
  }, [q]);
  useEffect(() => { load(0); }, [load]);

  return (
    <div>
      {/* 검색 */}
      <div className="relative">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        <input
          value={kw} onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setQ((p) => ({ ...p, kw }))}
          placeholder="검색어 입력: 예) 돌솥 세척기, ADT캡스, 건강기능식품…"
          className="w-full rounded-2xl border border-line bg-white py-3.5 pl-12 pr-28 text-sm text-ink outline-none focus:border-forest-400"
        />
        <button onClick={() => setQ((p) => ({ ...p, kw }))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-forest-800 px-4 py-2 text-sm font-bold text-white hover:bg-forest-700">검색</button>
      </div>

      {/* 카테고리 칩 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setQ((p) => ({ ...p, categoryId: null }))}
          className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${q.categoryId == null ? "border-forest-800 bg-forest-800 text-white" : "border-line bg-white text-ink-soft hover:border-forest-300"}`}>전체보기</button>
        {cats.map((c) => (
          <button key={c.id} onClick={() => setQ((p) => ({ ...p, categoryId: c.id }))}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${q.categoryId === c.id ? "border-forest-800 bg-forest-800 text-white" : "border-line bg-white text-ink-soft hover:border-forest-300"}`}>{c.name}</button>
        ))}
      </div>

      {/* 정렬 (오른쪽) */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">총 <b className="text-ink">{total}</b>개의 상품</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">정렬</span>
          {SORTS.map((s) => (
            <button key={s.key} onClick={() => setQ((p) => ({ ...p, sort: s.key }))}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${q.sort === s.key ? "bg-forest-800 text-white" : "text-ink-soft hover:bg-surface-3"}`}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* 그리드 */}
      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl border border-line bg-white" />)}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-white py-16 text-center text-sm text-muted">조건에 맞는 상품이 없습니다.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <div key={p.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:border-forest-300 hover:shadow-md">
              <div className="relative h-40 w-full bg-forest-50">
                {p.image1
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={mediaUrl(p.image1)} alt={p.name} className="h-full w-full object-cover" />
                  : <div className="grid h-full w-full place-items-center text-forest-300"><svg viewBox="0 0 24 24" className="h-10 w-10" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></div>}
                {p.categoryName && <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-ink-soft shadow-sm">{p.categoryName}</span>}
                <div className="absolute right-3 top-3 flex gap-1">
                  {p.popular && <span className="rounded-md bg-gold-400 px-2 py-0.5 text-xs font-black text-forest-900 shadow">인기</span>}
                  {p.recommended && <span className="rounded-md bg-forest-600 px-2 py-0.5 text-xs font-black text-white shadow">추천</span>}
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-5">
                <p className="truncate text-xs font-medium text-muted">{p.partnerName ?? "파트너사"}</p>
                <h3 className="mt-0.5 break-words text-base font-bold text-ink">{p.name}</h3>
                <p className="mt-2 flex-1 break-words text-sm leading-relaxed text-muted">{p.description || "로그인 후 상세 정보를 확인하세요."}</p>
                <Link href="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-forest-600 hover:text-forest-700">상세정보 보기 <span aria-hidden>→</span></Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이징 */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <button disabled={page <= 0} onClick={() => load(page - 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft disabled:opacity-40 hover:bg-surface-3">이전</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => load(i)} className={`h-9 w-9 rounded-lg text-sm font-bold ${i === page ? "bg-forest-800 text-white" : "text-ink-soft hover:bg-surface-3"}`}>{i + 1}</button>
          ))}
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft disabled:opacity-40 hover:bg-surface-3">다음</button>
        </div>
      )}

      {/* 가드레일 안내 */}
      <p className="mt-8 rounded-2xl border border-gold-400/30 bg-gold-50 px-4 py-3 text-center text-sm text-ink-soft">
        🔒 정확한 공급 단가, 마진율 및 버즈 수당(인센티브) 정보는 <b>계정 로그인 후</b> 확인하실 수 있습니다.
      </p>
    </div>
  );
}
