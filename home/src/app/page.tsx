import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import NoticeTicker from "@/components/landing/NoticeTicker";
import Stats from "@/components/landing/Stats";
import PartnerInquiry from "@/components/landing/PartnerInquiry";
import ProductShowcase from "@/components/landing/ProductShowcase";
import PartnerStats from "@/components/landing/PartnerStats";

/* ── 데이터 (CLAUDE.md §11) ── */
const SERVICES = [
  {
    no: "01",
    en: "PRODUCT CURATION",
    title: "상품 큐레이션",
    desc: "검증된 파트너사의 우수 상품만 엄선해 버즈회원에게 제공합니다.",
  },
  {
    no: "02",
    en: "SALES AUTOMATION",
    title: "영업 자동화",
    desc: "클릭 몇 번으로 끝나는 1차 영업. 링크·제안서·성과 추적을 자동화합니다.",
  },
  {
    no: "03",
    en: "PARTNERSHIP MATCHING",
    title: "파트너십 매칭",
    desc: "지역·기술 기반으로 고객과 전문 관리매니저를 실시간 매칭합니다.",
  },
  {
    no: "04",
    en: "TRANSPARENT SETTLEMENT",
    title: "투명한 정산",
    desc: "7단계 분배 매트릭스로 성과를 원 단위까지 투명하게 정산합니다.",
  },
];

const STEPS3 = [
  {
    no: "01",
    tag: "PICK",
    title: "상품 파악하기",
    desc: "친비즈가 엄선한 파트너사의 상품 개요와 대상 고객(타겟)을 확인합니다.",
    icon: (
      <path d="M11 4a7 7 0 105.2 11.7L21 20m-2.8-9A7 7 0 0011 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
  },
  {
    no: "02",
    tag: "CONNECT",
    title: "1차 영업 진행",
    desc: "복잡한 계약 없이, 내 주변 인프라나 타겟 고객에게 상품을 소개하고 1차 링크를 전달합니다.",
    icon: (
      <path d="M9 15l6-6M8.5 8.5l-1.8 1.8a3.5 3.5 0 105 5l1.8-1.8m-3-9 1.8-1.8a3.5 3.5 0 115 5l-1.8 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
  },
  {
    no: "03",
    tag: "EARN",
    title: "매칭 및 정산",
    desc: "계약이 최종 성사되면, 투명한 ERP 시스템을 통해 확정된 버즈 수당을 정산받습니다.",
    icon: (
      <path d="M12 3v18M8 7h5.5a2.5 2.5 0 010 5H8m0 0h6.5a2.5 2.5 0 010 5H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

const PROCESS = [
  { step: "STEP 01", title: "가입 / 로그인", items: ["간편 회원가입", "계정 승인 완료"] },
  { step: "STEP 02", title: "상품 셀렉션", items: ["타겟 / 개요 분석", "마케팅 자료 다운"] },
  { step: "STEP 03", title: "1차 영업 실행", items: ["전용 링크 발송", "대면 / 비대면 소개"] },
  { step: "STEP 04", title: "파트너사 본영업", items: ["파트너사 전담팀", "계약 및 사후 관리"] },
  { step: "STEP 05", title: "실시간 정산", items: ["투명한 정산 데이터", "ERP 시스템 확인"] },
];

const TOOLKIT = [
  { title: "카카오톡 공유 문구 템플릿", desc: "상품별 최적화된 메시지 템플릿으로 간편하게 공유" },
  { title: "상품 제안서 PDF 다운로드", desc: "전문적인 제안서를 원클릭으로 생성 및 발송" },
  { title: "개인 전용 영업 추천 링크", desc: "나만의 추천 URL로 정확한 성과 추적 가능" },
];

export default function Home() {
  return (
    <>
      <Header />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-forest-900 text-white">
          <div className="absolute inset-0 grid-pattern opacity-60" />
          <div className="animate-blob absolute -left-24 top-10 h-72 w-72 rounded-full bg-forest-500/30 blur-3xl" />
          <div className="animate-blob absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 sm:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-bold tracking-[0.15em] text-gold-300">
                KOREA&apos;S FIRST BUZZ MARKETING SOLUTION
              </span>
              <h1 className="mt-6 text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl">
                내 네트워크가 곧
                <br />
                <span className="text-gold-gradient">비즈니스</span>가 된다
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-forest-100/85 sm:text-lg">
                대한민국 최초의 버즈마케팅 영업대행 솔루션, 친비즈.
                <br className="hidden sm:block" />
                손쉬운 1차 영업 파트너십으로 준비된 우수 비즈니스 상품을 연결하고 함께 성장하세요.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="w-full rounded-xl bg-gold-400 px-7 py-3.5 text-center font-bold text-forest-900 shadow-lg shadow-gold-500/20 transition-all hover:bg-gold-300 hover:shadow-xl sm:w-auto"
                >
                  지금 바로 버즈회원 시작하기
                </Link>
                <a
                  href="#market"
                  className="w-full rounded-xl border border-white/25 bg-white/5 px-7 py-3.5 text-center font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:w-auto"
                >
                  영업 가능 상품 보러가기 ↓
                </a>
              </div>
            </div>

            <div className="mx-auto mt-14 max-w-2xl">
              <NoticeTicker />
            </div>
          </div>
        </section>

        {/* ── Stats band ── */}
        <section className="border-y border-forest-800 bg-forest-800">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <Stats />
          </div>
        </section>

        {/* ── Service Matrix ── */}
        <section id="service" className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <SectionHead en="SERVICE MATRIX" title="핵심 서비스 역량" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <div
                key={s.no}
                className="group relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-6 transition-all hover:-translate-y-1 hover:border-forest-300 hover:shadow-lg"
              >
                <span className="text-5xl font-black text-forest-100 transition-colors group-hover:text-forest-200">
                  {s.no}
                </span>
                <p className="mt-4 text-[11px] font-bold tracking-widest text-gold-500">{s.en}</p>
                <h3 className="mt-1.5 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Product Showcase ── */}
        <section id="market" className="bg-surface-2 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead en="MAIN SHOWCASE" title="지금 바로 영업 가능한 파트너사 대표 상품" />

            {/* 전체상품보기 → 상품리스트 페이지 */}
            <div className="mt-2 flex justify-end">
              <Link href="/products" className="inline-flex items-center gap-1 text-sm font-bold text-forest-700 hover:text-forest-900">
                전체상품보기 <span aria-hidden>→</span>
              </Link>
            </div>

            <ProductShowcase />

            {/* Guardrail */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-dashed border-line bg-white px-5 py-4 text-center text-sm text-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold-500" fill="none">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              정확한 공급 단가, 마진율 및 버즈 수당(인센티브) 정보는
              <span className="font-semibold text-ink">계정 로그인 후</span> 확인하실 수 있습니다.
            </div>
          </div>
        </section>

        {/* ── 3-Step (Pick / Connect / Earn) ── */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <SectionHead en="BUZZ MEMBER" title="친비즈에서 버즈회원은 어떤 일을 하나요?" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS3.map((s, i) => (
              <div key={s.no} className="relative rounded-2xl border border-line bg-surface-2 p-7">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-forest-100">{s.no}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest-600 text-gold-300">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      {s.icon}
                    </svg>
                  </span>
                </div>
                <p className="mt-5 text-xs font-bold tracking-widest text-gold-500">{s.tag}</p>
                <h3 className="mt-1 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                {i < STEPS3.length - 1 && (
                  <span className="absolute -right-3.5 top-1/2 hidden -translate-y-1/2 text-2xl text-forest-200 md:block">
                    ›
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Process 5-step ── */}
        <section id="process" className="bg-forest-900 py-20 text-white sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHead en="BUSINESS PROCESS" title="영업대행 업무 프로세스 안내" light />
            <p className="mt-3 text-center text-sm text-forest-100/70">
              투명한 프로세스와 ERP 시스템으로 모든 단계를 실시간으로 확인할 수 있습니다.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {PROCESS.map((p) => (
                <div
                  key={p.step}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <p className="text-xs font-bold tracking-widest text-gold-300">{p.step}</p>
                  <h3 className="mt-2 text-base font-bold text-white">{p.title}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-center gap-1.5 text-sm text-forest-100/75">
                        <span className="h-1 w-1 rounded-full bg-gold-400" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sales Toolkit (blurred) ── */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHead en="SALES TOOLKIT" title="초보자도 가능합니다" align="left" />
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
                클릭 한 번으로 끝나는 영업 툴킷. 버즈 회원이 로그인하면 바로 사용할 수 있는 전문 영업
                도구들을 제공합니다.
              </p>
              <ul className="mt-8 space-y-4">
                {TOOLKIT.map((t) => (
                  <li key={t.title} className="flex gap-4">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-forest-50 text-forest-600">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <h4 className="font-bold text-ink">{t.title}</h4>
                      <p className="text-sm text-muted">{t.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* blurred preview / lock */}
            <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-forest-800 to-forest-950 p-8">
              <div className="grid-pattern absolute inset-0 opacity-40" />
              <div className="relative space-y-3 blur-[3px]" aria-hidden>
                {["카카오톡 공유 문구 · 매장 자동화 AI 청기 시스템", "상품 제안서_2026.pdf · 12.4MB", "https://chinbiz.com/join?ref=buzz_hong123"].map(
                  (line) => (
                    <div key={line} className="rounded-xl bg-white/10 px-4 py-4 text-sm text-white">
                      {line}
                    </div>
                  ),
                )}
                <div className="rounded-xl bg-white/10 px-4 py-8" />
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-2xl bg-forest-900/70 px-6 py-5 text-center backdrop-blur-sm">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-gold-400 text-forest-900">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                  <p className="mt-3 font-bold text-white">로그인 후 확인 가능</p>
                  <Link
                    href="/signup"
                    className="mt-3 inline-block rounded-lg bg-gold-400 px-5 py-2 text-sm font-bold text-forest-900 hover:bg-gold-300"
                  >
                    무료 회원가입
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Partner onboarding ── */}
        <section id="partner" className="mx-auto max-w-6xl px-5 pb-20 sm:pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-forest-700 px-8 py-12 sm:px-14 sm:py-14">
            <div className="animate-blob absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gold-500/15 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold tracking-widest text-gold-300">PARTNER ONBOARDING</p>
                <h2 className="mt-3 text-2xl font-black leading-snug text-white sm:text-3xl">
                  제품은 좋은데
                  <br />
                  판로가 고민이신가요?
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-forest-100/85">
                  수천 명의 준비된 버즈 회원들이 당신의 상품을 대신 영업해 드립니다. 초기 마케팅 비용
                  리스크 없이, 성공 수당 기반의 강력한 버즈 영업망을 구축하세요.
                </p>
                <a
                  href="#inquiry"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-bold text-forest-900 transition-colors hover:bg-gold-300"
                >
                  파트너사 입점 및 제안하기 <span aria-hidden>→</span>
                </a>
              </div>
              <PartnerStats />
            </div>
          </div>
        </section>

        {/* ── Strategic Inquiry + Dedicated Consultant ── */}
        <PartnerInquiry />
      </main>

      <Footer />
    </>
  );
}

function SectionHead({
  en,
  title,
  align = "center",
  light = false,
}: {
  en: string;
  title: string;
  align?: "center" | "left";
  light?: boolean;
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <p className="text-xs font-bold tracking-widest text-gold-500">{en}</p>
      <h2
        className={`mt-2 text-2xl font-black tracking-tight sm:text-3xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}
