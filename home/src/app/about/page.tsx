import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

export const metadata = { title: "친비즈 소개 · 친비즈(ChinBiz)" };

const ROLES = [
  { icon: "👥", tag: "1차 버즈회원", title: "강력한 네트워크", desc: "인적 네트워크로 영업 리드를 발굴하고 연결" },
  { icon: "🔧", tag: "2차 관리매니저", title: "현장 시공·관리", desc: "검증된 전문가가 실사, 시공, AS를 책임" },
  { icon: "🏢", tag: "파트너사", title: "좋은 상품 공급", desc: "수익성 검증 상품을 공급하고 수당 설계" },
];

const VALUES = [
  { icon: "✨", title: "초기 비용 0원", desc: "누구나 자신의 인적 네트워크를 활용해 영업 리드를 연결하고 수익을 창출합니다. 가입비·재고 부담이 없습니다." },
  { icon: "🛡️", title: "전문 분업화 시스템", desc: "버즈회원은 '소개'에만 집중하세요. 현장 실사와 시공, 사후 관리(AS)는 친비즈 검증 매니저가 책임집니다." },
  { icon: "🔁", title: "안정적인 정기 수익 구조", desc: "1회성 수당을 넘어 매월 쌓이는 파이프라인 정기 수당을 제공합니다." },
];

const MGR_STATS = [["247", "시공 완료"], ["4.9", "평균 만족도"], ["2.1h", "AS 응답"]];
const MGR_POINTS = [
  { icon: "⛑️", title: "현장 실사 & 시공 책임제", desc: "전기, 배관, 공간 제약 등 설치 하드웨어 상품의 사전 실사와 시운전을 책임집니다." },
  { icon: "📍", title: "센터 기반 관리", desc: "지역 거점 센터와 관리 매니저가 결합하여 매장주/기업고객의 CS 및 AS를 지속적으로 케어합니다." },
  { icon: "↔️", title: "역할 분리로 효율 극대화", desc: "버즈회원은 '발굴'에, 관리 매니저는 '완성'에 집중하여 성공률을 극대화합니다." },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      {/* 히어로 */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
        <p className="text-xs font-bold tracking-widest text-gold-500">ABOUT CHIN-BIZ</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">
          연결하는 플랫폼,<br /> 함께 성장하는 비즈니스
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          친비즈는 &ldquo;좋은 상품을 가진 파트너사&rdquo;, &ldquo;강력한 네트워크를 가진 1차 버즈회원&rdquo;, 그리고 &ldquo;현장 시공 및 관리를 전담하는 2차 관리매니저&rdquo;를 유기적으로 연결하는 <b className="text-forest-700">공생형 B2B/B2C 영업 생태계</b>입니다.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{r.icon}</span>
                <span className="text-xs font-semibold text-muted">{r.tag}</span>
              </div>
              <h3 className="mt-3 text-lg font-black text-ink">{r.title}</h3>
              <p className="mt-1 text-sm text-muted">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 핵심 가치 (다크) */}
      <section className="bg-forest-950 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-black text-white sm:text-3xl">친비즈가 특별한 이유</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="text-2xl">{v.icon}</span>
                <h3 className="mt-3 text-lg font-black text-white">{v.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-forest-100/75">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2차 관리 매니저 시스템 */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="rounded-3xl bg-forest-950 p-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-400 text-forest-900">🔧</span>
                <div>
                  <p className="font-black text-white">관리 매니저 · 김현장</p>
                  <p className="text-xs text-forest-100/70">서울 강남 센터 · 등급 A+</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {MGR_STATS.map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-white/5 py-4 text-center">
                    <p className="text-xl font-black text-white">{v}</p>
                    <p className="mt-0.5 text-[11px] text-forest-100/70">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["기술 검증 완료", "지역 센터 소속", "AS 책임 관리"].map((b) => (
                  <span key={b} className="rounded-lg border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 text-xs font-semibold text-gold-200">✓ {b}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-gold-500">PARTNERSHIP &amp; FIELD MANAGER</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-ink sm:text-3xl">현장 완결력을 높이는<br /> 2차 관리 매니저 시스템</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">영업의 완성은 현장에 있습니다. 친비즈는 단순한 정보 전달에 그치지 않고 전문 검증을 거친 <b className="text-forest-700">관리 매니저</b>를 현장에 투입합니다.</p>
            <div className="mt-6 space-y-4">
              {MGR_POINTS.map((p) => (
                <div key={p.title} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-50 text-lg">{p.icon}</span>
                  <div>
                    <h3 className="font-bold text-ink">{p.title}</h3>
                    <p className="mt-0.5 text-sm text-muted">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
