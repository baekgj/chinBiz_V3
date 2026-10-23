"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { apiGet, apiPut } from "@/lib/api";

/** 본사 [시스템설정]-[관리비설정] — 매니저/센터 월·연회비, 파트너 입점비 (원) + 결제 시 상위 조직 수당지급액. app-settings 연동 */

const FEE_KEYS = [
  "fee_manager_monthly", "fee_manager_yearly", "fee_center_monthly", "fee_center_yearly", "fee_partner_entry",
  // 회비/입점비 결제 시 수당지급 (allowance type=MEMBERSHIP, status=CP)
  "fee_reward_manager_center_pct", "fee_reward_manager_division_pct", "fee_reward_center_division_pct", "fee_reward_partner_division_pct",
] as const;
type FeeKey = (typeof FEE_KEYS)[number];

const inputCls = "w-40 rounded-lg border border-line bg-navy-950 px-3 py-2 text-right text-sm font-bold text-white outline-none focus:border-brand-500";
const rewardCls = "w-28 rounded-lg border border-line bg-navy-950 px-3 py-1.5 text-right text-sm font-bold text-white outline-none focus:border-brand-500";

export default function FeeSettingsManager() {
  const [fees, setFees] = useState<Record<FeeKey, string>>(
    () => Object.fromEntries(FEE_KEYS.map((k) => [k, "0"])) as Record<FeeKey, string>,
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Record<string, string>>("/api/org/app-settings").then((r) => {
      if (r.ok && r.data) {
        setFees((prev) => {
          const next = { ...prev };
          FEE_KEYS.forEach((k) => { if (r.data![k] != null) next[k] = r.data![k]; });
          return next;
        });
      }
    });
  }, []);

  // 회비/입점비 = 원(정수), 수당지급(_pct) = % (소수 둘째자리까지, 0~100)
  const isPct = (k: FeeKey) => k.endsWith("_pct");
  const set = (k: FeeKey) => (v: string) => setFees((p) => {
    if (!isPct(k)) return { ...p, [k]: v.replace(/[^\d]/g, "") };
    const s = v.replace(/[^\d.]/g, "");
    if (!/^\d{0,3}(\.\d{0,2})?$/.test(s) || Number(s) > 100) return p;
    return { ...p, [k]: s };
  });

  async function save() {
    setSaving(true); setMsg(null);
    const payload = Object.fromEntries(FEE_KEYS.map((k) => [k, isPct(k) ? String(Number(fees[k] || "0") || 0) : String(parseInt(fees[k] || "0", 10) || 0)]));
    const r = await apiPut<{ message: string }>("/api/org/app-settings", payload);
    setSaving(false);
    setMsg(r.ok ? "저장되었습니다." : (r.message || "저장 실패"));
  }

  const won = (v: string) => Number(v || "0").toLocaleString("ko-KR");

  return (
    <div className="animate-float-up">
      <Card>
        <SectionTitle title="관리비설정" sub="매니저·센터 회원의 월/연회비와 파트너사 입점비를 설정합니다. (단위: 원)" />

        <div className="space-y-4">
          {/* 매니저회원 */}
          <div className="rounded-xl bg-navy-800 p-4">
            <p className="mb-3 text-sm font-bold text-white">매니저회원 <span className="font-normal text-slate-400">· MANAGER</span></p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                월회비
                <input inputMode="numeric" value={fees.fee_manager_monthly} onChange={(e) => set("fee_manager_monthly")(e.target.value)} className={inputCls} />
                <span className="font-semibold text-brand-300">원</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                연회비
                <input inputMode="numeric" value={fees.fee_manager_yearly} onChange={(e) => set("fee_manager_yearly")(e.target.value)} className={inputCls} />
                <span className="font-semibold text-brand-300">원</span>
              </label>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-brand-500/30 bg-navy-900/60 px-4 py-2.5 lg:ml-auto">
                <span className="text-xs font-bold text-brand-300">매니저회원 회비 결제시</span>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  소속센터
                  <input inputMode="decimal" value={fees.fee_reward_manager_center_pct} onChange={(e) => set("fee_reward_manager_center_pct")(e.target.value)} className={rewardCls} />
                  <span className="text-slate-400">% 수당지급</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  소속본부
                  <input inputMode="decimal" value={fees.fee_reward_manager_division_pct} onChange={(e) => set("fee_reward_manager_division_pct")(e.target.value)} className={rewardCls} />
                  <span className="text-slate-400">% 수당지급</span>
                </label>
              </div>
            </div>
          </div>

          {/* 센터회원 */}
          <div className="rounded-xl bg-navy-800 p-4">
            <p className="mb-3 text-sm font-bold text-white">센터회원 <span className="font-normal text-slate-400">· CENTER</span></p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                월회비
                <input inputMode="numeric" value={fees.fee_center_monthly} onChange={(e) => set("fee_center_monthly")(e.target.value)} className={inputCls} />
                <span className="font-semibold text-brand-300">원</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                연회비
                <input inputMode="numeric" value={fees.fee_center_yearly} onChange={(e) => set("fee_center_yearly")(e.target.value)} className={inputCls} />
                <span className="font-semibold text-brand-300">원</span>
              </label>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-brand-500/30 bg-navy-900/60 px-4 py-2.5 lg:ml-auto">
                <span className="text-xs font-bold text-brand-300">센터회원 회비 결제시</span>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  소속본부
                  <input inputMode="decimal" value={fees.fee_reward_center_division_pct} onChange={(e) => set("fee_reward_center_division_pct")(e.target.value)} className={rewardCls} />
                  <span className="text-slate-400">% 수당지급</span>
                </label>
              </div>
            </div>
          </div>

          {/* 파트너 */}
          <div className="rounded-xl bg-navy-800 p-4">
            <p className="mb-3 text-sm font-bold text-white">파트너 <span className="font-normal text-slate-400">· PARTNER</span></p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                입점비
                <input inputMode="numeric" value={fees.fee_partner_entry} onChange={(e) => set("fee_partner_entry")(e.target.value)} className={inputCls} />
                <span className="font-semibold text-brand-300">원</span>
              </label>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-brand-500/30 bg-navy-900/60 px-4 py-2.5 lg:ml-auto">
                <span className="text-xs font-bold text-brand-300">파트너 회원 입점비 결제시</span>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  소속본부
                  <input inputMode="decimal" value={fees.fee_reward_partner_division_pct} onChange={(e) => set("fee_reward_partner_division_pct")(e.target.value)} className={rewardCls} />
                  <span className="text-slate-400">% 수당지급</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          {msg && <span className="text-sm font-semibold text-brand-300">{msg}</span>}
          <button onClick={save} disabled={saving}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          * 설정된 금액: 매니저 월 {won(fees.fee_manager_monthly)}원 / 연 {won(fees.fee_manager_yearly)}원,
          센터 월 {won(fees.fee_center_monthly)}원 / 연 {won(fees.fee_center_yearly)}원,
          파트너 입점비 {won(fees.fee_partner_entry)}원. (매니저·센터·파트너 admin 결제 메뉴에서 사용 예정)
        </p>
        <p className="mt-1 text-xs text-slate-500">
          * 수당지급: 결제 완료 시 회비/입점비 공급가액(부가세 제외) × 설정 %(원 미만 절사)를 소속센터/소속본부(파트너는 등록 시 선택한 영업본부)에 CP 수당(MEMBERSHIP)으로 자동 적립되고, 수당담당자에게 알람이 발송됩니다.
        </p>
      </Card>
    </div>
  );
}
