"use client";

import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card } from "@/components/partner/PartnerUI";
import { apiGet } from "@/lib/api";

type Row = {
  saleId: number; orderNo?: string; productName?: string; customerName?: string;
  salePrice: number; totalAllowance: number; status: string; confirmedAt?: string; createdAt?: string;
};
type Resp = { content: Row[]; totalAllowance: number; count: number };

/** 파트너 정산 원장 — 내 상품의 '구매확정' 판매건 + 상품 총수당(total_allowance) */
export default function LedgerSection() {
  const [data, setData] = useState<Resp>({ content: [], totalAllowance: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Resp>("/api/partner/settlement/ledger").then((r) => {
      if (r.ok && r.data) setData(r.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">구매확정 정산 건수</p>
          <p className="mt-2 text-3xl font-black text-sky-600">{data.count}<span className="ml-1 text-base">건</span></p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">지급 총수당 합계 (구매확정)</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">{krw(data.totalAllowance)}</p>
        </div>
      </div>

      <Card title="정산 원장" sub="내 상품의 구매확정 판매건별 총수당(위탁비) 내역">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <th className="px-3 py-3 text-left font-semibold">구매확정일</th>
                <th className="px-3 py-3 text-left font-semibold">주문번호</th>
                <th className="px-3 py-3 text-left font-semibold">상품명</th>
                <th className="px-3 py-3 text-left font-semibold">고객(상호명)</th>
                <th className="px-3 py-3 text-right font-semibold">판매가</th>
                <th className="px-3 py-3 text-center font-semibold">상태</th>
                <th className="px-3 py-3 text-right font-semibold">총수당(위탁비)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">불러오는 중…</td></tr>
              ) : data.content.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">구매확정된 정산 내역이 없습니다.</td></tr>
              ) : data.content.map((r) => (
                <tr key={r.saleId} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-500">{r.confirmedAt ?? r.createdAt ?? "-"}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{r.orderNo ?? "-"}</td>
                  <td className="px-3 py-3 font-semibold text-slate-800">{r.productName ?? "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{r.customerName ?? "-"}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{krw(r.salePrice)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{r.status}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-black text-slate-800">{krw(r.totalAllowance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
