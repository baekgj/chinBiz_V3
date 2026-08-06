import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ProcessTabs from "@/components/landing/ProcessTabs";

export const metadata = { title: "업무 프로세스 · 친비즈(ChinBiz)" };

const E2E = [
  { step: "Step 1", title: "리드 발굴", who: "버즈회원", items: ["가망고객 발굴", "친비즈 앱으로 리드 간편 접수"] },
  { step: "Step 2", title: "현장 케어", who: "관리매니저", items: ["3단계 스마트 매칭(자동배정)", "현장실사 및 계약"] },
  { step: "Step 3", title: "이행 & 결제 검증", who: "파트너사 / CMS", items: ["하드웨어 시공 / 개통", "정기결제 / CMS 등록", "승인 증빙 업로드"] },
  { step: "Step 4", title: "MP 수당 정산", who: "친비즈 정산엔진", items: ["매월 CMS 출금 성공 검증", "CP(예정) → MP(확정) 승격", "버즈 / 센터별 수당 자동분배"] },
];

export default function ProcessPage() {
  return (
    <>
      <Header />
      {/* 히어로 */}
      <section className="relative overflow-hidden bg-forest-950 px-5 py-16 sm:py-20">
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-widest text-gold-300">CHINBIZ WORKFLOW</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
            연결부터 시공, 정산까지<br className="hidden sm:block" /> 하나의 시스템으로 완결되는 친비즈 워크플로우
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/80">복잡한 영업과 현장 관리를 가장 효율적인 분업 시스템으로 자동화했습니다.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[["3대 주체 협업", "버즈·매니저·파트너"], ["E2E 단계", "4단계 자동화"], ["예외 처리", "3종 안전장치"]].map(([k, v]) => (
              <span key={k} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-forest-100/80">{k} <span className="ml-1 font-bold text-gold-300">{v}</span></span>
            ))}
          </div>
        </div>
      </section>

      {/* E2E 종합 업무 절차 */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-gold-500">END-TO-END WORKFLOW</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">종합 업무 절차 (E2E)</h2>
          <p className="mt-2 text-sm text-muted">3대 주체(버즈 - 매니저 - 파트너사)가 플랫폼을 매개로 어떻게 유기적으로 협업하는지 한눈에 보여주는 4단계 종합 인포그래픽</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {E2E.map((s) => (
            <div key={s.step} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <span className="inline-block rounded-md bg-forest-800 px-2.5 py-1 text-xs font-bold text-white">{s.step}</span>
              <h3 className="mt-3 text-lg font-black text-ink">{s.title}</h3>
              <p className="text-xs font-semibold text-forest-600">({s.who})</p>
              <ul className="mt-2 space-y-1">
                {s.items.map((it) => <li key={it} className="text-xs leading-relaxed text-muted">· {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 주체별 상세 절차 (탭) */}
      <section className="bg-surface-2 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-ink">주체별 상세 프로세스</h2>
            <p className="mt-2 text-sm text-muted">버즈회원 · 관리매니저 · 파트너사 각 주체의 단계별 업무를 확인하세요.</p>
          </div>
          <ProcessTabs />
        </div>
      </section>

      <Footer />
    </>
  );
}
