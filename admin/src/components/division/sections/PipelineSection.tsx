import { Card, Stat, dv } from "@/components/division/DivisionUI";

/** 광역 파이프라인 — 본부 소속 센터별 2차 영업(매니저) 인프라 모니터링 (mock) */
const CENTERS = [
  { name: "강남 제1센터", area: "서울 강남구", mgr: 45, prod: 12, cases: 98, install: 14, rate: 92.4, tag: "최우수" },
  { name: "수원 총괄센터", area: "경기 수원시", mgr: 38, prod: 10, cases: 82, install: 11, rate: 88.5 },
  { name: "마포 기술센터", area: "서울 마포구", mgr: 32, prod: 14, cases: 75, install: 18, rate: 85.1 },
  { name: "강동 인프라센터", area: "서울 강동구", mgr: 25, prod: 8, cases: 41, install: 5, rate: 79.8, tag: "집중 관리" },
];

export default function PipelineSection() {
  const tagCls = (t?: string) => t === "최우수" ? "bg-emerald-500/20 text-emerald-300" : t === "집중 관리" ? "bg-amber-500/20 text-amber-300" : "";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="본부 산하 총 관리매니저 수" value="185" unit="명" tone="fuchsia" />
        <Stat label="진행 중인 2차 영업 상품 종류 수" value="16" unit="종" tone="violet" />
      </div>

      <Card title="센터별 관리매니저 및 2차 영업 상품 가동 현황" sub="본부 관할 구역 내 최종 클로징·설치 기술 인프라 가동 상태 및 센터별 인력 배치">
        <div className={`overflow-x-auto rounded-xl border ${dv.tableWrap}`}>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className={`text-xs ${dv.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">센터명 (지사)</th>
                <th className="px-4 py-3 text-right font-semibold">보유 매니저 수</th>
                <th className="px-4 py-3 text-right font-semibold">2차 진행 상품 수</th>
                <th className="px-4 py-3 text-right font-semibold">매칭/진행 건수</th>
                <th className="px-4 py-3 text-right font-semibold">배송/설치 중</th>
                <th className="px-4 py-3 text-right font-semibold">완결(MP) 전환율</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dv.divide}`}>
              {CENTERS.map((c) => (
                <tr key={c.name} className={dv.rowHover}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className={`font-bold ${dv.cellMain}`}>{c.name}</p>
                        <p className={`text-xs ${dv.cellSub}`}>{c.area}</p>
                      </div>
                      {c.tag && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tagCls(c.tag)}`}>{c.tag}</span>}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right ${dv.cellSub}`}>{c.mgr} 명</td>
                  <td className={`px-4 py-3 text-right ${dv.cellSub}`}>{c.prod} 종</td>
                  <td className={`px-4 py-3 text-right font-semibold ${dv.cellMain}`}>{c.cases} 건</td>
                  <td className={`px-4 py-3 text-right ${dv.cellSub}`}>{c.install} 건</td>
                  <td className={`px-4 py-3 text-right font-black ${c.rate >= 90 ? dv.statTone.emerald : c.rate >= 85 ? dv.statTone.fuchsia : dv.statTone.amber}`}>{c.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-xs ${dv.note}`}>※ 지역기반 선착순 매니저 풀 상시 가동. 실 BE 연동 예정.</p>
      </Card>
    </div>
  );
}
