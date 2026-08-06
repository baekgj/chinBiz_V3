"use client";

import { useEffect, useState } from "react";
import { Card, ct } from "@/components/center/CenterUI";
import { apiGet } from "@/lib/api";
import ManagerTabs from "@/components/center/sections/ManagerTabs";

type Manager = {
  id: number; userId: string; name: string; phone?: string; email?: string;
  managerCenterName?: string; managerSdate?: string; managerEdate?: string;
};

/** [매니저관리] — 승인된 관리매니저(status=Y) 목록 */
export default function ManagerApprovedSection() {
  const [rows, setRows] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ content: Manager[] }>("/api/center/managers").then((r) => { setRows(r.data?.content ?? []); setLoading(false); });
  }, []);

  return (
    <div>
      <ManagerTabs />
      <Card title="소속 관리매니저" sub={`승인 완료된 내 센터 소속 매니저 · 총 ${rows.length}명`}>
        <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className={`text-xs ${ct.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">아이디</th>
                <th className="px-4 py-3 text-left font-semibold">이름</th>
                <th className="px-4 py-3 text-left font-semibold">연락처</th>
                <th className="px-4 py-3 text-left font-semibold">관리 센터</th>
                <th className="px-4 py-3 text-left font-semibold">신청일</th>
                <th className="px-4 py-3 text-left font-semibold">승인일</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${ct.divide}`}>
              {loading ? (
                <tr><td colSpan={6} className={`px-4 py-10 text-center ${ct.note}`}>불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className={`px-4 py-10 text-center ${ct.note}`}>승인된 소속 매니저가 없습니다.</td></tr>
              ) : rows.map((m) => (
                <tr key={m.id} className={ct.rowHover}>
                  <td className={`px-4 py-3 font-mono text-xs ${ct.cellSub}`}>{m.userId}</td>
                  <td className={`px-4 py-3 font-bold ${ct.cellMain}`}>{m.name}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{m.phone ?? "-"}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{m.managerCenterName ?? "-"}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{m.managerSdate ?? "-"}</td>
                  <td className={`px-4 py-3 ${ct.cellSub}`}>{m.managerEdate ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
