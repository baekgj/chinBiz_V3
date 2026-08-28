import { krw } from "@/components/ui";
import { Card } from "@/components/partner/PartnerUI";

/** 파트너 대시보드 · 친비즈 본사 지급 수당 및 예치금 현황 (B2B Billing Hub) — docs/25 partner.docx */
export default function BillingSection() {
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
          <p className="mt-4 text-3xl font-black text-slate-900">{krw(18500000)}</p>
          <p className="mt-2 text-xs text-slate-500">현재 진행 중인 영업 건이 완결될 시 지급할 총액</p>
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
          <p className="mt-4 text-3xl font-black">{krw(7200000)}</p>
          <p className="mt-2 text-xs text-slate-400">구매확정 완료되어 친비즈 본사에 정산 지급할 금액</p>
        </div>
      </div>

      {/* 예치금 계좌 */}
      <Card title="파트너사 예치금 계좌 정보" sub="친비즈 본사 지급 수당 정산용 B2B 가상계좌">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">현재 정산 예치금 잔액</p>
            <p className="mt-1 text-2xl font-black text-sky-700">{krw(15000000)}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">✓ 안전 지표 (정산 여유 확보)</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">전용 가상계좌</p>
            <p className="mt-1 text-lg font-black text-slate-900">🏦 신한은행 110-xxx-xxxxxx</p>
            <p className="mt-1 text-xs text-slate-500">예금주 (주)친비즈</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700">↓ 예치금 충전하기</button>
          <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">⇄ 확정수당 자동차감 설정</button>
        </div>
        <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <a href="#" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">📄 월간 정산 명세서 세부 출력 <span className="text-slate-400">›</span></a>
          <a href="#" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">🧾 수당 세금계산서 발행 내역 확인 <span className="text-slate-400">›</span></a>
        </div>
      </Card>
    </div>
  );
}
