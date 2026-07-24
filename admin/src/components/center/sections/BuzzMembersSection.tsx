"use client";

import { useEffect, useState } from "react";
import { Card, ct } from "@/components/center/CenterUI";
import { apiGet } from "@/lib/api";

type Row = { id: number; createdAt?: string; userId: string; name: string; salesCount: number; completedCount: number };

/** 소속 버즈회원 — user.sales_center_id = 내 센터인 BUZZ 리스트 (가입일자/아이디/회원명/영업수/완료수) */
export default function BuzzMembersSection() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ content: Row[] }>("/api/center/buzz-members").then((r) => {
      if (r.ok && r.data) setRows(r.data.content ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <Card title="소속 버즈회원" sub={`센터 소속 버즈회원 ${rows.length}명 (sales_center_id 기준)`}>
      <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className={`text-xs ${ct.thead}`}>
              <th className="px-4 py-3 text-left font-semibold">가입일자</th>
              <th className="px-4 py-3 text-left font-semibold">아이디</th>
              <th className="px-4 py-3 text-left font-semibold">회원명</th>
              <th className="px-4 py-3 text-right font-semibold">영업수</th>
              <th className="px-4 py-3 text-right font-semibold">완료수</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${ct.divide}`}>
            {loading ? (
              <tr><td colSpan={5} className={`px-4 py-10 text-center ${ct.note}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className={`px-4 py-10 text-center ${ct.note}`}>소속 버즈회원이 없습니다.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className={ct.rowHover}>
                <td className={`px-4 py-3 ${ct.cellSub}`}>{r.createdAt ?? "-"}</td>
                <td className={`px-4 py-3 font-mono text-xs ${ct.cellSub}`}>{r.userId}</td>
                <td className={`px-4 py-3 font-bold ${ct.cellMain}`}>{r.name}</td>
                <td className={`px-4 py-3 text-right font-semibold ${ct.cellMain}`}>{r.salesCount} 건</td>
                <td className={`px-4 py-3 text-right font-semibold text-emerald-400`}>{r.completedCount} 건</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
