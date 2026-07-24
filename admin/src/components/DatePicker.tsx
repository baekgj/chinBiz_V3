"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * 고급형 커스텀 날짜 선택기 (캘린더 팝오버).
 * - value/onChange: "YYYY-MM-DD" (빈 문자열=미선택)
 * - min: 선택 가능한 최소 날짜(이전은 비활성). 기본 제한 없음.
 * - variant: "dark"(본사 네이비) | "light"(파트너/일반)
 */
type Props = {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  variant?: "dark" | "light";
  placeholder?: string;
  className?: string;
};

const WD = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => new Date().toLocaleDateString("sv-SE");

const T = {
  dark: {
    trigger: "border-line bg-navy-950 text-white focus:border-brand-500",
    triggerPlaceholder: "text-slate-600",
    pop: "border-line bg-navy-900 shadow-2xl ring-1 ring-black/40",
    navBtn: "text-slate-300 hover:bg-navy-800",
    title: "text-white",
    wd: "text-slate-500",
    day: "text-slate-200 hover:bg-navy-800",
    dayMuted: "text-slate-600",
    dayDisabled: "text-slate-700 cursor-not-allowed",
    selected: "bg-brand-600 text-white font-black shadow ring-1 ring-brand-400",
    today: "ring-1 ring-amber-400/70 text-amber-300",
    sun: "text-red-400", sat: "text-sky-400",
    footBtn: "text-slate-300 hover:bg-navy-800",
    footPrimary: "text-brand-400 hover:bg-brand-600/15",
  },
  light: {
    trigger: "border-slate-300 bg-white text-slate-900 focus:border-sky-500",
    triggerPlaceholder: "text-slate-400",
    pop: "border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5",
    navBtn: "text-slate-500 hover:bg-slate-100",
    title: "text-slate-900",
    wd: "text-slate-400",
    day: "text-slate-700 hover:bg-sky-50",
    dayMuted: "text-slate-300",
    dayDisabled: "text-slate-300 cursor-not-allowed",
    selected: "bg-sky-600 text-white font-black shadow ring-1 ring-sky-400",
    today: "ring-1 ring-amber-400 text-amber-600",
    sun: "text-red-500", sat: "text-sky-600",
    footBtn: "text-slate-500 hover:bg-slate-100",
    footPrimary: "text-sky-600 hover:bg-sky-50",
  },
} as const;

export default function DatePicker({ value, onChange, min, variant = "dark", placeholder = "날짜 선택", className = "" }: Props) {
  const s = T[variant];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selDate = value ? new Date(`${value}T00:00:00`) : null;
  const [view, setView] = useState(() => (selDate ?? new Date()));

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // 열릴 때 선택된 달로 이동
  useEffect(() => { if (open) setView(selDate ?? new Date()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  const y = view.getFullYear(), m = view.getMonth();
  const cells = useMemo(() => {
    const first = new Date(y, m, 1);
    const lead = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(y, m, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [y, m]);

  const disabled = (d: Date) => (min ? ymd(d) < min : false);
  const pick = (d: Date) => { if (disabled(d)) return; onChange(ymd(d)); setOpen(false); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${s.trigger}`}>
        <span className={value ? "" : s.triggerPlaceholder}>{value || placeholder}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className={`absolute left-0 z-50 mt-2 w-72 rounded-2xl border p-3 ${s.pop}`}>
          {/* 헤더: 월 이동 */}
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setView(new Date(y, m - 1, 1))} className={`grid h-8 w-8 place-items-center rounded-lg ${s.navBtn}`} aria-label="이전 달">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <span className={`text-sm font-black ${s.title}`}>{y}년 {m + 1}월</span>
            <button type="button" onClick={() => setView(new Date(y, m + 1, 1))} className={`grid h-8 w-8 place-items-center rounded-lg ${s.navBtn}`} aria-label="다음 달">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          {/* 요일 */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WD.map((w, i) => <div key={w} className={`text-center text-[11px] font-bold ${i === 0 ? s.sun : i === 6 ? s.sat : s.wd}`}>{w}</div>)}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = ymd(d);
              const isSel = value === key;
              const isToday = key === todayStr();
              const dis = disabled(d);
              const wd = d.getDay();
              const base = isSel ? s.selected : dis ? s.dayDisabled : `${wd === 0 ? s.sun : wd === 6 ? s.sat : s.day}`;
              return (
                <button key={i} type="button" disabled={dis} onClick={() => pick(d)}
                  className={`grid h-9 place-items-center rounded-lg text-sm transition-colors ${base} ${!isSel && isToday ? s.today : ""}`}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* 푸터: 오늘 / 지우기 */}
          <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
            <button type="button" onClick={() => onChange("")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${s.footBtn}`}>지우기</button>
            <button type="button" onClick={() => { const t = todayStr(); if (!min || t >= min) { onChange(t); setOpen(false); } }} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${s.footPrimary}`}>오늘</button>
          </div>
        </div>
      )}
    </div>
  );
}
