import { Card, Stat, ct } from "@/components/center/CenterUI";
import { krw } from "@/components/ui";

/** 소속 버즈회원 및 1차 영업 모니터링 — 상품별 버즈 매핑 (mock) */
const ROWS = [
  { cat: "디지털", name: "매장 자동화 AI 청기 시스템", partner: "테크노플러스", buzz: 420, cases: 124, reward: 50_000 },
  { cat: "푸드테크", name: "프리미엄 K-중식 식자재 패키지", partner: "한식마켓", buzz: 310, cases: 85, reward: 20_000 },
  { cat: "상권활성화", name: "명동 스마트 상점 솔루션", partner: "스마트리테일", buzz: 280, cases: 92, reward: 70_000 },
];

export default function BuzzSection() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="센터 소속 총 버즈회원 수" value="1,250" unit="명" tone="gold" sub="전월 대비 ▲ 12%" />
        <Stat label="진행 중인 1차 영업 상품 종류 수" value="18" unit="종" tone="slate" />
      </div>

      <Card title="1차 영업 상품별 버즈회원 매핑 현황" sub="소속 버즈회원 규모와 상품별 영업 볼륨">
        <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className={`text-xs ${ct.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">상품 카테고리</th>
                <th className="px-4 py-3 text-left font-semibold">상품명 (공급 파트너사)</th>
                <th className="px-4 py-3 text-right font-semibold">활동 버즈회원 수</th>
                <th className="px-4 py-3 text-right font-semibold">1차 영업 접수 건수</th>
                <th className="px-4 py-3 text-right font-semibold">센터 배정 소속수당(건당)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${ct.divide}`}>
              {ROWS.map((r) => (
                <tr key={r.name} className={ct.rowHover}>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ct.badge}`}>{r.cat}</span></td>
                  <td className="px-4 py-3"><p className={`font-bold ${ct.cellMain}`}>{r.name}</p><p className={`text-xs ${ct.cellSub}`}>{r.partner}</p></td>
                  <td className={`px-4 py-3 text-right ${ct.cellSub}`}>{r.buzz} 명</td>
                  <td className={`px-4 py-3 text-right font-semibold ${ct.cellMain}`}>{r.cases} 건</td>
                  <td className={`px-4 py-3 text-right font-black ${ct.statTone.gold}`}>{krw(r.reward)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-xs ${ct.note}`}>※ 실 BE 연동 예정 (상품별 소속 버즈 분포·정산 리포트).</p>
      </Card>
    </div>
  );
}
