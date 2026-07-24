import { krw } from "@/components/ui";
import { Card } from "@/components/partner/PartnerUI";

/** 파트너 · 정산/수당 현황 (B2B Billing Hub) */
export default function BillingSection() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-sky-50/90">CP · 본사 지급 예정수당</p>
          <p className="mt-2 text-3xl font-black">{krw(18500000)}</p>
          <p className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">진행 중 영업 완결 시 지급 예정</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">MP · 본사 지급 확정수당</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{krw(7200000)}</p>
          <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">정산 대상 (예치금에서 차감)</p>
        </div>
      </div>

      <Card title="파트너사 예치금 계좌 (Billing Hub)" sub="친비즈 본사 지급 수당 정산용 B2B 가상계좌">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">현재 정산 예치금 잔액</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{krw(15000000)}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">● 안전 지표 (정산 여유 확보)</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">전용 가상계좌</p>
            <p className="mt-1 text-lg font-black text-slate-900">신한은행 110-xxx-xxxxxx</p>
            <p className="mt-1 text-xs text-slate-500">예금주 (주)친비즈</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700">↓ 예치금 충전하기</button>
          <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">확정수당 자동차감 설정</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-sky-700">
          <a href="#" className="font-semibold hover:underline">📄 월간 정산 명세서 출력</a>
          <a href="#" className="font-semibold hover:underline">🧾 수당 세금계산서 발행 내역</a>
        </div>
      </Card>
    </div>
  );
}
