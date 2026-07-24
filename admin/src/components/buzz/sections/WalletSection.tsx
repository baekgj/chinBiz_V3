"use client";

import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card, Stat, GoldBadge } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";

/** 수당 현황판 — CP 예정수당 / MP 확정수당 (이달, Allowance 원장 연동) */
export default function WalletSection() {
  const { theme, isManager } = useBuzz();
  const [cp, setCp] = useState(0);
  const [mp, setMp] = useState(0);

  useEffect(() => {
    apiGet<{ cp: number; mp: number }>(`/api/buzz/dashboard?as=${isManager ? "manager" : "buzz"}`).then((r) => {
      if (r.ok && r.data) { setCp(r.data.cp ?? 0); setMp(r.data.mp ?? 0); }
    });
  }, [isManager]);

  return (
    <div className="space-y-5">
      {/* CP / MP 지갑 (이달) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-2xl p-5 shadow-sm ${theme.cpCard}`}>
          <p className={`text-xs font-semibold ${theme.cpLabel}`}>CP 예정수당 <span className="opacity-80">(진행 중 영업 예상)</span></p>
          <p className="mt-2 text-3xl font-black">{krw(cp)}</p>
          <p className={`mt-1 text-xs ${theme.cpLabel}`}>구매확정 시 MP로 전환 · 아직 미확정</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm ${theme.mpCard}`}>
          <p className="text-xs font-bold">MP 확정수당</p>
          <p className="mt-2 text-3xl font-black">{krw(mp)}</p>
          <div className="mt-2 flex items-center gap-2">
            <button className={`rounded-lg px-3 py-1 text-xs font-bold ${theme.mpBtn}`}>출금 신청</button>
            <GoldBadge>출금가능</GoldBadge>
          </div>
        </div>
      </div>

      {/* 수당 구성 */}
      <Card title="수당 구성" sub={isManager ? "설치/검수 완료 확정 + 관리 인프라 공로" : "직접 1차 영업 + 추천 네트워크(친쿠) 약 10% 적립"}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={isManager ? "관리영업 CP" : "직접영업 CP"} value={krw(1_530_000)} tone="green" />
          <Stat label={isManager ? "패널티/보전 반영" : "추천 네트워크 CP"} value={krw(290_000)} tone="gold" />
          <Stat label="이번달 확정 MP" value={krw(420_000)} tone="green" />
          <Stat label="누적 확정 MP" value={krw(3_180_000)} tone="slate" />
        </div>
      </Card>

      {/* 최근 정산 내역 (mock) */}
      <Card title="최근 정산 내역" sub="원장 연동 예정 (현재 예시 데이터)">
        <div className={`overflow-x-auto rounded-xl border ${theme.tableWrap}`}>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className={`text-xs ${theme.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">일자</th>
                <th className="px-4 py-3 text-left font-semibold">상품/건</th>
                <th className="px-4 py-3 text-center font-semibold">계정</th>
                <th className="px-4 py-3 text-right font-semibold">금액</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.divide}`}>
              {[
                { d: "07-11", n: "깔끔돌이 돌솥 세척기 (직접)", t: "MP", a: 270_000 },
                { d: "07-10", n: "친쿠 추천 적립 (홍길동)", t: "MP", a: 27_000 },
                { d: "07-09", n: "프리미엄 소스세트 (진행중)", t: "CP", a: 30_000 },
              ].map((r, i) => (
                <tr key={i} className={theme.rowHover}>
                  <td className={`px-4 py-3 ${theme.cellSub}`}>{r.d}</td>
                  <td className={`px-4 py-3 font-semibold ${theme.cellMain}`}>{r.n}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.t === "MP" ? theme.stageDone : theme.stageOn}`}>{r.t}</span>
                  </td>
                  <td className={`px-4 py-3 text-right font-black ${theme.statTone.green}`}>{krw(r.a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
