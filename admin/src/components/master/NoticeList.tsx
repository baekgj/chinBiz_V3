"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { NOTICE_META, NoticeSeg } from "@/lib/noticeMeta";

type Notice = { id: number; title: string; targetName: string; allFlag: boolean; published: boolean; createdAt: string };
type PageResp = { content: Notice[]; page: number; totalPages: number; totalElements: number };

const SIZE = 10;

/** 본사 공지사항 리스트 (대상별). 우상단 [등록하기], 제목 클릭 → 수정 */
export default function NoticeList({ seg }: { seg: NoticeSeg }) {
  const meta = NOTICE_META[seg];
  const [rows, setRows] = useState<Notice[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const r = await apiGet<PageResp>(`/api/notices?target=${meta.key}&page=${p}&size=${SIZE}`);
    if (r.data) { setRows(r.data.content); setTotalPages(r.data.totalPages || 1); setTotal(r.data.totalElements); setPage(r.data.page); }
    setLoading(false);
  }, [meta.key]);

  useEffect(() => { load(0); }, [load]);

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black text-white">{meta.label} 공지사항 <span className="text-xs font-medium text-slate-500">· 총 {total}건</span></h3>
        <Link href={`/master/notice/${seg}/new`} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">+ 등록하기</Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-navy-800/60 text-xs text-slate-400">
              <th className="px-4 py-3 text-left font-semibold">제목</th>
              <th className="px-4 py-3 text-center font-semibold">공지 대상</th>
              <th className="px-4 py-3 text-center font-semibold">게시</th>
              <th className="px-4 py-3 text-left font-semibold">등록일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">등록된 공지가 없습니다. [+ 등록하기]로 추가하세요.</td></tr>
            ) : rows.map((n) => (
              <tr key={n.id} className="hover:bg-navy-800/40">
                <td className="px-4 py-3">
                  <Link href={`/master/notice/${seg}/${n.id}`} className="font-bold text-white hover:text-brand-400 hover:underline">{n.title}</Link>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${n.allFlag ? "bg-brand-600/20 text-brand-300" : "bg-navy-800 text-slate-300"}`}>{n.targetName}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${n.published ? "bg-pos/15 text-pos" : "bg-navy-800 text-slate-500"}`}>{n.published ? "게시중" : "미게시"}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{n.createdAt?.slice(0, 16).replace("T", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button disabled={page <= 0} onClick={() => load(page - 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40">이전</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => load(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? "bg-brand-600 text-white" : "border border-line text-slate-300"}`}>{i + 1}</button>
          ))}
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40">다음</button>
        </div>
      )}
    </section>
  );
}
