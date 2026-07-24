// 센터(센추럴 마스터 오피스) 어드민 공용 UI — 프리미엄 골드 / 블랙 (다크, 단일 역할)
import type { ReactNode } from "react";

export const ct = {
  page: "min-h-screen bg-[#0d0b06] text-amber-50",
  header: "sticky top-0 z-30 border-b border-amber-900/40 bg-[#141009]/90 backdrop-blur-md",
  logoBox: "bg-gradient-to-br from-amber-300 to-yellow-600 text-black ring-1 ring-amber-300/40",
  brand: "text-white", accent: "text-amber-400",
  navActive: "bg-amber-500/15 text-amber-300", navIdle: "text-amber-200/50 hover:bg-amber-900/25 hover:text-amber-200",
  iconBtn: "text-amber-200/50 hover:bg-amber-900/25", acctActive: "bg-amber-500/15 text-amber-300", acctIdle: "text-amber-100 hover:bg-amber-900/25",
  card: "rounded-2xl border border-amber-900/30 bg-[#16120a] p-5 shadow-sm",
  cardHead: "text-white", cardSub: "text-amber-200/50", h1: "text-white", h1Sub: "text-amber-200/50",
  statCard: "rounded-xl border border-amber-900/30 bg-[#16120a] p-4",
  statTone: { gold: "text-amber-400", emerald: "text-emerald-300", slate: "text-amber-50", red: "text-red-300", amber: "text-amber-300" } as Record<string, string>,
  primaryBtn: "bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400",
  outlineBtn: "border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
  badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  tableWrap: "border-amber-900/30", thead: "bg-amber-900/20 text-amber-200/60", rowHover: "hover:bg-amber-900/10",
  divide: "divide-amber-900/20", cellMain: "text-amber-50", cellSub: "text-amber-200/60",
  input: "border-amber-800/50 bg-[#0d0b06] text-amber-50 focus:border-amber-400", roBox: "border-amber-900/30 bg-amber-900/15 text-amber-100", fieldLabel: "text-amber-200/60",
  note: "text-amber-200/35",
  cpCard: "border border-amber-900/40 bg-gradient-to-br from-[#2a2109] to-black text-amber-50",
  mpCard: "border border-amber-400/50 bg-gradient-to-br from-amber-400 to-yellow-600 text-black",
};

export function Stat({ label, value, unit, tone = "gold", sub }: { label: string; value: string; unit?: string; tone?: string; sub?: string }) {
  return (
    <div className={ct.statCard}>
      <p className={`text-xs ${ct.cardSub}`}>{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className={`text-2xl font-black ${ct.statTone[tone] ?? ct.statTone.slate}`}>{value}</span>
        {unit && <span className="text-sm font-semibold text-amber-200/40">{unit}</span>}
      </p>
      {sub && <p className={`mt-0.5 text-xs ${ct.note}`}>{sub}</p>}
    </div>
  );
}

export function Card({ title, sub, right, children }: { title: string; sub?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className={ct.card}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-base font-black ${ct.cardHead}`}>{title}</h2>
          {sub && <p className={`mt-0.5 text-xs ${ct.cardSub}`}>{sub}</p>}
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
      <h1 className={`text-xl font-black ${ct.h1}`}>{title}</h1>
      {sub && <p className={`mt-0.5 text-sm ${ct.h1Sub}`}>{sub}</p>}
    </div>
  );
}
