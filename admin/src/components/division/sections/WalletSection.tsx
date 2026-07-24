"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card, dv } from "@/components/division/DivisionUI";
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

      {/* 본부 정산 수당 기여도 요약 (1차 / 2차) */}
      <Card title="본부 정산 수당 기여도 요약" sub="배정 요율 4% — 1차(버즈 소속) / 2차(매니저 관리) 인프라 분리">
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "1차 영업(버즈 소속 7단계) 본부 배정액", cp: 48_000_000, mp: 22_000_000, cpDesc: "산하 센터 소속 버즈회원들의 1차 접수 진행 총액", mpDesc: "최종 완료된 1차 마케팅 기반 본부 확정액", action: { label: "산하 센터별 본부 수당 기여도 랭킹 보기 ›", href: "/division/leaderboard" } },
          ].map((b) => (
            <div key={b.title} className={`rounded-xl border p-4 ${dv.tableWrap}`}>
              <h4 className={`text-sm font-black ${dv.cardHead}`}>{b.title}</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${dv.badge}`}>CP</span>
                  <p className={`mt-1 text-lg font-black ${dv.statTone.violet}`}>{krw(b.cp)}</p>
                  <p className={`text-[11px] ${dv.note}`}>{b.cpDesc}</p>
                </div>
                <div>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">MP · 출금가능</span>
                  <p className={`mt-1 text-lg font-black ${dv.statTone.emerald}`}>{krw(b.mp)}</p>
                  <p className={`text-[11px] ${dv.note}`}>{b.mpDesc}</p>
                </div>
              </div>
              <Link href={b.action.href} className={`mt-3 block rounded-lg px-3 py-2 text-center text-xs font-bold ${dv.outlineBtn}`}>{b.action.label}</Link>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
