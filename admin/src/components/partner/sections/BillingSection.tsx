"use client";

import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { apiGet } from "@/lib/api";

/** 파트너 · 친비즈 본사 지급 수당 (B2B Billing Hub) — docs/25 partner.docx
 *  CP/MP 실데이터(docs/34): sale·partner_order 의 주문접수(CP) / 입금완료(MP) 상품금액 합계. 예치금 계좌 섹션 삭제 */
export default function BillingSection() {
  const [sum, setSum] = useState<{ cp: number; mp: number } | null>(null);
  useEffect(() => {
    // 실패 응답도 data(에러 본문)가 채워지므로 r.ok 일 때만 반영 + 숫자 보정 (미배포 BE 404 시 krw(undefined) 런타임 오류 방지)
    apiGet<{ cp?: number; mp?: number }>("/api/partner/billing").then((r) => {
      if (r.ok && r.data) setSum({ cp: Number(r.data.cp ?? 0), mp: Number(r.data.mp ?? 0) });
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* 실시간 Billing 연동 배지 */}
      <div className="flex justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> 실시간 Billing 연동
        </span>
      </div>

      {/* CP 예정 / MP 확정 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-100 text-sky-600">🕐</span>
              <div>
                <p className="text-sm font-bold text-slate-700">CP · 본사 지급 예정수당</p>
                <p className="text-xs font-semibold text-slate-400">Current Progress</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700">● 진행 중</span>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-900">{sum ? krw(sum.cp) : "—"}</p>
          <p className="mt-2 text-xs text-slate-500">주문접수 상태 주문의 상품금액 합계 (입금 완료 시 MP 전환)</p>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-sky-300">✓</span>
              <div>
                <p className="text-sm font-bold text-white">MP · 본사 지급 확정수당</p>
                <p className="text-xs font-semibold text-slate-400">Master Paid</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-emerald-300">✓ 정산 대상</span>
          </div>
          <p className="mt-4 text-3xl font-black">{sum ? krw(sum.mp) : "—"}</p>
          <p className="mt-2 text-xs text-slate-400">입금완료 상태 주문의 상품금액 합계</p>
        </div>
      </div>

    </div>
  );
}
