"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card, Stat } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";

type Dash = { cp: number; mp: number; directCp: number; referralOrPenalty: number; confirmedMp: number; cumulativeMp: number };

/** 수당 현황판 — CP 예정수당 / MP 확정수당 + 수당 구성(4항목, Allowance/정산 원장 DB 연동) */
export default function WalletSection() {
  const { theme, isManager } = useBuzz();
  const [d, setD] = useState<Dash>({ cp: 0, mp: 0, directCp: 0, referralOrPenalty: 0, confirmedMp: 0, cumulativeMp: 0 });

  useEffect(() => {
    apiGet<Dash>(`/api/buzz/dashboard?as=${isManager ? "manager" : "buzz"}`).then((r) => {
      if (r.ok && r.data) setD(r.data);
    });
  }, [isManager]);

  const ym = (() => { const n = new Date(); return `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}`; })();
  const as = isManager ? "manager" : "buzz";
  // 수당 구성 4항목 (클릭 시 [수당현황] 필터 링크)
  const tiles = isManager
    ? [
        { label: "관리 CP", value: d.directCp, tone: "green" as const, href: `/buzz/allowances?month=${ym}&status=cp` },
        { label: "패널티/보전 반영", value: d.referralOrPenalty, tone: "gold" as const, href: null },
        { label: "이번달 확정 MP", value: d.confirmedMp, tone: "green" as const, href: `/buzz/allowances?month=${ym}&status=mp` },
        { label: "누적 확정 MP", value: d.cumulativeMp, tone: "slate" as const, href: `/buzz/allowances` },
      ]
    : [
        { label: "직접영업 CP", value: d.directCp, tone: "green" as const, href: `/buzz/allowances?month=${ym}&gubun=buzz&status=cp` },
        { label: "추천 네트워크 CP", value: d.referralOrPenalty, tone: "gold" as const, href: `/buzz/allowances?month=${ym}&gubun=referral&status=cp` },
        { label: "이번달 확정 MP", value: d.confirmedMp, tone: "green" as const, href: `/buzz/allowances?month=${ym}&gubun=all&status=mp` },
        { label: "누적 확정 MP", value: d.cumulativeMp, tone: "slate" as const, href: `/buzz/allowances` },
      ];

  return (
    <div className="space-y-5">
      {/* CP / MP 지갑 (이달) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-2xl p-5 shadow-sm ${theme.cpCard}`}>
          <p className={`text-xs font-semibold ${theme.cpLabel}`}>CP 예정수당 <span className="opacity-80">(진행 중 영업 예상)</span></p>
          <p className="mt-2 text-3xl font-black">{krw(d.cp)}</p>
          <p className={`mt-1 text-xs ${theme.cpLabel}`}>구매확정 시 MP로 전환 · 아직 미확정</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ${theme.mpCard}`}>
          <p className="text-xs font-bold">MP 확정수당</p>
          <p className="mt-2 text-3xl font-black">{krw(d.mp)}</p>
          <p className="mt-2 text-xs font-semibold opacity-90">확정된 MP수당은 익월 정산됩니다.</p>
        </div>
      </div>

      {/* 수당 구성 (DB · 클릭 시 수당현황으로 이동) */}
      <Card title="수당 구성" sub={isManager ? "관리 CP · 패널티/보전 · 확정/누적 MP" : "직접 1차 영업 + 추천 네트워크(친쿠) · 확정/누적 MP"}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t) => t.href ? (
            <Link key={t.label} href={t.href} className="block transition-transform hover:-translate-y-0.5">
              <Stat label={t.label} value={krw(t.value)} tone={t.tone} />
            </Link>
          ) : (
            <Stat key={t.label} label={t.label} value={krw(t.value)} tone={t.tone} />
          ))}
        </div>
      </Card>
    </div>
  );
}
