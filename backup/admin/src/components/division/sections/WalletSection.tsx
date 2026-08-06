"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { dv } from "@/components/division/DivisionUI";
import { apiGet } from "@/lib/api";

/** 본부 자산 — 이달 CP/MP (Allowance: 회원구분 DIVISION, 로그인 본부 기준) */
export default function WalletSection() {
  const [cp, setCp] = useState(0);
  const [mp, setMp] = useState(0);
  useEffect(() => { apiGet<{ cp: number; mp: number }>("/api/division/dashboard").then((r) => { if (r.ok && r.data) { setCp(r.data.cp ?? 0); setMp(r.data.mp ?? 0); } }); }, []);

  return (
    <div className="space-y-5">
      {/* CP / MP 본부 총합 (이달) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-2xl p-5 shadow-sm ${dv.cpCard}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-violet-200">CP · 본부 총합 예정수당</p>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">진행 중</span>
          </div>
          <p className="mt-2 text-3xl font-black">{krw(cp)}</p>
          <p className="mt-1 text-xs text-violet-200">산하 전체 조직의 파이프라인에서 발생한 본부 몫</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ${dv.mpCard}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold">MP · 본부 총합 확정수당</p>
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold">출금 가능</span>
          </div>
          <p className="mt-2 text-3xl font-black">{krw(mp)}</p>
          <p className="mt-1 text-xs opacity-90">최종 구매확정 완료되어 출금 가능한 본부 순수익</p>
        </div>
      </div>

      {/* 현황판 아래로 이동한 랭킹 보기 버튼 (기여도 요약 카드는 삭제) */}
      <Link href="/division/leaderboard" className={`block rounded-xl px-4 py-3 text-center text-sm font-bold ${dv.outlineBtn}`}>
        산하 센터별 본부 수당 기여도 랭킹 보기 ›
      </Link>
    </div>
  );
}
