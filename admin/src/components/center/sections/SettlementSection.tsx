import { Card, Stat, ct } from "@/components/center/CenterUI";
import { krw } from "@/components/ui";

const LEDGER = [
  { date: "2026-07-11", who: "김버즈 (버즈)", product: "AI 청기 시스템", type: "MP_CONFIRMED", track: "소속", amount: 50_000 },
  { date: "2026-07-11", who: "이매니저 (매니저)", product: "스마트 상점 솔루션", type: "MP_CONFIRMED", track: "관리", amount: 100_000 },
  { date: "2026-07-10", who: "박버즈 (버즈)", product: "K-중식 식자재", type: "CP_READY", track: "소속", amount: 20_000 },
  { date: "2026-07-09", who: "최매니저 (매니저)", product: "AI 청기 시스템", type: "ROLLBACK_CANCEL", track: "관리", amount: -80_000 },
];
const badge = (t: string) => t === "MP_CONFIRMED" ? "bg-emerald-500/20 text-emerald-300" : t === "CP_READY" ? "bg-amber-500/20 text-amber-300" : t === "ROLLBACK_CANCEL" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300";

/** 센터 정산 원장 — 소속(버즈)/관리(매니저) 배정 전표 (Insert-Only, mock) */
export default function SettlementSection() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="이번달 CP 예정(센터)" value={krw(24_800_000)} tone="gold" />
        <Stat label="이번달 MP 확정(센터)" value={krw(11_500_000)} tone="emerald" />
        <Stat label="역정산(취소/반품)" value={krw(-620_000)} tone="amber" />
      </div>
      <Card title="센터 정산 원장 (Insert-Only)" sub="한 번 기록된 전표는 수정/삭제하지 않고 (−)전표로 상쇄" right={<button className={`rounded-lg px-3 py-2 text-xs font-bold ${ct.outlineBtn}`}>원장 다운로드</button>}>
        <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className={`text-xs ${ct.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">일자</th>
                <th className="px-4 py-3 text-left font-semibold">대상</th>
                <th className="px-4 py-3 text-left font-semibold">상품</th>
                <th className="px-4 py-3 text-center font-semibold">트랙</th>
                <th className="px-4 py-3 text-center font-semibold">전표구분</th>
                <th className="px-4 py-3 text-right font-semibold">센터 배정액</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${ct.divide}`}>
              {LEDGER.map((r, i) => (
                <tr key={i} className={ct.rowHover}>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{r.date}</td>
                  <td className={`px-4 py-3 font-semibold ${ct.cellMain}`}>{r.who}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{r.product}</td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ct.badge}`}>{r.track}</span></td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge(r.type)}`}>{r.type}</span></td>
                  <td className={`px-4 py-3 text-right font-black ${r.amount < 0 ? "text-red-300" : ct.statTone.emerald}`}>{krw(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-xs ${ct.note}`}>※ `settlement_ledger` 실연동 예정. 소속센터/관리센터 이원 라우팅(루트 CLAUDE.md §3-4).</p>
      </Card>
    </div>
  );
}
