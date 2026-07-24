"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, ct } from "@/components/center/CenterUI";
import { apiGet, apiPost } from "@/lib/api";
import ManagerTabs from "@/components/center/sections/ManagerTabs";

type Applicant = {
  id: number; userId: string; name: string; phone?: string; email?: string;
  managerCenterName?: string; managerSdate?: string;
};

/** [매니저신청] — 내 센터로 매니저 신청(status=I)한 버즈 목록 + 승인 */
export default function ManagerApplicationsSection() {
  const [rows, setRows] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiGet<{ content: Applicant[] }>("/api/center/manager-applications").then((r) => {
      setRows(r.data?.content ?? []); setLoading(false);
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (id: number, name: string) => {
    if (!window.confirm(`${name} 님을 관리매니저로 승인할까요?`)) return;
    setBusy(id); setNotice(null);
    const r = await apiPost<{ message: string }>(`/api/center/manager-applications/${id}/approve`, {});
    setBusy(null);
    if (r.ok) { setNotice(r.data?.message ?? "승인되었습니다."); load(); }
    else setNotice(r.message ?? "승인에 실패했습니다.");
  };

  return (
    <div>
      <ManagerTabs />
      {notice && <div className={`mb-3 rounded-lg border px-4 py-2.5 text-sm font-semibold ${ct.tableWrap} ${ct.cellMain}`}>{notice}</div>}
      <Card title="매니저 신청" sub="내 센터로 신청한 버즈회원 (승인 시 관리매니저로 전환)">
        <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className={`text-xs ${ct.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">신청일</th>
                <th className="px-4 py-3 text-left font-semibold">아이디</th>
                <th className="px-4 py-3 text-left font-semibold">이름</th>
                <th className="px-4 py-3 text-left font-semibold">연락처</th>
                <th className="px-4 py-3 text-left font-semibold">신청 센터</th>
                <th className="px-4 py-3 text-center font-semibold">승인</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${ct.divide}`}>
              {loading ? (
                <tr><td colSpan={6} className={`px-4 py-10 text-center ${ct.note}`}>불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className={`px-4 py-10 text-center ${ct.note}`}>대기 중인 매니저 신청이 없습니다.</td></tr>
              ) : rows.map((a) => (
                <tr key={a.id} className={ct.rowHover}>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{a.managerSdate ?? "-"}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${ct.cellSub}`}>{a.userId}</td>
                  <td className={`px-4 py-3 font-bold ${ct.cellMain}`}>{a.name}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{a.phone ?? "-"}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{a.managerCenterName ?? "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <button disabled={busy === a.id} onClick={() => approve(a.id, a.name)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${ct.primaryBtn}`}>매니저승인</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
