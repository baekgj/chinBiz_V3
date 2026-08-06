"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { apiGet } from "@/lib/api";

type Member = {
  id: number; userId: string; name: string; role: string; phone: string; email: string;
  centerName: string | null; createdAt: string;
};
type PageResp = { content: Member[]; page: number; totalElements: number; totalPages: number };

const ROLE_LABEL: Record<string, { l: string; t: "brand" | "pos" | "warn" | "slate" | "danger" }> = {
  MASTER_ADMIN: { l: "본사", t: "danger" },
  DIVISION_ADMIN: { l: "본부", t: "brand" },
  CENTER_ADMIN: { l: "센터", t: "warn" },
  PARTNER: { l: "파트너", t: "pos" },
  MANAGER: { l: "매니저", t: "slate" },
  BUZZ: { l: "버즈", t: "slate" },
};
const SIZE = 10;

export default function MembersPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<PageResp>(`/api/org/members?page=${page}&size=${SIZE}`).then((r) => {
      if (r.ok && r.data) setData(r.data);
      setLoading(false);
    });
  }, [page]);

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle title="회원 리스트" sub={`전체 회원 ${data?.totalElements ?? 0}명 · 본부/센터 등 전체 계정`}
          right={<Link href="/master/organization/register" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">+ 본부·센터 등록</Link>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-slate-400">
                <th className="px-3 py-3 text-left font-semibold">아이디</th>
                <th className="px-3 py-3 text-left font-semibold">이름</th>
                <th className="px-3 py-3 text-left font-semibold">역할</th>
                <th className="px-3 py-3 text-left font-semibold">소속</th>
                <th className="px-3 py-3 text-left font-semibold">전화</th>
                <th className="px-3 py-3 text-left font-semibold">이메일</th>
                <th className="px-3 py-3 text-right font-semibold">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">회원이 없습니다.</td></tr>
              ) : rows.map((m) => {
                const r = ROLE_LABEL[m.role] ?? { l: m.role, t: "slate" as const };
                return (
                  <tr key={m.id} className="hover:bg-navy-800/50">
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">{m.userId}</td>
                    <td className="px-3 py-3">
                      <Link href={`/master/organization/members/${m.id}`} className="font-bold text-brand-400 hover:underline">{m.name}</Link>
                    </td>
                    <td className="px-3 py-3"><Badge tone={r.t}>{r.l}</Badge></td>
                    <td className="px-3 py-3 text-slate-300">{m.centerName ?? "-"}</td>
                    <td className="px-3 py-3 text-slate-300">{m.phone || "-"}</td>
                    <td className="px-3 py-3 text-slate-300">{m.email || "-"}</td>
                    <td className="px-3 py-3 text-right text-xs text-slate-500">{m.createdAt ? m.createdAt.slice(0, 10) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40 hover:bg-navy-800">이전</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`h-8 w-8 rounded-lg text-sm font-semibold ${i === page ? "bg-brand-600 text-white" : "text-slate-400 hover:bg-navy-800"}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40 hover:bg-navy-800">다음</button>
          </div>
        )}
        <p className="mt-3 text-center text-xs text-slate-500"><Badge tone="brand">회원명 클릭</Badge> 시 정보 수정 (비밀번호 변경 가능).</p>
      </Card>
    </div>
  );
}
