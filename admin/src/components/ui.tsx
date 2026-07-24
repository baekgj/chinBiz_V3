import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-black text-white">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const toneMap: Record<string, string> = {
  pos: "bg-pos/10 text-pos ring-pos/30",
  warn: "bg-warn/10 text-warn ring-warn/30",
  danger: "bg-danger/10 text-danger ring-danger/30",
  brand: "bg-brand-500/10 text-brand-400 ring-brand-500/30",
  slate: "bg-slate-500/10 text-slate-300 ring-slate-500/30",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof toneMap }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

export function StatTile({ label, value, unit, delta }: { label: string; value: string; unit?: string; delta?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-black text-white">{value}</span>
        {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
      </p>
      {delta && <p className="mt-1 text-[11px] font-semibold text-pos">{delta}</p>}
    </div>
  );
}

/** 아직 상세 구현 전 메뉴용 자리표시 */
export function ComingSoon({ title, points }: { title: string; points: string[] }) {
  return (
    <Card>
      <div className="flex flex-col items-center py-10 text-center">
        <span className="rounded-full bg-navy-800 px-3 py-1 text-xs font-semibold text-brand-400">준비 중</span>
        <h2 className="mt-3 text-lg font-black text-white">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          이 화면의 상세 기능은 다음 단계에서 백엔드 연동과 함께 구축됩니다. 예정 구성:
        </p>
        <ul className="mt-4 space-y-1.5 text-left text-sm text-slate-300">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function krw(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}
