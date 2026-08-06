"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { krw } from "@/components/ui";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";

type Row = {
  saleDate?: string; gubun?: string; productName?: string; customerName?: string;
  buzzName?: string; fixedDate?: string; amount: number; status: string;
};

const toYM = (v: string) => (v ? v.replace("-", "") : ""); // 2026-07 → 202607
const toInput = (ym: string) => (ym && ym.length === 6 ? `${ym.slice(0, 4)}-${ym.slice(4)}` : ""); // 202607 → 2026-07

/** 수당현황 — allowance 검색·리스트 (버즈: 구분/상태/월 · 매니저: 상태/월) */
export default function AllowancesSection() {
  const { theme, isManager } = useBuzz();
  const sp = useSearchParams();
  const as = isManager ? "manager" : "buzz";

  const [gubun, setGubun] = useState(sp.get("gubun") || "all");
  const [status, setStatus] = useState(sp.get("status") || "all");
  const [monthInput, setMonthInput] = useState(toInput(sp.get("month") || ""));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  // 실제 적용된 검색값
  const [q, setQ] = useState({ gubun: sp.get("gubun") || "all", status: sp.get("status") || "all", month: sp.get("month") || "" });

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ as });
    if (!isManager) p.set("gubun", q.gubun);
    p.set("status", q.status);
    if (q.month) p.set("month", q.month);
    const r = await apiGet<{ content: Row[] }>(`/api/buzz/allowances?${p}`);
    if (r.ok && r.data) setRows(r.data.content ?? []);
    setLoading(false);
  }, [as, isManager, q]);
  useEffect(() => { load(); }, [load]);

  const selCls = `rounded-lg border px-3 py-2 text-sm outline-none ${theme.input}`;
  const buzzColLabel = isManager ? "1차영업버즈회원" : "추천버즈회원";

  return (
    <Card title="수당현황" sub="수당(Allowance) 원장 검색">
      {/* 검색 영역 */}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        {!isManager && (
          <div>
            <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>구분</p>
            <select className={selCls} value={gubun} onChange={(e) => setGubun(e.target.value)}>
              <option value="all">전체</option>
              <option value="buzz">영업수당</option>
              <option value="referral">추천수당</option>
            </select>
          </div>
        )}
        <div>
          <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>상태</p>
          <select className={selCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">전체</option>
            <option value="cp">예정</option>
            <option value="mp">확정</option>
          </select>
        </div>
        <div>
          <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>대상월</p>
          <input type="month" className={selCls} value={monthInput} onChange={(e) => setMonthInput(e.target.value)} />
        </div>
        <button onClick={() => setQ({ gubun, status, month: toYM(monthInput) })} className={`rounded-lg px-4 py-2 text-sm font-bold ${theme.primaryBtn}`}>검색</button>
        <button onClick={() => { setGubun("all"); setStatus("all"); setMonthInput(""); setQ({ gubun: "all", status: "all", month: "" }); }}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${theme.tableWrap} ${theme.cellSub}`}>초기화</button>
      </div>

      <div className={`overflow-x-auto rounded-xl border ${theme.tableWrap}`}>
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className={`text-xs ${theme.thead}`}>
              <th className="px-3 py-3 text-left font-semibold">영업일자</th>
              <th className="px-3 py-3 text-left font-semibold">구분</th>
              <th className="px-3 py-3 text-left font-semibold">상품명</th>
              <th className="px-3 py-3 text-left font-semibold">고객명</th>
              <th className="px-3 py-3 text-left font-semibold">{buzzColLabel}</th>
              <th className="px-3 py-3 text-left font-semibold">확정일자</th>
              <th className="px-3 py-3 text-right font-semibold">수당금액</th>
              <th className="px-3 py-3 text-center font-semibold">상태</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.divide}`}>
            {loading ? (
              <tr><td colSpan={8} className={`px-4 py-10 text-center ${theme.note}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className={`px-4 py-10 text-center ${theme.note}`}>수당 내역이 없습니다.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className={theme.rowHover}>
                <td className={`px-3 py-3 ${theme.cellSub}`}>{r.saleDate ?? "-"}</td>
                <td className={`px-3 py-3 ${theme.cellSub}`}>{r.gubun ?? "-"}</td>
                <td className={`px-3 py-3 font-semibold ${theme.cellMain}`}>{r.productName ?? "-"}</td>
                <td className={`px-3 py-3 ${theme.cellSub}`}>{r.customerName ?? "-"}</td>
                <td className={`px-3 py-3 ${theme.cellSub}`}>{r.buzzName ?? "-"}</td>
                <td className={`px-3 py-3 ${theme.cellSub}`}>{r.fixedDate ?? "-"}</td>
                <td className={`px-3 py-3 text-right font-black ${r.amount < 0 ? "text-red-500" : theme.statTone.green}`}>{krw(r.amount)}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === "MP" ? theme.stageDone : theme.stageOn}`}>{r.status === "MP" ? "확정" : "예정"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
