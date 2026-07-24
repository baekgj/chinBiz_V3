"use client";

import { useState } from "react";
import { Card, Stat, ct } from "@/components/center/CenterUI";
import { krw } from "@/components/ui";

const ROWS = [
  { type: "설치 상품", name: "매장 자동화 AI 청기 시스템", mgr: 25, cases: 42, state: "설치중 8", reward: 80_000 },
  { type: "일반 계약", name: "명동 스마트 상점 솔루션", mgr: 15, cases: 31, state: "계약완료 12", reward: 100_000 },
];

const OVERRIDE = [
  { hours: 36, area: "서울 강남구", customer: "강남 OO카페", product: "AI 청기 시스템" },
  { hours: 28, area: "서울 강남구", customer: "역삼동 BB식당", product: "스마트 상점 솔루션" },
];

/** 소속 관리매니저 및 2차 영업 모니터링 + 강제 배정(Override) (mock) */
export default function ManagerSection() {
  const [assigned, setAssigned] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="센터 소속 총 관리매니저 수" value="45" unit="명" tone="gold" sub="지역기반 선착순 상시 대기 풀 운영 중" />
        <Stat label="진행 중인 2차 영업 상품 종류 수" value="12" unit="종" tone="slate" />
      </div>

      <Card title="2차 영업 상품별 관리매니저 매핑 및 현장 가동 현황" sub="관리매니저의 현장 대응 능력과 매칭 상태">
        <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className={`text-xs ${ct.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">상품 유형</th>
                <th className="px-4 py-3 text-left font-semibold">관리 대상 상품명</th>
                <th className="px-4 py-3 text-right font-semibold">활동 매니저 수</th>
                <th className="px-4 py-3 text-right font-semibold">2차 매칭/진행 건수</th>
                <th className="px-4 py-3 text-right font-semibold">센터 배정 관리수당(건당)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${ct.divide}`}>
              {ROWS.map((r) => (
                <tr key={r.name} className={ct.rowHover}>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ct.badge}`}>{r.type}</span></td>
                  <td className={`px-4 py-3 font-bold ${ct.cellMain}`}>{r.name}</td>
                  <td className={`px-4 py-3 text-right ${ct.cellSub}`}>{r.mgr} 명</td>
                  <td className={`px-4 py-3 text-right ${ct.cellMain}`}>{r.cases} 건 <span className={`ml-1 text-xs ${ct.note}`}>({r.state})</span></td>
                  <td className={`px-4 py-3 text-right font-black ${ct.statTone.gold}`}>{krw(r.reward)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="강제 배정 (Override Assignment)" sub="장시간 미수락·방치된 고객 DB를 센터 마스터가 직접 소속 매니저에게 수동 배정" right={<span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300">{OVERRIDE.filter((_, i) => !assigned[i]).length}건 병목 감지</span>}>
        <div className="space-y-2">
          {OVERRIDE.map((o, i) => (
            <div key={i} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${ct.tableWrap}`}>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-bold text-red-300">{o.hours}시간 방치</span>
                <div>
                  <p className={`font-bold ${ct.cellMain}`}>{o.customer} <span className={`text-xs font-normal ${ct.cellSub}`}>· {o.area}</span></p>
                  <p className={`text-xs ${ct.cellSub}`}>{o.product}</p>
                </div>
              </div>
              {assigned[i]
                ? <span className="rounded-lg bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300">배정 완료 ✓</span>
                : <button onClick={() => setAssigned((p) => ({ ...p, [i]: true }))} className={`rounded-lg px-4 py-2 text-xs font-bold ${ct.primaryBtn}`}>강제 배정</button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
