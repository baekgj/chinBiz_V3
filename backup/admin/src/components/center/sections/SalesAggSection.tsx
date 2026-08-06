"use client";

import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card, ct } from "@/components/center/CenterUI";
import { apiGet } from "@/lib/api";

type Row = {
  productId: number; productName: string; categoryName?: string; partnerName?: string;
  actorCount: number; cases: number; completed: number; centerReward: number;
};

/** 센터 1차/2차 영업 상품별 합산 — scope=buzz(소속 버즈 1차) | manager(소속 매니저 2차) */
export default function SalesAggSection({ scope }: { scope: "buzz" | "manager" }) {
  const isBuzz = scope === "buzz";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<{ content: Row[] }>(`/api/center/sales/${scope}`).then((r) => {
      if (r.ok && r.data) setRows(r.data.content ?? []);
      setLoading(false);
    });
  }, [scope]);

  const totalCases = rows.reduce((s, r) => s + r.cases, 0);
  const actorLabel = isBuzz ? "버즈회원" : "관리매니저";
  const rewardLabel = isBuzz ? "센터 배정 소속수당(건당)" : "센터 배정 관리수당(건당)";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={`rounded-2xl p-5 shadow-sm ${ct.cpCard}`}>
          <p className="text-xs font-semibold text-amber-200/70">{isBuzz ? "1차 영업" : "2차 영업"} 상품 종류</p>
          <p className="mt-2 text-3xl font-black text-amber-300">{rows.length}<span className="ml-1 text-base">종</span></p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ${ct.cpCard}`}>
          <p className="text-xs font-semibold text-amber-200/70">{isBuzz ? "1차 영업" : "2차 영업"} 총 건수</p>
          <p className="mt-2 text-3xl font-black text-amber-300">{totalCases}<span className="ml-1 text-base">건</span></p>
        </div>
      </div>

      <Card title={`${isBuzz ? "1차" : "2차"} 영업 상품별 ${actorLabel} 합산 현황`} sub={isBuzz ? "소속 버즈회원(sales_center_id)의 1차 영업" : "소속 관리매니저(manager_center_id)의 2차 영업"}>
        <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className={`text-xs ${ct.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">카테고리</th>
                <th className="px-4 py-3 text-left font-semibold">상품명 (공급 파트너사)</th>
                <th className="px-4 py-3 text-right font-semibold">활동 {actorLabel} 수</th>
                <th className="px-4 py-3 text-right font-semibold">접수 건수</th>
                <th className="px-4 py-3 text-right font-semibold">완료 건수</th>
                <th className="px-4 py-3 text-right font-semibold">{rewardLabel}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${ct.divide}`}>
              {loading ? (
                <tr><td colSpan={6} className={`px-4 py-10 text-center ${ct.note}`}>불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className={`px-4 py-10 text-center ${ct.note}`}>{isBuzz ? "소속 버즈회원의 1차 영업" : "소속 매니저의 2차 영업"} 내역이 없습니다.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.productId} className={ct.rowHover}>
                  <td className="px-4 py-3">{r.categoryName ? <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ct.badge}`}>{r.categoryName}</span> : <span className={ct.note}>-</span>}</td>
                  <td className="px-4 py-3"><p className={`font-bold ${ct.cellMain}`}>{r.productName}</p><p className={`text-xs ${ct.cellSub}`}>{r.partnerName ?? "-"}</p></td>
                  <td className={`px-4 py-3 text-right ${ct.cellSub}`}>{r.actorCount} 명</td>
                  <td className={`px-4 py-3 text-right font-semibold ${ct.cellMain}`}>{r.cases} 건</td>
                  <td className={`px-4 py-3 text-right font-semibold text-emerald-400`}>{r.completed} 건</td>
                  <td className={`px-4 py-3 text-right font-black ${ct.statTone.gold}`}>{krw(r.centerReward)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
