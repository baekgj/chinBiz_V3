import { Card, dv } from "@/components/division/DivisionUI";
import { krw } from "@/components/ui";

/** 센터 리더보드 + 소속(버즈) vs 관리(매니저) 기여도 분석 (mock) */
const RANK = [
  { name: "강남센터", score: 96, gmv: 128_000_000, sales: 42, mgmt: 54 },
  { name: "서초센터", score: 82, gmv: 94_000_000, sales: 47, mgmt: 41 },
  { name: "분당센터", score: 71, gmv: 72_000_000, sales: 55, mgmt: 30 },
  { name: "일산센터", score: 48, gmv: 48_000_000, sales: 60, mgmt: 18 },
];

export default function LeaderboardSection() {
  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);
  return (
    <div className="space-y-5">
      <Card title="센터 리더보드" sub="본부 기여 점수 기준 순위 (예시 데이터)">
        <div className="space-y-2">
          {RANK.map((c, i) => (
            <div key={c.name} className={`flex items-center gap-4 rounded-xl border p-4 ${dv.tableWrap}`}>
              <span className="w-8 text-center text-lg font-black">{medal(i)}</span>
              <div className="flex-1">
                <p className={`font-bold ${dv.cellMain}`}>{c.name}</p>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-violet-900/40">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${c.score}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${dv.statTone.fuchsia}`}>{c.score}점</p>
                <p className={`text-xs ${dv.cellSub}`}>{krw(c.gmv)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="소속 vs 관리 기여도 분석" sub="소속센터(버즈 1차 영업) vs 관리센터(매니저 2차 관리) 기여 비중">
        <div className="space-y-3">
          {RANK.map((c) => {
            const total = c.sales + c.mgmt;
            const salesPct = Math.round((c.sales / total) * 100);
            return (
              <div key={c.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className={dv.cellMain}>{c.name}</span>
                  <span className={dv.cellSub}>소속 {salesPct}% · 관리 {100 - salesPct}%</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  <div className="h-full bg-violet-500" style={{ width: `${salesPct}%` }} />
                  <div className="h-full bg-fuchsia-500" style={{ width: `${100 - salesPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs">
          <span className={dv.cellSub}><span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />소속센터(버즈 1차)</span>
          <span className={dv.cellSub}><span className="mr-1 inline-block h-2 w-2 rounded-full bg-fuchsia-500" />관리센터(매니저 2차)</span>
        </div>
      </Card>
    </div>
  );
}
