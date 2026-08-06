"use client";

import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card, ct } from "@/components/center/CenterUI";
import { apiGet } from "@/lib/api";

type Row = {
  seq: number; type: string; orderNo?: string; productName?: string; memberType?: string;
  amount: number; status: string; contractDate?: string; confirmDate?: string; paid: boolean; createdAt?: string;
};
type Resp = { content: Row[]; cpTotal: number; mpTotal: number };

const MT_LABEL: Record<string, string> = { BUZZ_CENTER: "버즈(소속)", MANAGER_CENTER: "매니저(관리)" };
const TYPE_LABEL: Record<string, string> = { ORDER: "발생", CANCEL: "취소(-)", CANCEL_FEE: "보전(+)" };

/** 센터 정산 원장 소메뉴 — scope=buzz | manager | payouts */
export default function CenterSettlementSection({ scope }: { scope: "buzz" | "manager" | "payouts" }) {
  const [data, setData] = useState<Resp>({ content: [], cpTotal: 0, mpTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<Resp>(`/api/center/settlement?scope=${scope}`).then((r) => {
      if (r.ok && r.data) setData(r.data);
      setLoading(false);
    });
  }, [scope]);

  const payoutMode = scope === "payouts";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!payoutMode && (
          <div className={`rounded-2xl p-5 shadow-sm ${ct.cpCard}`}>
            <p className="text-xs font-semibold text-amber-200/70">CP 예정수당 합계</p>
            <p className="mt-2 text-3xl font-black text-amber-300">{krw(data.cpTotal)}</p>
          </div>
        )}
        <div className={`rounded-2xl p-5 shadow-sm ${ct.mpCard}`}>
          <p className="text-xs font-bold">MP 확정수당 합계</p>
          <p className="mt-2 text-3xl font-black">{krw(data.mpTotal)}</p>
        </div>
      </div>

      <Card title={payoutMode ? "수당지급 현황" : scope === "manager" ? "관리매니저 영업 정산현황" : "버즈회원 영업 정산현황"}
            sub="센터 배정 전표 원장 (Insert-Only)">
        <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className={`text-xs ${ct.thead}`}>
                <th className="px-3 py-3 text-left font-semibold">등록일</th>
                <th className="px-3 py-3 text-left font-semibold">주문번호</th>
                <th className="px-3 py-3 text-left font-semibold">상품명</th>
                <th className="px-3 py-3 text-center font-semibold">구분</th>
                <th className="px-3 py-3 text-center font-semibold">전표</th>
                <th className="px-3 py-3 text-center font-semibold">계정</th>
                <th className="px-3 py-3 text-right font-semibold">금액</th>
                {payoutMode && <th className="px-3 py-3 text-center font-semibold">지급</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${ct.divide}`}>
              {loading ? (
                <tr><td colSpan={payoutMode ? 8 : 7} className={`px-4 py-10 text-center ${ct.note}`}>불러오는 중…</td></tr>
              ) : data.content.length === 0 ? (
                <tr><td colSpan={payoutMode ? 8 : 7} className={`px-4 py-10 text-center ${ct.note}`}>정산 내역이 없습니다.</td></tr>
              ) : data.content.map((r) => (
                <tr key={r.seq} className={ct.rowHover}>
                  <td className={`px-3 py-3 ${ct.cellSub}`}>{r.createdAt ?? "-"}</td>
                  <td className={`px-3 py-3 font-mono text-xs ${ct.cellSub}`}>{r.orderNo ?? "-"}</td>
                  <td className={`px-3 py-3 font-semibold ${ct.cellMain}`}>{r.productName ?? "-"}</td>
                  <td className={`px-3 py-3 text-center ${ct.cellSub}`}>{MT_LABEL[r.memberType ?? ""] ?? r.memberType}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.type === "CANCEL" ? "bg-red-500/20 text-red-400" : ct.badge}`}>{TYPE_LABEL[r.type] ?? r.type}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === "MP" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}>{r.status}</span>
                  </td>
                  <td className={`px-3 py-3 text-right font-black ${r.amount < 0 ? "text-red-400" : ct.statTone.gold}`}>{krw(r.amount)}</td>
                  {payoutMode && <td className="px-3 py-3 text-center text-xs">{r.paid ? <span className="font-bold text-emerald-400">지급완료</span> : <span className={ct.note}>미지급</span>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
