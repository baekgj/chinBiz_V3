"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

// center_code 행 + 할당된 본부장/센터장(fix_idx)
type Slot = {
  idx: number; name: string; headCode: string | null; centerCode: string | null;
  assigneeId: number | null; assigneeUserId: string | null; assigneeName: string | null; assigneePhone: string | null;
};
type Candidate = { id: number; userId: string; name: string; phone: string | null; centerName: string | null };

const th = "px-3 py-2 text-left text-[11px] font-bold text-slate-400";
const td = "px-3 py-2 text-sm text-slate-200";

/** 본사 [조직망 및 영업 관리]-[본부ᆞ센터 리스트]: 본부/센터 코드별 본부장·센터장 할당 관리 */
export default function OrgListPage() {
  const [divisions, setDivisions] = useState<Slot[]>([]);
  const [selDiv, setSelDiv] = useState<Slot | null>(null);
  const [centers, setCenters] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // [등록] 팝업
  const [pick, setPick] = useState<Slot | null>(null);
  const [cands, setCands] = useState<Candidate[] | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDivisions = useCallback(async () => {
    const r = await apiGet<{ content: Slot[] }>("/api/org/org-list/divisions");
    if (r.data) setDivisions(r.data.content);
    setLoading(false);
  }, []);

  const loadCenters = useCallback(async (div: Slot) => {
    const r = await apiGet<Slot[]>(`/api/org/org-list/centers?divisionIdx=${div.idx}`);
    setCenters(r.data ?? []);
  }, []);

  useEffect(() => { loadDivisions(); }, [loadDivisions]);
  useEffect(() => { if (selDiv) loadCenters(selDiv); else setCenters([]); }, [selDiv, loadCenters]);

  async function openPick(s: Slot) {
    setMsg(null); setPick(s); setCands(null);
    const r = await apiGet<Candidate[]>(`/api/org/org-list/${s.idx}/candidates`);
    setCands(r.data ?? []);
  }

  async function refresh(s: Slot) {
    if (s.centerCode == null) await loadDivisions();
    if (selDiv) await loadCenters(selDiv);
  }

  async function assign(c: Candidate) {
    if (!pick) return;
    setBusy(true);
    const r = await apiPost(`/api/org/org-list/${pick.idx}/assign`, { userId: c.id });
    setBusy(false);
    if (!r.ok) { setMsg(r.message ?? "등록에 실패했습니다."); return; }
    const s = pick; setPick(null);
    await refresh(s);
  }

  async function unassign(s: Slot) {
    const kind = s.centerCode == null ? "본부장" : "센터장";
    if (!confirm(`[${s.name}] ${kind}(${s.assigneeName ?? ""}) 할당을 삭제할까요?`)) return;
    const r = await apiDelete(`/api/org/org-list/${s.idx}/assign`);
    if (!r.ok) { setMsg(r.message ?? "삭제에 실패했습니다."); return; }
    await refresh(s);
  }

  const actionBtn = (s: Slot) => s.assigneeId ? (
    <button onClick={(e) => { e.stopPropagation(); unassign(s); }} className="rounded-md border border-danger/50 px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger/10">삭제</button>
  ) : (
    <button onClick={(e) => { e.stopPropagation(); openPick(s); }} className="rounded-md border border-brand-500 px-2.5 py-1 text-xs font-bold text-brand-400 hover:bg-brand-600/15">등록</button>
  );

  const unassignedCell = <span className="text-slate-500">(미등록)</span>;

  return (
    <div className="space-y-4 animate-float-up">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href="/master/organization/register" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">본부ᆞ센터등록</Link>
      </div>

      {msg && <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{msg}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="본부리스트" sub="본부명/코드를 클릭하면 소속 센터가 표시됩니다" />
          {loading ? <p className="py-10 text-center text-sm text-slate-500">불러오는 중…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="border-b border-line"><tr>
                  <th className={th}>코드</th><th className={th}>본부명</th><th className={th}>ID</th><th className={th}>본부장명</th><th className={th}>연락처</th><th className={th}></th>
                </tr></thead>
                <tbody>
                  {divisions.map((d) => (
                    <tr key={d.idx} className={`border-b border-line/60 ${selDiv?.idx === d.idx ? "bg-brand-600/10" : ""}`}>
                      <td className={td}><button onClick={() => setSelDiv(d)} className="font-mono text-brand-300 hover:underline">{d.headCode}</button></td>
                      <td className={td}><button onClick={() => setSelDiv(d)} className="font-semibold text-white hover:underline">{d.name}</button></td>
                      {d.assigneeId ? (<>
                        <td className={td}>{d.assigneeUserId}</td><td className={td}>{d.assigneeName}</td><td className={td}>{d.assigneePhone ?? "-"}</td>
                      </>) : (<td className={td} colSpan={3}>{unassignedCell}</td>)}
                      <td className={`${td} text-right`}>{actionBtn(d)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title={selDiv ? `${selDiv.name} 센터리스트` : "센터리스트"} sub={selDiv ? undefined : "왼쪽에서 본부를 선택하세요"} />
          {!selDiv ? <p className="py-10 text-center text-sm text-slate-500">선택된 본부가 없습니다.</p> : centers.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">소속 센터가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="border-b border-line"><tr>
                  <th className={th}>센터코드</th><th className={th}>센터명</th><th className={th}>ID</th><th className={th}>센터장명</th><th className={th}>연락처</th><th className={th}></th>
                </tr></thead>
                <tbody>
                  {centers.map((c) => (
                    <tr key={c.idx} className="border-b border-line/60">
                      <td className={`${td} font-mono text-slate-300`}>{c.centerCode}</td>
                      <td className={`${td} font-semibold text-white`}>{c.name}</td>
                      {c.assigneeId ? (<>
                        <td className={td}>{c.assigneeUserId}</td><td className={td}>{c.assigneeName}</td><td className={td}>{c.assigneePhone ?? "-"}</td>
                      </>) : (<td className={td} colSpan={3}>{unassignedCell}</td>)}
                      <td className={`${td} text-right`}>{actionBtn(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* [등록] 후보 선택 팝업 */}
      {pick && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => !busy && setPick(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-line bg-navy-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-black text-white">
              [{pick.name}] {pick.centerCode == null ? "본부장" : "센터장"} 등록
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              <Badge tone="brand">중복등록불가</Badge>{" "}
              {pick.centerCode == null ? "본부장으로 미할당된 본부 계정만" : "센터장으로 미할당된 센터 계정만"} 표시됩니다.
            </p>
            <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-line">
              {cands == null ? <p className="py-8 text-center text-sm text-slate-500">불러오는 중…</p> : cands.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">선택 가능한 계정이 없습니다.</p>
              ) : cands.map((c) => (
                <button key={c.id} disabled={busy} onClick={() => assign(c)}
                  className="flex w-full items-center gap-3 border-b border-line/60 px-4 py-2.5 text-left last:border-0 hover:bg-navy-800 disabled:opacity-50">
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className="text-xs text-slate-400">{c.userId}</span>
                  <span className="text-xs text-slate-500">{c.phone ?? ""}</span>
                  <span className="ml-auto text-[11px] text-slate-500">{c.centerName ?? "소속 없음"}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button disabled={busy} onClick={() => setPick(null)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-navy-800">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
