"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type StatsResp = { totalMatches: number; activeBuzz: number; monthMatches: number };

/** 파트너 온보딩 지표 카드 — 활성 버즈 회원(1차영업 1회 이상 신청자)은 DB 연동 */
export default function PartnerStats() {
  const [activeBuzz, setActiveBuzz] = useState<number | null>(null);

  useEffect(() => {
    apiGet<StatsResp>("/api/public/stats").then((r) => {
      if (r.ok && r.data) setActiveBuzz(r.data.activeBuzz ?? 0);
    });
  }, []);

  const cards = [
    { v: activeBuzz === null ? "…" : activeBuzz.toLocaleString("ko-KR"), l: "활성 버즈 회원" },
    { v: "100%", l: "성과 기반 정산" },
    { v: "Zero", l: "초기 마케팅 비용" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((s) => (
        <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-xl font-black text-gold-300 sm:text-2xl">{s.v}</p>
          <p className="mt-1 text-[11px] leading-tight text-forest-100/75">{s.l}</p>
        </div>
      ))}
    </div>
  );
}
