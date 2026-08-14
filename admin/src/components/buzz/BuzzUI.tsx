"use client";

// 버즈/매니저 워크스페이스 공용 UI (테마 컨텍스트 소비: 버즈=그린/골드 라이트, 매니저=블랙/골드 다크)
import type { ReactNode } from "react";
import { useBuzz } from "@/components/buzz/theme";

export function Stat({ label, value, unit, tone = "green" }: { label: string; value: string; unit?: string; tone?: string }) {
  const { theme } = useBuzz();
  return (
    <div className={theme.statCard}>
      <p className={`text-xs ${theme.cardSub}`}>{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className={`text-2xl font-black ${theme.statTone[tone] ?? theme.statTone.slate}`}>{value}</span>
        {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
      </p>
    </div>
  );
}

export function Card({ title, sub, right, children }: { title?: ReactNode; sub?: string; right?: ReactNode; children: ReactNode }) {
  const { theme } = useBuzz();
  const hasHeader = !!(title || sub || right);
  return (
    <section className={theme.card}>
      {hasHeader && (
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            {title && <h2 className={`text-base font-black ${theme.cardHead}`}>{title}</h2>}
            {sub && <p className={`mt-0.5 text-xs ${theme.cardSub}`}>{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHead({ title, sub, note }: { title: string; sub?: string; note?: string }) {
  const { theme } = useBuzz();
  return (
    <div className="mb-5">
      <h1 className={`text-xl font-black ${theme.h1}`}>{title}</h1>
      {sub && <p className={`mt-0.5 text-sm ${theme.h1Sub}`}>{sub}</p>}
      {note && (
        <p className={`mt-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium leading-relaxed ${theme.chipBox}`}>
          <span aria-hidden>💡</span>
          <span>{note}</span>
        </p>
      )}
    </div>
  );
}

export function GoldBadge({ children }: { children: ReactNode }) {
  const { theme } = useBuzz();
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${theme.goldBadge}`}>{children}</span>;
}
