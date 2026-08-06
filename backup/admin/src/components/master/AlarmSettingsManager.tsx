"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { apiGet, apiPut } from "@/lib/api";

type Target = { target: string; targetLabel: string; enabled: boolean; message: string };
type Process = { code: string; name: string; trigger: string; targets: Target[] };

export default function AlarmSettingsManager() {
  const [list, setList] = useState<Process[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () =>
    apiGet<Process[]>("/api/org/alarm-settings").then((r) => {
      if (r.ok && r.data) { setList(r.data); if (!sel && r.data[0]) pick(r.data[0]); }
    });
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  function pick(p: Process) {
    setSel(p.code);
    setTargets(p.targets.map((t) => ({ ...t })));
    setMsg(null);
  }

  function setT(i: number, patch: Partial<Target>) {
    setTargets((arr) => arr.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  async function save() {
    if (!sel) return;
    setSaving(true); setMsg(null);
    const r = await apiPut<{ message: string }>(`/api/org/alarm-settings/${sel}`, {
      targets: targets.map((t) => ({ target: t.target, enabled: t.enabled, message: t.message })),
    });
    setSaving(false);
    if (r.ok) { setMsg("저장되었습니다."); load(); } else setMsg(r.message || "저장 실패");
  }

  const cur = list.find((p) => p.code === sel);

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle title="알람설정" sub="프로세스별로 알람을 받을 대상(버즈·매니저·센터·본부·추천인·파트너 등)과 알람 문구를 등록·수정" />
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* 프로세스 목록 */}
          <ul className="space-y-1">
            {list.map((p) => {
              const on = p.targets.filter((t) => t.enabled).length;
              return (
                <li key={p.code}>
                  <button onClick={() => pick(p)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${sel === p.code ? "bg-brand-600/25 text-white ring-1 ring-brand-500/40" : "text-slate-300 hover:bg-navy-800"}`}>
                    <span className="block font-bold">{p.name}</span>
                    <span className="block font-mono text-[10px] text-slate-500">{p.code} · 수신 {on}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 대상별 편집 */}
          {cur ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-navy-800 px-4 py-3">
                <p className="text-sm font-black text-white">{cur.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{cur.trigger}</p>
              </div>

              <div className="space-y-3">
                {targets.map((t, i) => (
                  <div key={t.target} className={`rounded-xl border p-3 transition-colors ${t.enabled ? "border-brand-500/40 bg-navy-900" : "border-line bg-navy-950/40"}`}>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={t.enabled} onChange={(e) => setT(i, { enabled: e.target.checked })} className="h-4 w-4" />
                      <span className={`text-sm font-bold ${t.enabled ? "text-white" : "text-slate-400"}`}>{t.targetLabel}</span>
                      <span className="font-mono text-[10px] text-slate-500">{t.target}</span>
                    </label>
                    <textarea value={t.message} onChange={(e) => setT(i, { message: e.target.value })} rows={2}
                      disabled={!t.enabled} placeholder="알람 문구 (예: OOO=회원명, ㅁㅁㅁㅁ=센터명, @@@=고객, $$$$$=수당, *****=상품, ______=주문번호)"
                      className="mt-2 w-full resize-y rounded-lg border border-line bg-navy-950 px-3 py-2 text-xs leading-relaxed text-slate-200 outline-none focus:border-brand-500 disabled:opacity-50" />
                  </div>
                ))}
              </div>

              {msg && <p className="text-sm font-semibold text-brand-300">{msg}</p>}
              <div className="flex justify-end">
                <button onClick={save} disabled={saving}
                  className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
                  {saving ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">왼쪽에서 알람 프로세스를 선택하세요.</p>}
        </div>
      </Card>
    </div>
  );
}
