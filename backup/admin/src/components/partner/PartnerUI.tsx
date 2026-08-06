// 파트너 어드민 공용 UI 모듈 (라이트 테마)
import type { ReactNode } from "react";

export function Stat({ label, value, unit, tone = "slate" }: { label: string; value: string; unit?: string; tone?: string }) {
  const c: Record<string, string> = { slate: "text-slate-900", sky: "text-sky-600", emerald: "text-emerald-600", amber: "text-amber-600", red: "text-red-600" };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className={`text-2xl font-black ${c[tone]}`}>{value}</span>
        {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
      </p>
    </div>
  );
}

export function Card({ title, sub, right, children }: { title: string; sub?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900">{title}</h2>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** 페이지 헤더 (라이트) */
export function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-black text-slate-900">{title}</h1>
      {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}
