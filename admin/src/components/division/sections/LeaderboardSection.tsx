"use client";

import { useEffect, useState } from "react";
import { Card, dv } from "@/components/division/DivisionUI";
import { krw } from "@/components/ui";
import { apiGet } from "@/lib/api";

/**
 * 센터 리더보드 + 소속(버즈 1차) vs 관리(매니저 2차) 기여도 분석 — 실데이터 (docs/37)
 * BE: GET /api/division/leaderboard?month=  (month 비우면 전체기간)
 *  - 순위/점수 = 산하 센터별 본부 배정수당(순액) 1위 대비 %, 수당이 모두 0이면 1·2차 영업건수 기준
 *  - 기여 비중 = 센터 소속 버즈 1차영업 건수 vs 센터 승인 매니저 2차 배정 건수 (취소/반품 제외)
 */
type Row = {
  idx: number; centerCode: string; centerName: string; rank: number; score: number;
  divisionReward: number; salesCount: number; mgmtCount: number;
};
type Resp = { month: string | null; scoreBasis: "REWARD" | "COUNT"; totalReward: number; centers: Row[] };

const n = (v?: number) => (v ?? 0).toLocaleString("ko-KR");

export default function LeaderboardSection() {
  const [monthInput, setMonthInput] = useState("");
  const [month, setMonth] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<Resp>(`/api/division/leaderboard${month ? `?month=${month}` : ""}`).then((r) => {
      if (!alive) return;
      setData(r.ok && r.data ? r.data : null);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [month]);

  const rows = data?.centers ?? [];
  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);
  const period = month ? `${month.split("-")[0]}년 ${Number(month.split("-")[1])}월` : "전체 기간";
  const basis = data?.scoreBasis === "COUNT" ? "본부수당 실적이 없어 1·2차 영업건수 기준" : "본부 배정수당 1위 대비 점수";

  const filter = (
    <div className="flex items-center gap-2">
      <input type="month" value={monthInput} onChange={(e) => setMonthInput(e.target.value)}
        className={`rounded-lg border px-2 py-1.5 text-xs outline-none [color-scheme:dark] ${dv.input}`} />
      <button onClick={() => setMonth(monthInput)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${dv.primaryBtn}`}>검색</button>
      <button onClick={() => { setMonthInput(""); setMonth(""); }} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${dv.outlineBtn}`}>전체기간</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <Card title="센터 리더보드" sub={`${period} · ${basis} · 본부수당 합계 ${krw(data?.totalReward ?? 0)}`} right={filter}>
        {loading ? (
          <p className={`py-10 text-center text-sm ${dv.cellSub}`}>불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className={`py-10 text-center text-sm ${dv.cellSub}`}>산하 센터가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((c, i) => (
              <div key={c.idx} className={`flex items-center gap-4 rounded-xl border p-4 ${dv.tableWrap}`}>
                <span className="w-8 text-center text-lg font-black">{medal(i)}</span>
                <div className="flex-1">
                  <p className={`font-bold ${dv.cellMain}`}>{c.centerName} <span className={`ml-1 text-xs font-normal ${dv.cellSub}`}>{c.centerCode}</span></p>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-violet-900/40">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${c.score}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${dv.statTone.fuchsia}`}>{c.score}점</p>
                  <p className={`text-xs ${dv.cellSub}`}>{krw(c.divisionReward)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="소속 vs 관리 기여도 분석" sub="소속센터(버즈 1차 영업 건수) vs 관리센터(매니저 2차 배정 건수) 기여 비중 · 취소/반품 제외">
        {loading ? (
          <p className={`py-6 text-center text-sm ${dv.cellSub}`}>불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className={`py-6 text-center text-sm ${dv.cellSub}`}>산하 센터가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((c) => {
              const total = c.salesCount + c.mgmtCount;
              const salesPct = total ? Math.round((c.salesCount / total) * 100) : 0;
              return (
                <div key={c.idx}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className={dv.cellMain}>{c.centerName}</span>
                    <span className={dv.cellSub}>
                      {total ? `소속 ${salesPct}% (${n(c.salesCount)}건) · 관리 ${100 - salesPct}% (${n(c.mgmtCount)}건)` : "실적 없음"}
                    </span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-violet-900/40">
                    {total > 0 && <div className="h-full bg-violet-500" style={{ width: `${salesPct}%` }} />}
                    {total > 0 && <div className="h-full bg-fuchsia-500" style={{ width: `${100 - salesPct}%` }} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex gap-4 text-xs">
          <span className={dv.cellSub}><span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />소속센터(버즈 1차)</span>
          <span className={dv.cellSub}><span className="mr-1 inline-block h-2 w-2 rounded-full bg-fuchsia-500" />관리센터(매니저 2차)</span>
        </div>
      </Card>
    </div>
  );
}
