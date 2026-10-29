"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Row = { id: number; title: string; targetLabel: string; createdAt: string | null };
type PageRes = { content: Row[]; totalElements: number; totalPages: number; page: number };

const SIZE = 10;
const ymd = (iso: string | null) => (iso ? iso.slice(0, 10).replace(/-/g, ".") : "");

/** HOME 공지사항 리스트 — 제목 검색 + 페이징, 행 클릭 시 상세로 이동 */
export default function NoticeList() {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<PageRes | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), size: String(SIZE) });
    if (query) qs.set("q", query);
    apiGet<PageRes>(`/api/public/notices/list?${qs}`).then((r) => {
      if (r.ok && r.data) { setData(r.data); setError(false); } else setError(true);
    });
  }, [page, query]);

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const pages = data?.totalPages ?? 0;

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setPage(0); setQuery(q.trim()); }}
        className="flex items-center justify-between gap-3">
        <p className="shrink-0 text-sm text-muted">전체 <b className="text-ink">{total.toLocaleString("ko-KR")}</b>건</p>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목 검색"
            className="w-36 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest-500 sm:w-56" />
          <button className="shrink-0 rounded-lg bg-forest-800 px-4 py-2 text-sm font-bold text-white hover:bg-forest-700">검색</button>
        </div>
      </form>

      <ul className="mt-4 divide-y divide-line border-b border-t-2 border-b-line border-t-forest-800">
        {error && <li className="py-16 text-center text-sm text-muted">공지사항을 불러오지 못했습니다.</li>}
        {!error && data && rows.length === 0 && <li className="py-16 text-center text-sm text-muted">등록된 공지사항이 없습니다.</li>}
        {rows.map((n, i) => (
          <li key={n.id}>
            <Link href={`/notices/${n.id}`} className="flex items-center gap-3 px-2 py-4 transition-colors hover:bg-forest-50 sm:gap-4">
              <span className="hidden w-12 shrink-0 text-center text-sm text-muted sm:block">{total - page * SIZE - i}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">
                  {n.targetLabel && <span className="mr-1.5 text-gold-600">[{n.targetLabel}]</span>}
                  {n.title}
                </span>
                <span className="mt-1 block text-xs text-muted sm:hidden">{ymd(n.createdAt)}</span>
              </span>
              <span className="hidden shrink-0 text-sm text-muted sm:block">{ymd(n.createdAt)}</span>
            </Link>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="mt-8 flex justify-center gap-1">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}
            className="rounded-lg px-3 py-2 text-sm text-muted disabled:opacity-40" aria-label="이전 페이지">‹</button>
          {Array.from({ length: pages }, (_, i) => i)
            .filter((i) => Math.abs(i - page) <= 4)
            .map((i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold ${i === page ? "bg-forest-800 text-white" : "text-ink hover:bg-forest-50"}`}>
                {i + 1}
              </button>
            ))}
          <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}
            className="rounded-lg px-3 py-2 text-sm text-muted disabled:opacity-40" aria-label="다음 페이지">›</button>
        </div>
      )}
    </div>
  );
}
