"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";

type Org = { idx: number; name: string; headName?: string; centerName?: string };
type MCenter = { centerId: number; centerName: string; status: string; applyDate?: string | null; approveDate?: string | null };
type Status = { role: string; managerStatus: string; managerCenterId: number | null; managerCenterName?: string; managerSdate?: string; centers?: MCenter[] };
type Term = { code: string; title: string; content: string | null };

const MAX_CENTERS = 3;

/** 내용이 HTML 태그를 포함하는지 판별 (아니면 평문 취급) */
function looksHtml(s: string) {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

/** 매니저(관리매니저) 승급 신청 — 신청지역별 상태 표시 + 3개 미만이면 지역 추가 신청 */
export default function ManagerApplyForm() {
  const router = useRouter();
  const { theme } = useBuzz();
  const [status, setStatus] = useState<Status | null>(null);
  const [divisions, setDivisions] = useState<Org[]>([]);
  const [centers, setCenters] = useState<Org[]>([]);
  const [divisionIdx, setDivisionIdx] = useState("");
  const [centerId, setCenterId] = useState("");
  const [selected, setSelected] = useState<Org[]>([]); // 이번에 신청할 활동센터
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [agree, setAgree] = useState(false);

  const loadStatus = useCallback(() => {
    return apiGet<Status>("/api/buzz/manager/status").then((r) => { if (r.data) setStatus(r.data); });
  }, []);

  useEffect(() => {
    loadStatus();
    apiGet<Org[]>("/api/buzz/manager/divisions").then((r) => { if (r.data) setDivisions(r.data); });
    apiGet<Term>("/api/public/terms/MANAGER").then((r) => { if (r.data) setTerm(r.data); });
  }, [loadStatus]);

  // 본부 변경 → 센터 목록 로드
  useEffect(() => {
    setCenterId("");
    if (!divisionIdx) { setCenters([]); return; }
    apiGet<Org[]>(`/api/buzz/manager/centers?divisionIdx=${divisionIdx}`).then((r) => { if (r.data) setCenters(r.data); });
  }, [divisionIdx]);

  const appliedCenters = status?.centers ?? [];
  const appliedIds = new Set(appliedCenters.map((c) => c.centerId));
  const appliedCount = appliedCenters.length;
  const remaining = MAX_CENTERS - appliedCount;         // 추가 신청 가능 개수
  const hasApplied = appliedCount > 0;
  const canApplyMore = remaining > 0;

  function addCenter() {
    const id = Number(centerId);
    if (!id) return;
    if (appliedIds.has(id)) { setNotice("이미 신청한 센터입니다."); return; }
    if (selected.some((s) => s.idx === id)) { setNotice("이미 추가된 센터입니다."); return; }
    if (selected.length >= remaining) { setNotice(`추가로 신청 가능한 센터는 ${remaining}개입니다.`); return; }
    const c = centers.find((x) => x.idx === id);
    if (c) { setSelected((arr) => [...arr, c]); setCenterId(""); setNotice(null); }
  }
  const removeCenter = (idx: number) => setSelected((arr) => arr.filter((s) => s.idx !== idx));

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null); setOkMsg(null);
    if (selected.length === 0) { setNotice("추가로 신청할 활동 센터를 1개 이상 선택해 주세요."); return; }
    if (!agree) { setNotice("관리매니저 이용약관에 동의해 주세요."); return; }
    setSaving(true);
    const res = await apiPost<{ message: string }>("/api/buzz/manager/apply", { centerIds: selected.map((s) => s.idx) });
    setSaving(false);
    if (res.ok) {
      setOkMsg(res.data?.message ?? "매니저 신청이 접수되었습니다.");
      setSelected([]); setDivisionIdx(""); setCenterId(""); setAgree(false);
      await loadStatus();
    } else {
      setNotice(res.message ?? "신청에 실패했습니다.");
    }
  }

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${theme.input}`;

  return (
    <div className="space-y-5">
      <button onClick={() => router.push("/buzz/network")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${theme.cancelBtn}`}>← 네트워크로</button>

      {/* 신청 현황 — 신청한 지역별 상태 */}
      {hasApplied && (
        <Card title="매니저 신청 현황" sub={`신청 지역 ${appliedCount}개 / 최대 ${MAX_CENTERS}개`}>
          <ul className="space-y-2">
            {appliedCenters.map((c) => (
              <li key={c.centerId} className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm ${theme.chipBox}`}>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${c.status === "Y" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {c.status === "Y" ? "승인" : "심사중"}
                </span>
                <span className="font-semibold">{c.centerName}</span>
                {c.approveDate ? <span className="text-xs opacity-60">· 승인 {c.approveDate}</span>
                  : c.applyDate ? <span className="text-xs opacity-60">· 신청 {c.applyDate}</span> : null}
              </li>
            ))}
          </ul>
          {okMsg && <p className={`mt-3 text-sm font-semibold ${theme.statTone.green}`}>{okMsg}</p>}
          {!canApplyMore && <p className="mt-3 text-xs opacity-70">최대 {MAX_CENTERS}개 지역에 모두 신청되었습니다.</p>}
        </Card>
      )}

      {/* 신청 폼 — 3개 미만이면 (추가) 신청 가능 */}
      {canApplyMore && (
        <Card
          title={hasApplied ? "활동 지역 추가 신청" : "관리매니저 신청하기"}
          sub={hasApplied
            ? `현재 ${appliedCount}개 신청됨 · ${remaining}개 지역을 더 신청할 수 있습니다.`
            : `활동할 센터를 최대 ${MAX_CENTERS}개까지 선택해 신청하세요. 각 센터의 승인 시 해당 지역에서 활동할 수 있습니다.`}
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>지역본부</p>
              <select className={inputCls} value={divisionIdx} onChange={(e) => setDivisionIdx(e.target.value)}>
                <option value="">지역본부 선택</option>
                {divisions.map((d) => <option key={d.idx} value={d.idx}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>활동 센터 * <span className="font-normal opacity-70">({remaining}개 더 신청 가능, 선택 후 [추가])</span></p>
              <div className="flex gap-2">
                <select className={inputCls} value={centerId} disabled={!divisionIdx || selected.length >= remaining} onChange={(e) => setCenterId(e.target.value)}>
                  <option value="">{!divisionIdx ? "지역본부 먼저 선택" : centers.length ? "센터 선택" : "센터 없음"}</option>
                  {centers.filter((c) => !selected.some((s) => s.idx === c.idx) && !appliedIds.has(c.idx)).map((c) => <option key={c.idx} value={c.idx}>{c.name}</option>)}
                </select>
                <button type="button" onClick={addCenter} disabled={!centerId || selected.length >= remaining}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 ${theme.outlineBtn}`}>추가</button>
              </div>
              {selected.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.map((s) => (
                    <span key={s.idx} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${theme.chipBox}`}>
                      {s.name}
                      <button type="button" onClick={() => removeCenter(s.idx)} className="opacity-60 hover:opacity-100" aria-label="제거">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* 관리매니저 이용약관 (본사 [약관설정] MANAGER) */}
            <div>
              <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>관리매니저 이용약관 *</p>
              {term?.content && looksHtml(term.content) ? (
                <div className={`rte-content max-h-56 overflow-y-auto rounded-lg border px-4 py-3 text-xs leading-relaxed ${theme.input}`}
                  dangerouslySetInnerHTML={{ __html: term.content }} />
              ) : (
                <div className={`max-h-56 overflow-y-auto rounded-lg border px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${theme.input}`}>
                  {term?.content ? term.content : "등록된 약관 내용이 없습니다."}
                </div>
              )}
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4" />
                <span>위 관리매니저 이용약관을 확인하였으며 이에 동의합니다.</span>
              </label>
            </div>
            {notice && <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-500 ring-1 ring-red-500/30">{notice}</div>}
            <div className="flex justify-end">
              <button type="submit" disabled={saving || !agree} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${theme.primaryBtn}`}>
                {saving ? "신청 중…" : hasApplied ? "추가 신청하기" : "신청하기"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
