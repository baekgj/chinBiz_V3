import { Card, Stat, dv } from "@/components/division/DivisionUI";
import { krw } from "@/components/ui";

/** 수당 정산 원장 — 본부 배정 전표(Insert-only) 로그 (mock) */
const LEDGER = [
  { date: "2026-07-11", center: "강남 제1센터", product: "깔끔돌이 돌솥 세척기", type: "MP_CONFIRMED", track: "1차", amount: 24_000 },
  { date: "2026-07-11", center: "수원 총괄센터", product: "AI 청기 시스템", type: "MP_CONFIRMED", track: "2차", amount: 18_000 },
  { date: "2026-07-10", center: "마포 기술센터", product: "명동 스마트 상점 솔루션", type: "CP_READY", track: "1차", amount: 28_000 },
  { date: "2026-07-09", center: "강동 인프라센터", product: "깔끔돌이 돌솥 세척기", type: "ROLLBACK_CANCEL", track: "1차", amount: -24_000 },
];

const badge = (t: string) => t === "MP_CONFIRMED" ? "bg-emerald-500/20 text-emerald-300"
  : t === "CP_READY" ? "bg-violet-500/20 text-violet-300"
  : t === "ROLLBACK_CANCEL" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300";

export default function SettlementSection() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="이번달 CP 예정(본부)" value={krw(84_500_000)} tone="violet" />
        <Stat label="이번달 MP 확정(본부)" value={krw(38_200_000)} tone="emerald" />
        <Stat label="역정산(취소/반품)" value={krw(-1_240_000)} tone="amber" />
      </div>

      <Card
        title="본부 정산 원장 (Insert-Only)"
        sub="한 번 기록된 전표는 수정/삭제하지 않고 (−)전표로 상쇄"
        right={<button className={`rounded-lg px-3 py-2 text-xs font-bold ${dv.outlineBtn}`}>매트릭스 로그 다운로드</button>}
      >
        <div className={`overflow-x-auto rounded-xl border ${dv.tableWrap}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className={`text-xs ${dv.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">일자</th>
                <th className="px-4 py-3 text-left font-semibold">센터</th>
                <th className="px-4 py-3 text-left font-semibold">상품</th>
                <th className="px-4 py-3 text-center font-semibold">트랙</th>
                <th className="px-4 py-3 text-center font-semibold">전표구분</th>
                <th className="px-4 py-3 text-right font-semibold">본부 배정액</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dv.divide}`}>
              {LEDGER.map((r, i) => (
                <tr key={i} className={dv.rowHover}>
                  <td className={`px-4 py-3 ${dv.cellSub}`}>{r.date}</td>
                  <td className={`px-4 py-3 font-semibold ${dv.cellMain}`}>{r.center}</td>
                  <td className={`px-4 py-3 ${dv.cellSub}`}>{r.product}</td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${dv.badge}`}>{r.track}</span></td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge(r.type)}`}>{r.type}</span></td>
                  <td className={`px-4 py-3 text-right font-black ${r.amount < 0 ? "text-red-300" : dv.statTone.emerald}`}>{krw(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-xs ${dv.note}`}>※ `settlement_ledger` 실연동 예정. 소속본부/관리본부 이원 라우팅(루트 CLAUDE.md §3-4).</p>
      </Card>
    </div>
  );
}
