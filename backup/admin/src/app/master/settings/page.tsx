"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import Icon from "@/components/Icon";
import { apiGet, apiPut } from "@/lib/api";

const ROLES = [
  { code: "ROLE_MD", name: "담당자 A · 상품/영업 관리자", perms: "파트너사 관리, 상품 관리", tone: "brand" as const },
  { code: "ROLE_OP", name: "담당자 B · 조직망 운영 관리자", perms: "본부·센터·매니저·버즈회원 관리", tone: "pos" as const },
  { code: "ROLE_FIN", name: "담당자 C · 정산/재무 관리자", perms: "수당관리, 파트너 예치금 (OTP 2차 인증)", tone: "warn" as const },
  { code: "ROLE_CS", name: "담당자 D · CS/민원 관리자", perms: "민원관리, 계약 상태 강제 조정(Freeze)", tone: "danger" as const },
];

const TOGGLES = [
  { key: "fcfs", label: "지역기반 선착순 배정", desc: "법정동 코드 기반 매니저 자동 매칭", on: true },
  { key: "rematch", label: "방치 DB 자동 리매칭", desc: "24시간 미수락 시 자동 회수 및 재배정", on: true },
  { key: "bypass", label: "센터 취급 OFF 우회", desc: "취급 안 함 상품 → 본사/연합 자동 라우팅", on: true },
  { key: "cross", label: "크로스 센터 디스패치", desc: "광역 매니저 풀 (소속센터 무관 매칭)", on: false },
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.key, t.on])),
  );

  // 추천마일리지 지급 설정 (DB 연동)
  const [buzzCp, setBuzzCp] = useState("500");
  const [refCp, setRefCp] = useState("500");
  const [savingMil, setSavingMil] = useState(false);
  const [milMsg, setMilMsg] = useState<string | null>(null);
  useEffect(() => {
    apiGet<Record<string, string>>("/api/org/app-settings").then((r) => {
      if (r.ok && r.data) {
        if (r.data.join_cp_buzz != null) setBuzzCp(r.data.join_cp_buzz);
        if (r.data.join_cp_referrer != null) setRefCp(r.data.join_cp_referrer);
      }
    });
  }, []);
  async function saveMileage() {
    setSavingMil(true); setMilMsg(null);
    const r = await apiPut<{ message: string }>("/api/org/app-settings", {
      join_cp_buzz: String(parseInt(buzzCp || "0", 10) || 0),
      join_cp_referrer: String(parseInt(refCp || "0", 10) || 0),
    });
    setSavingMil(false);
    setMilMsg(r.ok ? "저장되었습니다." : (r.message || "저장 실패"));
  }

  const milInput = "w-32 rounded-lg border border-line bg-navy-950 px-3 py-2 text-right text-sm font-bold text-white outline-none focus:border-brand-500";

  return (
    <div className="grid gap-5 lg:grid-cols-2 animate-float-up">
      {/* 추천마일리지 지급 (DB 연동) */}
      <Card className="lg:col-span-2">
        <SectionTitle title="추천마일리지 지급" sub="회원가입 시 추천인 id 등록에 따라 가입 버즈회원·추천인 회원에게 지급할 CP" />
        <div className="rounded-xl bg-navy-800 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-200">추천인 id 등록 시 지급 CP</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              가입 버즈회원
              <input type="number" min={0} value={buzzCp} onChange={(e) => setBuzzCp(e.target.value)} className={milInput} />
              <span className="font-semibold text-brand-300">CP</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              추천 ID 회원
              <input type="number" min={0} value={refCp} onChange={(e) => setRefCp(e.target.value)} className={milInput} />
              <span className="font-semibold text-brand-300">CP</span>
            </label>
            <div className="ml-auto flex items-center gap-3">
              {milMsg && <span className="text-sm font-semibold text-brand-300">{milMsg}</span>}
              <button onClick={saveMileage} disabled={savingMil}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
                {savingMil ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">* 추천인 id 미입력·미존재 시 추천인은 <b className="text-slate-300">dukebaek</b>으로 지정되어 양쪽 모두 CP가 지급됩니다. (allowance type=JOIN·status=CP)</p>
        </div>
      </Card>

      {/* RBAC */}
      <Card>
        <SectionTitle title="역할 기반 접근 제어 (RBAC)" sub="마스터 어드민 + 4대 담당자 권한 분리" />
        <ul className="space-y-2.5">
          {ROLES.map((r) => (
            <li key={r.code} className="rounded-xl bg-navy-800 p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon name="shield" className="h-4 w-4 text-brand-400" />
                  <span className="text-sm font-bold text-white">{r.name}</span>
                </span>
                <Badge tone={r.tone}>{r.code}</Badge>
              </div>
              <p className="mt-1.5 pl-6 text-xs text-slate-400">{r.perms}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">* 개인정보(전화/계좌)는 마스킹 처리 + 다운로드 로깅. 모든 행위는 admin_audit_log에 Insert-Only 기록.</p>
      </Card>

      {/* 배정 알고리즘 커스텀 */}
      <Card>
        <SectionTitle title="배정 알고리즘 커스텀" sub="선착순·우회·리매칭 정책 토글" />
        <ul className="space-y-2.5">
          {TOGGLES.map((t) => {
            const on = toggles[t.key];
            return (
              <li key={t.key} className="flex items-center justify-between rounded-xl bg-navy-800 p-3.5">
                <div>
                  <p className="text-sm font-bold text-white">{t.label}</p>
                  <p className="text-xs text-slate-400">{t.desc}</p>
                </div>
                <button
                  onClick={() => setToggles((p) => ({ ...p, [t.key]: !p[t.key] }))}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand-500" : "bg-navy-600"}`}
                  aria-pressed={on}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-slate-500">* 데모 토글입니다. 정책 변경은 BE 연동 시 sales_routing_rule 등에 반영됩니다.</p>
      </Card>
    </div>
  );
}
