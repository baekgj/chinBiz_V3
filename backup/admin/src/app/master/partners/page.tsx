"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import Icon from "@/components/Icon";
import { apiGet } from "@/lib/api";

type PartnerRow = {
  id: number; partnerId: string; companyName: string; businessNumber: string;
  ceoName: string; managerName: string; managerPhone: string; createdAt: string;
};
type PageResp = { content: PartnerRow[]; page: number; size: number; totalElements: number; totalPages: number };

const SIZE = 10;

export default function PartnersPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<PageResp>(`/api/partners?page=${page}&size=${SIZE}`).then((res) => {
      if (!alive) return;
      if (res.ok && res.data) setData(res.data);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [page]);

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle
          title="파트너사 관리"
          sub={`등록된 파트너사 ${totalElements}개 · partner 테이블`}
          right={
            <Link href="/master/partners/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">
              <Icon name="handshake" className="h-4 w-4" /> 파트너사 등록
            </Link>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-slate-400">
                <th className="px-3 py-3 text-left font-semibold">파트너사 ID</th>
                <th className="px-3 py-3 text-left font-semibold">상호명</th>
                <th className="px-3 py-3 text-left font-semibold">사업자번호</th>
                <th className="px-3 py-3 text-left font-semibold">대표자</th>
                <th className="px-3 py-3 text-left font-semibold">담당자</th>
                <th className="px-3 py-3 text-left font-semibold">연락처</th>
                <th className="px-3 py-3 text-right font-semibold">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">등록된 파트너사가 없습니다. [파트너사 등록]으로 추가하세요.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-800/50">
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">{r.partnerId}</td>
                    <td className="px-3 py-3">
                      <Link href={`/master/partners/${r.id}`} className="font-bold text-brand-400 hover:underline">
                        {r.companyName}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{r.businessNumber || "-"}</td>
                    <td className="px-3 py-3 text-slate-300">{r.ceoName || "-"}</td>
                    <td className="px-3 py-3 text-slate-300">{r.managerName || "-"}</td>
                    <td className="px-3 py-3 text-slate-300">{r.managerPhone || "-"}</td>
                    <td className="px-3 py-3 text-right text-xs text-slate-500">{r.createdAt ? r.createdAt.slice(0, 10) : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이징 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40 hover:bg-navy-800">이전</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`h-8 w-8 rounded-lg text-sm font-semibold ${i === page ? "bg-brand-600 text-white" : "text-slate-400 hover:bg-navy-800"}`}>
                {i + 1}
              </button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40 hover:bg-navy-800">다음</button>
          </div>
        )}
        <p className="mt-3 text-center text-xs text-slate-500">
          <Badge tone="brand">파트너사명 클릭</Badge> 시 정보 수정 화면으로 이동합니다.
        </p>
      </Card>
    </div>
  );
}
