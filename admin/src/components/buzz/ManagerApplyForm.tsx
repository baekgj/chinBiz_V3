"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";

type Org = { idx: number; name: string; headName?: string; centerName?: string };
type Status = { role: string; managerStatus: string; managerCenterId: number | null; managerCenterName?: string; managerSdate?: string };

/** 매니저(관리매니저) 승급 신청 — 지역본부 → 센터 선택 후 신청 */
export default function ManagerApplyForm() {
  const router = useRouter();
  const { theme } = useBuzz();
  const [status, setStatus] = useState<Status | null>(null);
  const [divisions, setDivisions] = useState<Org[]>([]);
  const [centers, setCenters] = useState<Org[]>([]);
  const [divisionIdx, setDivisionIdx] = useState("");
  const [centerId, setCenterId] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    apiGet<Status>("/api/buzz/manager/status").then((r) => { if (r.data) setStatus(r.data); });
    apiGet<Org[]>("/api/buzz/manager/divisions").then((r) => { if (r.data) setDivisions(r.data); });
  }, []);

  // 본부 변경 → 센터 목록 로드
  useEffect(() => {
    setCenterId("");
    if (!divisionIdx) { setCenters([]); return; }
    apiGet<Org[]>(`/api/buzz/manager/centers?divisionIdx=${divisionIdx}`).then((r) => { if (r.data) setCenters(r.data); });
  }, [divisionIdx]);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!divisionIdx) { setNotice("지역본부를 선택해 주세요."); return; }
    if (!centerId) { setNotice("센터를 선택해 주세요."); return; }
    setSaving(true);
    const res = await apiPost<{ message: string }>("/api/buzz/manager/apply", { divisionIdx: Number(divisionIdx), centerId: Number(centerId) });
    setSaving(false);
    if (res.ok) { setDone(true); setNotice(res.data?.message ?? "매니저 신청이 접수되었습니다."); }
    else setNotice(res.message ?? "신청에 실패했습니다.");
  }

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${theme.input}`;
  const already = status && (status.managerStatus === "I" || status.managerStatus === "Y");

  return (
    <div className="space-y-5">
      <button onClick={() => router.push("/buzz/network")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${theme.cancelBtn}`}>← 네트워크로</button>

      {done || already ? (
        <Card title="매니저 신청 현황">
          <div className={`rounded-xl border p-4 ${theme.chipBox}`}>
            <p className="text-sm font-bold">
              {status?.managerStatus === "Y" ? "✓ 매니저로 승인되었습니다." : "매니저 신청이 접수되어 심사 중입니다."}
            </p>
            {status?.managerCenterName && <p className="mt-1 text-xs">신청 센터 · {status.managerCenterName}</p>}
            {status?.managerSdate && <p className="text-xs">신청일 · {status.managerSdate}</p>}
          </div>
          {notice && <p className={`mt-3 text-sm ${theme.statTone.green}`}>{notice}</p>}
        </Card>
      ) : (
        <Card title="관리매니저 신청하기" sub="지역본부와 관리 센터를 선택해 신청하세요. 승인 시 관리매니저로 승급됩니다.">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>지역본부 *</p>
              <select className={inputCls} value={divisionIdx} onChange={(e) => setDivisionIdx(e.target.value)}>
                <option value="">지역본부 선택</option>
                {divisions.map((d) => <option key={d.idx} value={d.idx}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>센터 *</p>
              <select className={inputCls} value={centerId} disabled={!divisionIdx} onChange={(e) => setCenterId(e.target.value)}>
                <option value="">{!divisionIdx ? "지역본부 먼저 선택" : centers.length ? "센터 선택" : "센터 없음"}</option>
                {centers.map((c) => <option key={c.idx} value={c.idx}>{c.name}</option>)}
              </select>
            </div>
            {notice && <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-500 ring-1 ring-red-500/30">{notice}</div>}
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${theme.primaryBtn}`}>
                {saving ? "신청 중…" : "신청하기"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
