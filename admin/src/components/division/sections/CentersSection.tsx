import { Card, Stat, dv } from "@/components/division/DivisionUI";
import { krw } from "@/components/ui";

/** 산하 센터별 1차 영업(버즈) 모니터링 — 상품별 센터/버즈 매핑 (mock) */
const PRODUCTS = [
  { name: "깔끔돌이 돌솥 세척기", partner: "삼화정공", centers: "8개 센터", buzz: 1820, cases: 412, reward: 24_000 },
  { name: "매장 자동화 AI 청기 시스템", partner: "테크노플러스", centers: "6개 센터 / 8개 중", buzz: 1450, cases: 310, reward: 18_000 },
  { name: "명동 스마트 상점 솔루션", partner: "스마트리테일", centers: "4개 센터 / 8개 중", buzz: 920, cases: 185, reward: 28_000 },
];

export default function CentersSection() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="본부 산하 총 센터 수" value="8" unit="개 센터" tone="violet" />
        <Stat label="본부 산하 총 소속 버즈회원 수" value="4,850" unit="명" tone="fuchsia" />
        <Stat label="진행 중인 1차 영업 상품 종류 수" value="24" unit="종" tone="slate" />
      </div>

      <Card title="1차 영업 상품별 센터/버즈 매핑 현황" sub="산하 센터들의 마케팅/리쿠르팅 볼륨과 1차 영업 상품 집중도 분석">
        <div className={`overflow-x-auto rounded-xl border ${dv.tableWrap}`}>
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className={`text-xs ${dv.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">상품명 (파트너사)</th>
                <th className="px-4 py-3 text-right font-semibold">활성 센터 수</th>
                <th className="px-4 py-3 text-right font-semibold">소속 총 버즈회원 수</th>
                <th className="px-4 py-3 text-right font-semibold">1차 영업 접수 건수</th>
                <th className="px-4 py-3 text-right font-semibold">본부 배정 수당(건당)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dv.divide}`}>
              {PRODUCTS.map((p) => (
                <tr key={p.name} className={dv.rowHover}>
                  <td className="px-4 py-3">
                    <p className={`font-bold ${dv.cellMain}`}>{p.name}</p>
                    <p className={`text-xs ${dv.cellSub}`}>{p.partner}</p>
                  </td>
                  <td className={`px-4 py-3 text-right ${dv.cellSub}`}>{p.centers}</td>
                  <td className={`px-4 py-3 text-right ${dv.cellSub}`}>{p.buzz.toLocaleString()} 명</td>
                  <td className={`px-4 py-3 text-right font-semibold ${dv.cellMain}`}>{p.cases} 건</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-black ${dv.statTone.fuchsia}`}>{krw(p.reward)}</span>
                    <span className={`ml-1 text-[10px] ${dv.note}`}>(4%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-xs ${dv.note}`}>※ 실 BE 연동 예정 (상품별 센터/버즈 분포).</p>
      </Card>
    </div>
  );
}
