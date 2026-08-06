"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { apiGet, apiPost } from "@/lib/api";

type Inquiry = {
  id: number; companyName: string; contactName: string; phone: string; email: string;
  stage: string; message: string; status: string; createdAt: string;
};

const STATUS: Record<string, { label: string; tone: "brand" | "pos" | "danger" | "warn" }> = {
  NEW: { label: "접수", tone: "warn" },
  DONE: { label: "상담완료", tone: "pos" },
  CANCELED: { label: "신청취소", tone: "danger" },
};

export default function PartnerInquiriesPage() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    apiGet<{ content: Inquiry[] }>("/api/partners/inquiries").then((res) => {
      if (res.ok && res.data) setRows(res.data.content ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  async function setStatus(id: number, status: "DONE" | "CANCELED") {
    setBusy(id);
    const r = await apiPost(`/api/partners/inquiries/${id}/status`, { status });
    setBusy(null);
    if (r.ok) load();
    else alert(r.message || "처리 중 오류가 발생했습니다.");
  }

  const newCount = rows.filter((r) => r.status === "NEW").length;

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle
          title="파트너사 입점 상담신청"
          sub={`홈페이지에서 접수된 입점 제안 · 미처리 ${newCount}건 / 전체 ${rows.length}건`}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-slate-400">
                <th className="px-3 py-3 text-left font-semibold">접수일</th>
                <th className="px-3 py-3 text-left font-semibold">회사명</th>
                <th className="px-3 py-3 text-left font-semibold">담당자</th>
                <th className="px-3 py-3 text-left font-semibold">연락처</th>
                <th className="px-3 py-3 text-left font-semibold">이메일</th>
                <th className="px-3 py-3 text-left font-semibold">단계 / 내용</th>
                <th className="px-3 py-3 text-center font-semibold">상태</th>
                <th className="px-3 py-3 text-center font-semibold">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">접수된 상담신청이 없습니다.</td></tr>
              ) : (
                rows.map((q) => {
                  const st = STATUS[q.status] ?? { label: q.status, tone: "brand" as const };
                  const closed = q.status !== "NEW";
                  return (
                    <tr key={q.id} className="hover:bg-navy-800/50 align-top">
                      <td className="px-3 py-3 text-xs text-slate-500">{q.createdAt ? q.createdAt.slice(0, 10) : "-"}</td>
                      <td className="px-3 py-3 font-bold text-white">{q.companyName}</td>
                      <td className="px-3 py-3 text-slate-300">{q.contactName || "-"}</td>
                      <td className="px-3 py-3 text-slate-300">{q.phone || "-"}</td>
                      <td className="px-3 py-3 text-slate-300">{q.email || "-"}</td>
                      <td className="px-3 py-3 max-w-[280px]">
                        {q.stage && <p className="text-xs font-semibold text-brand-400">{q.stage}</p>}
                        {q.message && <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-400">{q.message}</p>}
                        {!q.stage && !q.message && <span className="text-slate-600">-</span>}
                      </td>
                      <td className="px-3 py-3 text-center"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="px-3 py-3">
                        {closed ? (
                          <p className="text-center text-xs text-slate-600">처리완료</p>
                        ) : (
                          <div className="flex justify-center gap-1.5">
                            <button
                              disabled={busy === q.id}
                              onClick={() => setStatus(q.id, "DONE")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
                            >상담완료</button>
                            <button
                              disabled={busy === q.id}
                              onClick={() => setStatus(q.id, "CANCELED")}
                              className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-navy-800 disabled:opacity-40"
                            >신청취소</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
