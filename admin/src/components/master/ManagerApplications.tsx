"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { apiGet, apiPost } from "@/lib/api";

type Row = {
  buzzId: number; userId: string; name: string; centerId: number; centerName: string;
  applyDate: string | null; approveDate?: string | null; recentCount?: number; recentAmount?: number;
};

const won = (n?: number) => "₩" + (n ?? 0).toLocaleString("ko-KR");

/** 본사 [조직망 및 영업관리]-[매니저신청] — 신청접수/승인완료 탭 (docs/20) */
export default function ManagerApplications() {
  const [tab, setTab] = useState<"I" | "Y">("I");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async (st: "I" | "Y") => {
    setLoading(true);
    const r = await apiGet<{ content: Row[] }>(`/api/org/manager-applications?status=${st}`);
    setRows(r.ok && r.data ? r.data.content : []);
    setLoading(false);
  }, []);
  useEffect(() => { load(tab); }, [load, tab]);

  async function act(kind: "approve" | "cancel", row: Row) {
    if (kind === "cancel" && !confirm(`${row.name}(${row.userId}) 회원의 ${row.centerName} 매니저 승인을 취소할까요?`)) return;
    setBusy(`${row.buzzId}-${row.centerId}`); setMsg(null);
    const r = await apiPost<{ message: string }>(`/api/org/manager-applications/${row.buzzId}/${row.centerId}/${kind}`, {});
    setBusy(null);
    setMsg(r.ok ? (r.data?.message ?? "처리되었습니다.") : (r.message ?? "처리 실패"));
    if (r.ok) load(tab);
  }

  const TABS: { key: "I" | "Y"; label: string }[] = [
    { key: "I", label: "매니저 신청접수" },
    { key: "Y", label: "매니저 승인완료" },
  ];

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle title="매니저 신청" sub="버즈회원의 매니저 활동 신청 접수·승인 관리 (전 센터)" />

        <div className="mb-4 flex gap-1 rounded-xl bg-navy-950 p-1 ring-1 ring-line">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${tab === t.key ? "bg-brand-600 text-white" : "text-slate-400 hover:bg-navy-800"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {msg && <p className="mb-3 text-sm font-semibold text-brand-300">{msg}</p>}

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-navy-800 text-xs text-slate-400">
                <th className="px-4 py-3 text-left font-semibold">신청일자</th>
                <th className="px-4 py-3 text-left font-semibold">버즈ID</th>
                <th className="px-4 py-3 text-left font-semibold">버즈명</th>
                <th className="px-4 py-3 text-left font-semibold">신청지역</th>
                {tab === "Y" && <th className="px-4 py-3 text-left font-semibold">승인일자</th>}
                {tab === "Y" && <th className="px-4 py-3 text-right font-semibold">최근3개월 실적</th>}
                <th className="px-4 py-3 text-center font-semibold">{tab === "I" ? "승인" : "취소"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={tab === "Y" ? 7 : 5} className="px-4 py-10 text-center text-slate-500">불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={tab === "Y" ? 7 : 5} className="px-4 py-10 text-center text-slate-500">{tab === "I" ? "신청 접수 건이 없습니다." : "승인 완료 건이 없습니다."}</td></tr>
              ) : rows.map((r) => {
                const id = `${r.buzzId}-${r.centerId}`;
                return (
                  <tr key={id} className="hover:bg-navy-800/50">
                    <td className="px-4 py-3 text-slate-400">{r.applyDate ?? "-"}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{r.userId}</td>
                    <td className="px-4 py-3 font-bold text-white">{r.name}</td>
                    <td className="px-4 py-3 text-slate-300">{r.centerName}</td>
                    {tab === "Y" && <td className="px-4 py-3 text-slate-400">{r.approveDate ?? "-"}</td>}
                    {tab === "Y" && <td className="px-4 py-3 text-right text-slate-300">{r.recentCount ?? 0}건 · {won(r.recentAmount)}</td>}
                    <td className="px-4 py-3 text-center">
                      {tab === "I" ? (
                        <button onClick={() => act("approve", r)} disabled={busy === id}
                          className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-500 disabled:opacity-50">
                          {busy === id ? "…" : "승인"}
                        </button>
                      ) : (
                        <button onClick={() => act("cancel", r)} disabled={busy === id}
                          className="rounded-lg border border-red-500/50 px-4 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-50">
                          {busy === id ? "…" : "취소"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
