"use client";

import { useEffect, useState } from "react";

const EVENTS = [
  { loc: "서울시 서초구", name: "김OO님", action: "[A사 디지털 솔루션] 1차 영업 개시", time: "방금 전" },
  { loc: "경기도 수원시", name: "박OO님", action: "[B사 외식 프랜차이즈] 매칭 성공", time: "3분 전" },
  { loc: "서울시 강남구", name: "이OO님", action: "[C사 헬스케어] 계약 체결 완료", time: "8분 전" },
  { loc: "부산시 해운대구", name: "최OO님", action: "MP 확정수당 ₩450,000 정산 완료", time: "12분 전" },
  { loc: "인천시 연수구", name: "정OO님", action: "[D사 교육 솔루션] 구매 확정", time: "17분 전" },
  { loc: "대구시 수성구", name: "한OO님", action: "버즈 네트워크 신규 추천 3명 달성", time: "24분 전" },
];

export default function LiveActivity() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % EVENTS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const e = EVENTS[idx];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="live-dot absolute inline-flex h-2.5 w-2.5 rounded-full bg-gold-400" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-400" />
      </span>
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-gold-300">
        LIVE
      </span>
      <div key={idx} className="min-w-0 flex-1 animate-float-up">
        <p className="truncate text-sm text-white">
          <span className="font-semibold text-gold-200">{e.loc}</span> {e.name}이{" "}
          {e.action}
        </p>
      </div>
      <span className="shrink-0 text-xs text-forest-200/70">{e.time}</span>
    </div>
  );
}
