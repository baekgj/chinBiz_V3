"use client";

import { useState } from "react";
import { Card, SectionTitle, Badge, StatTile, krw } from "@/components/ui";
import Icon from "@/components/Icon";

const LEDGER = [
  { tx: "TX_00102", contract: "CNT_7789", subject: "MG_042", account: "CP (예정)", amount: 450000, kind: "지급 예정", reason: "AI 청기 시스템 2차 배정", at: "2026-07-04 10:00" },
  { tx: "TX_00155", contract: "CNT_7789", subject: "MG_042", account: "CP (예정)", amount: -450000, kind: "취소 차감", reason: "고객 단순변심 취소 접수", at: "2026-07-04 15:30" },
  { tx: "TX_00156", contract: "CNT_7789", subject: "MG_042", account: "MP (확정)", amount: 50000, kind: "실비 정산", reason: "파트너사 보전 출장비 지급", at: "2026-07-04 15:30" },
];

const WITHDRAW = [
  { who: "버즈_홍길동", role: "버즈회원", amount: 1900000 },
  { who: "김매니저", role: "관리매니저", amount: 2800000 },
  { who: "강남 제1센터", role: "센터", amount: 11500000 },
];

export default function SettlementPage() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return (
      <div className="animate-float-up">
        <Card>
          <div className="flex flex-col items-center py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-800 text-brand-400">
              <Icon name="shield" className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-black text-white">민감 데이터 영역</h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              정산·재무(CP/MP 원장, 출금 승인)는 재무 담당자(ROLE_FIN)만 접근 가능하며,
              <b className="text-slate-300"> 2차 인증(OTP)</b>이 필요합니다.
            </p>
            <button
              onClick={() => setAuthed(true)}
              className="mt-5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white"
            >
              🔒 2차 인증(OTP) 진행
            </button>
            <p className="mt-2 text-[11px] text-slate-600">데모: 실제 OTP는 BE 연동 시 적용</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-float-up">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="CP 예정수당 (전체)" value="₩84.5M" />
        <StatTile label="MP 확정수당 (출금대상)" value="₩38.2M" />
        <StatTile label="출금 승인 대기" value="8" unit="건" />
        <StatTile label="민원 동결(Freeze)" value="3" unit="건" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* 정산 원장 (append-only, 역정산) */}
        <Card>
          <SectionTitle title="실시간 정산 원장 (Append-Only)" sub="취소는 (−)전표로 상쇄 — SUM=0 무결성" right={<Badge tone="brand">ROLLBACK 예시</Badge>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-slate-400">
                  <th className="px-3 py-2.5 text-left font-semibold">전표 ID</th>
                  <th className="px-3 py-2.5 text-left font-semibold">계정과목</th>
                  <th className="px-3 py-2.5 text-right font-semibold">금액</th>
                  <th className="px-3 py-2.5 text-left font-semibold">발생 사유</th>
                  <th className="px-3 py-2.5 text-left font-semibold">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {LEDGER.map((l) => (
                  <tr key={l.tx} className="hover:bg-navy-800/50">
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{l.tx}</td>
                    <td className="px-3 py-2.5"><Badge tone={l.account.startsWith("MP") ? "pos" : "brand"}>{l.account}</Badge></td>
                    <td className={`px-3 py-2.5 text-right font-bold ${l.amount < 0 ? "text-danger" : "text-slate-100"}`}>
                      {l.amount < 0 ? "−" : "+"}{krw(Math.abs(l.amount)).replace("₩", "₩")}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{l.reason}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{l.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 rounded-lg bg-navy-800 px-3 py-2 text-xs text-slate-400">
            결과: <b className="text-slate-200">SUM(CP) = 0</b> (예정수당 자동 상쇄) + 매니저 보전비 ₩50,000은 MP 확정수당에 안전하게 누적.
          </p>
        </Card>

        {/* 출금 승인 */}
        <Card>
          <SectionTitle title="MP 확정수당 출금 승인" sub="주체별 출금 요청 일괄 심사" />
          <ul className="space-y-2">
            {WITHDRAW.map((w) => (
              <li key={w.who} className="flex items-center justify-between rounded-xl bg-navy-800 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">{w.who}</p>
                  <p className="text-[11px] text-slate-500">{w.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-pos">{krw(w.amount)}</span>
                  <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500">승인</button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
