import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import PartnerApply from "@/components/landing/PartnerApply";

export const metadata = { title: "파트너사 입점신청 · 친비즈(ChinBiz)" };

const FEATURES = [
  { icon: "🕸️", title: "전국 단위 영업 조직망", desc: "가망고객을 끊임없이 연결하는 전국 버즈회원 네트워크 즉시 확보" },
  { icon: "🔧", title: "현장 완결형 관리 매니저", desc: "제품 실사, 설치/시공, 현장 계약, CS를 전담하는 매니저 매칭" },
  { icon: "💳", title: "투명한 자동 정산", desc: "CMS 정기 결제 및 출금 결과 연동을 통한 깔끔한 정산 및 미수금 차단" },
];

const STEPS = [
  { step: "Step 1", title: "제안 접수", items: ["온라인 입점 신청 폼 작성 및 제출 (사업자/제안서)"] },
  { step: "Step 2", title: "입점 심사", items: ["상품성 및 영업 적합성 검토 (담당 MD 지정)"] },
  { step: "Step 3", title: "계약 & 수당 체계", items: ["CP/MP 수당 산정", "파트너 어드민 계정 부여", "CMS/API 연동 협의"] },
  { step: "Step 4", title: "상품 런칭 & 영업", items: ["친비즈 App 상품 등록", "전국 버즈/매니저 프로모션 및 영업 시작"] },
];

export default async function PartnerApplyPage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const { stage } = await searchParams;
  return (
    <>
      <Header />
      {/* 히어로 */}
      <section className="relative overflow-hidden bg-forest-950 px-5 py-16 sm:py-20">
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-widest text-gold-300">PARTNER ONBOARDING</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
            전국 버즈 영업망과 전문 현장 매니저가<br className="hidden sm:block" /> 귀사의 제품을 판매해 드립니다.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/80">초기 마케팅 비용 0원! 친비즈 플랫폼과 함께 폭발적인 B2B/B2C 수주 실적을 만들어가세요.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {FEATURES.map((c) => (
              <div key={c.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="text-2xl">{c.icon}</span>
                <h3 className="mt-2 font-bold text-white">{c.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-forest-100/70">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4단계 입점 프로세스 */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-gold-500">4-STEP ONBOARDING</p>
          <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">입점 프로세스 안내 (4단계)</h2>
          <p className="mt-2 text-sm text-muted">입점 신청 후 승인까지의 구체적인 절차를 미리 보여드립니다.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.step} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <span className="inline-block rounded-md bg-forest-800 px-2.5 py-1 text-xs font-bold text-white">{s.step}</span>
              <h3 className="mt-3 text-lg font-black text-ink">{s.title}</h3>
              <ul className="mt-2 space-y-1">
                {s.items.map((it) => <li key={it} className="text-xs leading-relaxed text-muted">· {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 입점 신청 폼 */}
      <section className="bg-surface-2 py-14">
        <div className="mx-auto max-w-4xl px-5">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black text-ink">입점 제안 신청서</h2>
            <p className="mt-2 text-sm text-muted">아래 정보를 입력해 주시면 담당 MD가 검토 후 연락드립니다.</p>
          </div>
          <PartnerApply initialStage={stage} />
        </div>
      </section>

      <Footer />
    </>
  );
}
