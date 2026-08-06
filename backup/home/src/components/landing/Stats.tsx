"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/api";

type Stat = { label: string; value: number; suffix: string };

type StatsResp = { totalMatches: number; activeBuzz: number; monthMatches: number };

function useCountUp(target: number, run: boolean, duration = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // rAF가 멈추는 환경(백그라운드 탭 등)에서도 최종값 보장
    const done = setTimeout(() => setN(target), duration + 150);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [target, run, duration]);
  return n;
}

function StatItem({ stat, run }: { stat: Stat; run: boolean }) {
  const n = useCountUp(stat.value, run);
  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          {n.toLocaleString("ko-KR")}
        </span>
        <span className="text-xl font-bold text-gold-300">{stat.suffix}</span>
      </div>
      <p className="mt-2 text-sm text-forest-200/80">{stat.label}</p>
    </div>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  const [stats, setStats] = useState<Stat[]>([
    { label: "누적 영업 매칭 건수", value: 0, suffix: "건" },
    { label: "활성화된 버즈 회원 수", value: 0, suffix: "명" },
    { label: "이번 달 신규 매칭", value: 0, suffix: "건" },
  ]);

  // 실 DB 지표 로드 → 로드 완료 시 카운트업 실행
  useEffect(() => {
    apiGet<StatsResp>("/api/public/stats").then((r) => {
      if (r.ok && r.data) {
        setStats([
          { label: "누적 영업 매칭 건수", value: r.data.totalMatches ?? 0, suffix: "건" },
          { label: "활성화된 버즈 회원 수", value: r.data.activeBuzz ?? 0, suffix: "명" },
          { label: "이번 달 신규 매칭", value: r.data.monthMatches ?? 0, suffix: "건" },
        ]);
      }
      setRun(true);
    });
  }, []);

  // 스크롤로 화면에 들어오면(먼저 보이면) 카운트업 (로드 완료 전 대비)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRun(true); io.disconnect(); } },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-8 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
    >
      {stats.map((s) => (
        <div key={s.label} className="pt-8 first:pt-0 sm:pt-0">
          <StatItem stat={s} run={run} />
        </div>
      ))}
    </div>
  );
}
