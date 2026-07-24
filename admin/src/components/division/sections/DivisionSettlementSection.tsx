"use client";

import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card, dv } from "@/components/division/DivisionUI";
import { apiGet } from "@/lib/api";

type Row = {
  seq: number; type: string; orderNo?: string; productName?: string;
  amount: number; status: string; contractDate?: string; confirmDate?: string; paid: boolean; createdAt?: string;
};
type Resp = { content: Row[]; cpTotal: number; mpTotal: number };

const TYPE_LABEL: Record<string, string> = { ORDER: "발생", CANCEL: "취소(-)", CANCEL_FEE: "보전(+)" };

/** 본부 정산현황 소메뉴 — scope=ledger(정산원장) | payouts(수당지급현황) */
export default function DivisionSettlementSection({ scope }: { scope: "ledger" | "payouts" }) {
  const [data, setData] = useState<Resp>({ content: [], cpTotal: 0, mpTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<Resp>(`/api/division/settlement?scope=${scope}`).then((r) => {
      if (r.ok && r.data) setData(r.data);
      setLoading(false);
    });
  }, [scope]);

  const payoutMode = scope === "payouts";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!payoutMode && (
          <div className={`rounded-2xl p-5 shadow-sm ${dv.cpCard}`}>
            <p className="text-xs font-semibold text-violet-200">CP 예정수당 합계 (본부)</p>
            <p className="mt-2 text-3xl font-black">{krw(data.cpTotal)}</p>
          </div>
        )}
        <div className={`rounded-2xl p-5 shadow-sm ${dv.mpCard}`}>
          <p className="text-xs font-bold">MP 확정수당 합계 (본부)</p>
          <p className="mt-2 text-3xl font-black">{krw(data.mpTotal)}</p>
        </div>
      </div>

      <Card title={payoutMode ? "수당지급 현황" : "본부 정산 원장 (Insert-Only)"}
            sub="한 번 기록된 전표는 수정/삭제하지 않고 (−)전표로 상쇄">
        <div className={`overflow-x-auto rounded-xl border ${dv.tableWrap}`}>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className={`text-xs ${dv.thead}`}>
                <th className="px-3 py-3 text-left font-semibold">등록일</th>
                <th className="px-3 py-3 text-left font-semibold">주문번호</th>
                <th className="px-3 py-3 text-left font-semibold">상품명</th>
                <th className="px-3 py-3 text-center font-semibold">전표</th>
                <th className="px-3 py-3 text-center font-semibold">계정</th>
                <th className="px-3 py-3 text-right font-semibold">본부 배정액</th>
                {payoutMode && <th className="px-3 py-3 text-center font-semibold">지급</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${dv.divide}`}>
              {loading ? (
                <tr><td colSpan={payoutMode ? 7 : 6} className={`px-4 py-10 text-center ${dv.note}`}>불러오는 중…</td></tr>
              ) : data.content.length === 0 ? (
                <tr><td colSpan={payoutMode ? 7 : 6} className={`px-4 py-10 text-center ${dv.note}`}>정산 내역이 없습니다.</td></tr>
              ) : data.content.map((r) => (
                <tr key={r.seq} className={dv.rowHover}>
                  <td className={`px-3 py-3 ${dv.cellSub}`}>{r.createdAt ?? "-"}</td>
                  <td className={`px-3 py-3 font-mono text-xs ${dv.cellSub}`}>{r.orderNo ?? "-"}</td>
                  <td className={`px-3 py-3 font-semibold ${dv.cellMain}`}>{r.productName ?? "-"}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.type === "CANCEL" ? "bg-red-500/20 text-red-300" : dv.badge}`}>{TYPE_LABEL[r.type] ?? r.type}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === "MP" ? "bg-emerald-500/20 text-emerald-300" : "bg-violet-500/20 text-violet-300"}`}>{r.status}</span>
                  </td>
                  <td className={`px-3 py-3 text-right font-black ${r.amount < 0 ? "text-red-300" : dv.statTone.emerald}`}>{krw(r.amount)}</td>
                  {payoutMode && <td className="px-3 py-3 text-center text-xs">{r.paid ? <span className="font-bold text-emerald-300">지급완료</span> : <span className={dv.note}>미지급</span>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
