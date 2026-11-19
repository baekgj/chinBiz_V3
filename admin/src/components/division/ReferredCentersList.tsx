"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, dv } from "@/components/division/DivisionUI";
import { apiGet } from "@/lib/api";

/**
 * 본부 [센터관리]-[추천등록센터List] (docs/37) — 이 본부가 등록(추천)한 센터 계정 목록
 * BE: GET /api/division/center-mgmt/referred
 */
type Row = {
  id: number; createdAt: string | null; headCode: string | null; headName: string | null;
  centerCode: string | null; centerName: string | null; userId: string; name: string; phone: string | null;
};

export default function ReferredCentersList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    apiGet<Row[]>("/api/division/center-mgmt/referred").then((r) => setRows(r.ok && r.data ? r.data : []));
  }, []);

  const right = <Link href="/division/center-mgmt/new" className={`rounded-lg px-4 py-2 text-xs font-bold ${dv.primaryBtn}`}>+ 센터등록</Link>;
  const head = ["등록일", "본부코드", "본부명", "센터코드", "센터명", "아이디", "이름", "전화번호"];

  return (
    <Card title="추천등록센터 List" sub={`이 본부에서 등록한 센터 ${rows?.length ?? 0}곳 · 센터 관리비 결제 시 추천본부 수당 지급 대상`} right={right}>
      <div className={`overflow-x-auto rounded-xl border ${dv.tableWrap}`}>
        <table className="w-full min-w-[760px] text-sm">
          <thead className={dv.thead}>
            <tr>{head.map((h) => <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className={`divide-y ${dv.divide}`}>
            {rows === null ? (
              <tr><td colSpan={head.length} className={`py-10 text-center ${dv.cellSub}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={head.length} className={`py-10 text-center ${dv.cellSub}`}>등록한 센터가 없습니다.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className={dv.rowHover}>
                <td className={`px-3 py-2.5 whitespace-nowrap ${dv.cellSub}`}>{r.createdAt ? r.createdAt.slice(0, 10) : "-"}</td>
                <td className={`px-3 py-2.5 ${dv.cellSub}`}>{r.headCode ?? "-"}</td>
                <td className={`px-3 py-2.5 ${dv.cellMain}`}>{r.headName ?? "-"}</td>
                <td className={`px-3 py-2.5 ${dv.cellSub}`}>{r.centerCode ?? "-"}</td>
                <td className={`px-3 py-2.5 font-semibold ${dv.cellMain}`}>{r.centerName ?? "-"}</td>
                <td className={`px-3 py-2.5 ${dv.cellMain}`}>{r.userId}</td>
                <td className={`px-3 py-2.5 ${dv.cellMain}`}>{r.name}</td>
                <td className={`px-3 py-2.5 whitespace-nowrap ${dv.cellSub}`}>{r.phone || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
