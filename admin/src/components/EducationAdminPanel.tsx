"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

export type EduCls = {
  card: string; head: string; sub: string; tableWrap: string; thead: string; rowHover: string;
  divide: string; cellMain: string; cellSub: string; primaryBtn: string; badge: string; note: string;
};

type Row = {
  id: number; productName?: string; partnerName?: string; managerName?: string; managerReferralCode?: string;
  appliedAt?: string; approvedAt?: string; approverName?: string;
};

/**
 * 교육관리 공용 패널 (본사·센터 공용, 테마 클래스 주입).
 *  - mode="pending"  : 교육이수 신청(교육완료·미승인) → [승인완료]
 *  - mode="approved" : 교육이수 승인(신청일·승인일·담당자)
 */
export default function EducationAdminPanel({ mode, cls }: { mode: "pending" | "approved"; cls: EduCls }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const url = mode === "pending" ? "/api/education/pending" : "/api/education/approved";
  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiGet<{ content: Row[] }>(url);
    if (r.data?.content) setRows(r.data.content);
    setLoading(false);
  }, [url]);
  useEffect(() => { load(); }, [load]);

  async function approve(id: number) {
    setBusy(id);
    await apiPost(`/api/education/${id}/approve`, {});
    await load();
    setBusy(null);
  }

  return (
    <section className={cls.card}>
      <div className="mb-4">
        <h2 className={`text-base font-black ${cls.head}`}>{mode === "pending" ? "교육이수 신청 (승인 대기)" : "교육이수 승인 내역"}</h2>
        <p className={`mt-0.5 text-xs ${cls.sub}`}>{mode === "pending" ? "교육완료·미승인 건에 대해 [승인완료] 처리" : "승인 완료된 교육 이수 내역 (신청일·승인일·담당자)"}</p>
      </div>
      <div className={`overflow-x-auto rounded-xl border ${cls.tableWrap}`}>
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className={`text-xs ${cls.thead}`}>
              <th className="px-4 py-3 text-left font-semibold">상품명</th>
              <th className="px-4 py-3 text-left font-semibold">파트너사</th>
              <th className="px-4 py-3 text-left font-semibold">매니저</th>
              <th className="px-4 py-3 text-center font-semibold">교육신청일</th>
              {mode === "approved" && <th className="px-4 py-3 text-center font-semibold">승인일</th>}
              {mode === "approved" && <th className="px-4 py-3 text-center font-semibold">담당자</th>}
              {mode === "pending" && <th className="px-4 py-3 text-right font-semibold">처리</th>}
            </tr>
          </thead>
          <tbody className={`divide-y ${cls.divide}`}>
            {loading ? (
              <tr><td colSpan={6} className={`px-4 py-10 text-center ${cls.note}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className={`px-4 py-10 text-center ${cls.note}`}>{mode === "pending" ? "승인 대기 중인 교육 신청이 없습니다." : "승인된 교육 내역이 없습니다."}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className={cls.rowHover}>
                <td className={`px-4 py-3 font-bold ${cls.cellMain}`}>{r.productName ?? "-"}</td>
                <td className={`px-4 py-3 ${cls.cellSub}`}>{r.partnerName ?? "-"}</td>
                <td className={`px-4 py-3 ${cls.cellSub}`}>{r.managerName ?? "-"}{r.managerReferralCode ? ` (${r.managerReferralCode})` : ""}</td>
                <td className={`px-4 py-3 text-center ${cls.cellSub}`}>{r.appliedAt ?? "-"}</td>
                {mode === "approved" && <td className={`px-4 py-3 text-center ${cls.cellSub}`}>{r.approvedAt ?? "-"}</td>}
                {mode === "approved" && <td className={`px-4 py-3 text-center ${cls.cellSub}`}>{r.approverName ?? "-"}</td>}
                {mode === "pending" && (
                  <td className="px-4 py-3 text-right">
                    <button disabled={busy === r.id} onClick={() => approve(r.id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${cls.primaryBtn}`}>
                      {busy === r.id ? "처리 중…" : "승인완료"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
