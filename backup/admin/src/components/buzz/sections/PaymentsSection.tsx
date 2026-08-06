"use client";

import { useCallback, useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";

type Row = { fixedMonth?: string; gubun?: string; amount: number; paymentDate?: string; paymentFlag?: string };

const toYM = (v: string) => (v ? v.replace("-", "") : "");
const fmtMonth = (ym?: string) => (ym && ym.length === 6 ? `${ym.slice(0, 4)}-${ym.slice(4)}` : (ym ?? "-"));

/** 정산현황 — allowance_payment 검색·리스트 (대상월) */
export default function PaymentsSection() {
  const { theme, isManager } = useBuzz();
  const as = isManager ? "manager" : "buzz";
  const [monthInput, setMonthInput] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ as });
    if (q) p.set("month", q);
    const r = await apiGet<{ content: Row[] }>(`/api/buzz/payments?${p}`);
    if (r.ok && r.data) setRows(r.data.content ?? []);
    setLoading(false);
  }, [as, q]);
  useEffect(() => { load(); }, [load]);

  const selCls = `rounded-lg border px-3 py-2 text-sm outline-none ${theme.input}`;

  return (
    <Card title="정산현황" sub="정산(allowance_payment) 지급 원장 검색">
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>대상월</p>
          <input type="month" className={selCls} value={monthInput} onChange={(e) => setMonthInput(e.target.value)} />
        </div>
        <button onClick={() => setQ(toYM(monthInput))} className={`rounded-lg px-4 py-2 text-sm font-bold ${theme.primaryBtn}`}>검색</button>
        <button onClick={() => { setMonthInput(""); setQ(""); }} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${theme.tableWrap} ${theme.cellSub}`}>초기화</button>
      </div>

      <div className={`overflow-x-auto rounded-xl border ${theme.tableWrap}`}>
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className={`text-xs ${theme.thead}`}>
              <th className="px-4 py-3 text-left font-semibold">대상월</th>
              <th className="px-4 py-3 text-left font-semibold">구분</th>
              <th className="px-4 py-3 text-right font-semibold">정산금액</th>
              <th className="px-4 py-3 text-left font-semibold">지급일자</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.divide}`}>
            {loading ? (
              <tr><td colSpan={4} className={`px-4 py-10 text-center ${theme.note}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className={`px-4 py-10 text-center ${theme.note}`}>정산 내역이 없습니다.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className={theme.rowHover}>
                <td className={`px-4 py-3 font-semibold ${theme.cellMain}`}>{fmtMonth(r.fixedMonth)}</td>
                <td className={`px-4 py-3 ${theme.cellSub}`}>{r.gubun ?? "-"}</td>
                <td className={`px-4 py-3 text-right font-black ${theme.statTone.green}`}>{krw(r.amount)}</td>
                <td className={`px-4 py-3 ${theme.cellSub}`}>{r.paymentDate ?? (r.paymentFlag === "Y" ? "-" : "미지급")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
