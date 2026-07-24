"use client";

import { useEffect, useState } from "react";
import { Card, ct } from "@/components/center/CenterUI";
import { apiGet } from "@/lib/api";

type Row = {
  id: number; createdAt?: string; orderNo?: string; productName?: string; companyName?: string;
  actorName?: string; customerName?: string; phone?: string; email?: string; status?: string;
};

/** 센터 개별 영업 내역 — 고객정보(고객명/전화/이메일) 서버 마스킹. scope=buzz(1차)|manager(2차) */
export default function SalesListSection({ scope }: { scope: "buzz" | "manager" }) {
  const isBuzz = scope === "buzz";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<{ content: Row[] }>(`/api/center/sales/${scope}/list`).then((r) => {
      if (r.ok && r.data) setRows(r.data.content ?? []);
      setLoading(false);
    });
  }, [scope]);

  return (
    <Card title={isBuzz ? "1차 영업신청 내역" : "2차 영업 진행내역"} sub="개별 건 · 고객정보는 일부 마스킹 처리됩니다">
      <div className={`overflow-x-auto rounded-xl border ${ct.tableWrap}`}>
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className={`text-xs ${ct.thead}`}>
              <th className="px-3 py-3 text-left font-semibold">등록일</th>
              <th className="px-3 py-3 text-left font-semibold">상품명</th>
              <th className="px-3 py-3 text-left font-semibold">상호명</th>
              <th className="px-3 py-3 text-left font-semibold">{isBuzz ? "영업자(버즈)" : "담당매니저"}</th>
              <th className="px-3 py-3 text-left font-semibold">고객명</th>
              <th className="px-3 py-3 text-left font-semibold">연락처</th>
              <th className="px-3 py-3 text-left font-semibold">이메일</th>
              <th className="px-3 py-3 text-center font-semibold">영업단계</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${ct.divide}`}>
            {loading ? (
              <tr><td colSpan={8} className={`px-4 py-10 text-center ${ct.note}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className={`px-4 py-10 text-center ${ct.note}`}>{isBuzz ? "1차 영업신청" : "2차 영업 진행"} 내역이 없습니다.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className={ct.rowHover}>
                <td className={`px-3 py-3 ${ct.cellSub}`}>{r.createdAt ?? "-"}</td>
                <td className={`px-3 py-3 font-semibold ${ct.cellMain}`}>{r.productName ?? "-"}</td>
                <td className={`px-3 py-3 ${ct.cellSub}`}>{r.companyName ?? "-"}</td>
                <td className={`px-3 py-3 ${ct.cellSub}`}>{r.actorName ?? "-"}</td>
                <td className={`px-3 py-3 font-semibold ${ct.cellMain}`}>{r.customerName ?? "-"}</td>
                <td className={`px-3 py-3 ${ct.cellSub}`}>{r.phone ?? "-"}</td>
                <td className={`px-3 py-3 ${ct.cellSub}`}>{r.email ?? "-"}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ct.badge}`}>{r.status ?? "-"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
