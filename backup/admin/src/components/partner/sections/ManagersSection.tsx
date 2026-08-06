import { krw } from "@/components/ui";
import Icon from "@/components/Icon";
import { Card, Stat } from "@/components/partner/PartnerUI";

const MANAGERS = [
  { id: "MG_DIR_01", name: "이매니저", org: "본사 직영 / 서울 강북", state: "활성화 (정상)", stateTone: "emerald", exp: "2026-12-31", fee: 50000, feeNote: "리뉴얼 대상" },
  { id: "MG_DIR_02", name: "박매니저", org: "경기 지사 / 경기 수원", state: "활성화 (정상)", stateTone: "emerald", exp: "2026-12-31", fee: 50000, feeNote: "리뉴얼 대상" },
  { id: "MG_DIR_03", name: "최매니저", org: "본사 직영 / 서울 강남", state: "일시정지", stateTone: "slate", exp: "2026-08-31", fee: 0, feeNote: "비활성 휴면" },
];

/** 파트너 · 직영 관리매니저 및 유지보수비 빌링 */
export default function ManagersSection() {
  return (
    <Card title="파트너사 직영 관리매니저 및 계정 유지보수비 관리" sub="직영 매니저 계정 라이선스 및 리뉴얼 비용 청구">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat label="가동 중인 직영 매니저" value="8" unit="명" tone="sky" />
        <Stat label="차기 리뉴얼 대상" value="2" unit="명" tone="amber" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500">
              <th className="px-4 py-3 text-left font-semibold">사번</th>
              <th className="px-4 py-3 text-left font-semibold">매니저명</th>
              <th className="px-4 py-3 text-left font-semibold">소속/지역</th>
              <th className="px-4 py-3 text-left font-semibold">계정 상태</th>
              <th className="px-4 py-3 text-left font-semibold">라이선스 만료</th>
              <th className="px-4 py-3 text-right font-semibold">차기 유지보수비</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MANAGERS.map((m) => (
              <tr key={m.id} className="hover:bg-sky-50/50">
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{m.id}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{m.name}</td>
                <td className="px-4 py-3 text-slate-600">{m.org}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${m.stateTone === "emerald" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>{m.state}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{m.exp}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-slate-900">{m.fee ? krw(m.fee) : "₩0"}</span>
                  <span className="ml-1 text-xs text-slate-400">({m.feeNote})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
        <Icon name="wallet" className="h-4 w-4 shrink-0" />
        <span>정기 시스템 유지보수 비용 <b>{krw(400000)}</b>이 익월 1일 예치금 계좌에서 자동 청구(Invoice)될 예정입니다.</span>
      </div>
    </Card>
  );
}
