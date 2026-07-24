// 본부(총괄본부) 어드민 공용 UI — 딥 퍼플 / 차콜 메탈릭 (다크, 단일 역할이라 컨텍스트 불필요)
import type { ReactNode } from "react";

/** 테마 클래스 토큰 (division 전용) */
export const dv = {
  page: "min-h-screen bg-[#141019] text-violet-50",
  header: "sticky top-0 z-30 border-b border-violet-900/40 bg-[#1a1428]/90 backdrop-blur-md",
  logoBox: "bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white ring-1 ring-violet-400/30",
  brand: "text-white", accent: "text-fuchsia-300",
  navActive: "bg-violet-800/50 text-fuchsia-200", navIdle: "text-violet-300/70 hover:bg-violet-900/40 hover:text-fuchsia-200",
  iconBtn: "text-violet-300/70 hover:bg-violet-900/40", acctActive: "bg-violet-800/50 text-fuchsia-200", acctIdle: "text-violet-200 hover:bg-violet-900/40",
  card: "rounded-2xl border border-violet-900/40 bg-[#1e1730] p-5 shadow-sm",
  cardHead: "text-white", cardSub: "text-violet-300/70", h1: "text-white", h1Sub: "text-violet-300/70",
  statCard: "rounded-xl border border-violet-900/40 bg-[#1e1730] p-4",
  statTone: { violet: "text-violet-300", fuchsia: "text-fuchsia-300", emerald: "text-emerald-300", slate: "text-violet-50", amber: "text-amber-300" } as Record<string, string>,
  primaryBtn: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500",
  outlineBtn: "border border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/20",
  badge: "bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-fuchsia-500/30",
  tableWrap: "border-violet-900/40", thead: "bg-violet-900/30 text-violet-300/70", rowHover: "hover:bg-violet-900/20",
  divide: "divide-violet-900/30", cellMain: "text-violet-50", cellSub: "text-violet-300/70",
  input: "border-violet-800/60 bg-[#141019] text-violet-50 focus:border-fuchsia-500",
  roBox: "border-violet-900/40 bg-violet-900/20 text-violet-200", fieldLabel: "text-violet-300/70",
  note: "text-violet-400/50",
  cpCard: "border border-violet-900/40 bg-gradient-to-br from-violet-800 to-[#241a3a] text-white",
  mpCard: "border border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-600 to-violet-700 text-white",
};

export function Stat({ label, value, unit, tone = "violet" }: { label: string; value: string; unit?: string; tone?: string }) {
  return (
    <div className={dv.statCard}>
      <p className={`text-xs ${dv.cardSub}`}>{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className={`text-2xl font-black ${dv.statTone[tone] ?? dv.statTone.slate}`}>{value}</span>
        {unit && <span className="text-sm font-semibold text-violet-400/60">{unit}</span>}
      </p>
    </div>
  );
}

export function Card({ title, sub, right, children }: { title: string; sub?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className={dv.card}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-base font-black ${dv.cardHead}`}>{title}</h2>
          {sub && <p className={`mt-0.5 text-xs ${dv.cardSub}`}>{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className={`text-xl font-black ${dv.h1}`}>{title}</h1>
      {sub && <p className={`mt-0.5 text-sm ${dv.h1Sub}`}>{sub}</p>}
    </div>
  );
}
