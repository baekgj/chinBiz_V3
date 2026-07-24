import { Card, SectionTitle, Badge, StatTile } from "@/components/ui";
import Icon from "@/components/Icon";
import MasterKpi from "@/components/master/MasterKpi";

const PLATFORM = [
  { label: "파트너사", value: "42", unit: "개", delta: "▲ 3" },
  { label: "활성 상품", value: "128", unit: "종", delta: "▲ 6" },
  { label: "본부", value: "5", unit: "개" },
  { label: "센터", value: "24", unit: "개", delta: "▲ 1" },
  { label: "관리매니저", value: "350", unit: "명", delta: "▲ 12" },
  { label: "버즈회원", value: "12,400", unit: "명", delta: "▲ 487" },
];

const PENDING = [
  { label: "파트너사 입점 심사", count: 3, tone: "warn" as const, href: "/partners" },
  { label: "MP 확정수당 출금 승인", count: 8, tone: "brand" as const, href: "/settlement" },
  { label: "민원 정산 동결(Freeze)", count: 2, tone: "danger" as const, href: "/complaints" },
];

const FEED = [
  { t: "방금 전", tone: "pos" as const, text: "[삼화정공사] 깔끔돌이 돌솥 세척기 구매확정 — 총수당 ₩600,000 정산" },
  { t: "3분 전", tone: "brand" as const, text: "신규 파트너사 [테크노플러스] 입점 심사 요청" },
  { t: "12분 전", tone: "warn" as const, text: "강동 인프라센터 완결(MP) 전환율 79.8% — 집중 관리 대상" },
  { t: "26분 전", tone: "danger" as const, text: "[종로가든] 설치 지연 민원 접수 → 계약 SETTLEMENT_FREEZE" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-float-up">
      {/* KPI 스코어카드 (DB 연동) */}
      <MasterKpi />

      {/* 플랫폼 가동 현황 */}
      <section>
        <SectionTitle title="플랫폼 가동 현황" sub="조직망·상품·파트너 실시간 규모" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {PLATFORM.map((s) => (
            <StatTile key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* 하단: 처리 대기 + 실시간 피드 */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <SectionTitle title="빠른 처리 대기" sub="승인·심사·동결 건" />
          <ul className="space-y-2">
            {PENDING.map((p) => (
              <li key={p.label} className="flex items-center justify-between rounded-xl bg-navy-800 px-4 py-3">
                <span className="text-sm text-slate-200">{p.label}</span>
                <Badge tone={p.tone}>{p.count}건</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle title="실시간 활동 피드" sub="정산·심사·민원 이벤트" />
          <ul className="space-y-3">
            {FEED.map((f, i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full bg-${f.tone}`} style={{ backgroundColor: `var(--color-${f.tone})` }} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-200">{f.text}</p>
                  <p className="text-[11px] text-slate-500">{f.t}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
