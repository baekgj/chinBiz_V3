"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";
import AssignModal from "@/components/buzz/AssignModal";

type Sale = {
  id: number; createdAt: string; productId: number; productName: string; partnerName: string; customerName: string; buzzName: string; status: string;
  centerName?: string | null; managerId?: number | null; assignedManagerName?: string; mine?: boolean; eduApproved?: boolean;
};
type PageResp = { content: Sale[]; page: number; totalPages: number; totalElements: number };

const SIZE = 10;
const DONE = new Set(["구매확정"]);

// 영업관리 소메뉴 (탭)
const TABS = [
  { href: "/buzz/intake", label: "버즈1차접수현황" },
  { href: "/buzz/managed", label: "2차영업관리" },
];

/** 매니저 영업관리 — mode="intake"(내 관리센터 미배정 + 배정받기) / "managed"(배정받은 건) */
export default function ManagerSalesSection({ mode }: { mode: "intake" | "managed" }) {
  const { theme } = useBuzz();
  const pathname = usePathname();
  const [rows, setRows] = useState<Sale[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [assignId, setAssignId] = useState<number | null>(null);

  const endpoint = mode === "intake" ? "/api/buzz/sales/intake" : "/api/buzz/sales/managed";

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const r = await apiGet<PageResp>(`${endpoint}?page=${p}&size=${SIZE}`);
    if (r.data) { setRows(r.data.content); setTotalPages(r.data.totalPages || 1); setTotal(r.data.totalElements); setPage(r.data.page); }
    setLoading(false);
  }, [endpoint]);

  useEffect(() => { load(0); }, [load]);

  // 홈 [설치완료 사진찍기] 팝업에서 넘어온 ?assign={saleId} → 진행관리(영업권확보) 레이어 자동 오픈
  useEffect(() => {
    if (typeof window === "undefined" || mode !== "managed") return;
    const a = new URLSearchParams(window.location.search).get("assign");
    if (a && /^\d+$/.test(a)) setAssignId(Number(a));
  }, [mode]);

  const colCount = 8;

  function IntakeAction({ s }: { s: Sale }) {
    if (s.eduApproved) return <button onClick={() => setAssignId(s.id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${theme.primaryBtn}`}>배정받기</button>;
    return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">교육 필수</span>;
  }

  return (
    <div className="space-y-4">
      {/* 소메뉴 탭 */}
      <div className={`flex gap-1 rounded-xl border p-1 ${theme.tableWrap}`}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-bold ${pathname === t.href ? theme.primaryBtn : `${theme.cellSub} hover:${theme.rowHover}`}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <Card
        title={mode === "intake" ? "버즈1차접수현황" : "2차영업관리"}
        sub={mode === "intake" ? `총 ${total}건 · 내 관리센터 소속 버즈의 미배정 1차영업` : `총 ${total}건 · 내가 배정받은 2차 관리영업`}
      >
        <div className={`overflow-x-auto rounded-xl border ${theme.tableWrap}`}>
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className={`text-xs ${theme.thead}`}>
                <th className="px-4 py-3 text-left font-semibold">등록일</th>
                <th className="px-4 py-3 text-left font-semibold">상품명</th>
                <th className="px-4 py-3 text-left font-semibold">파트너사</th>
                <th className="px-4 py-3 text-left font-semibold">고객명</th>
                <th className="px-4 py-3 text-left font-semibold">1차영업자</th>
                <th className="px-4 py-3 text-left font-semibold">활동센터</th>
                <th className="px-4 py-3 text-center font-semibold">영업단계</th>
                <th className="px-4 py-3 text-center font-semibold">{mode === "intake" ? "배정" : "관리"}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.divide}`}>
              {loading ? (
                <tr><td colSpan={colCount} className={`px-4 py-10 text-center ${theme.note}`}>불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={colCount} className={`px-4 py-10 text-center ${theme.note}`}>{mode === "intake" ? "배정 대기 중인 1차영업이 없습니다." : "배정받은 영업 건이 없습니다."}</td></tr>
              ) : rows.map((s) => (
                <tr key={s.id} className={theme.rowHover}>
                  <td className={`px-4 py-3 ${theme.cellSub}`}>{s.createdAt}</td>
                  <td className="px-4 py-3">
                    <Link href={`/buzz/market/${s.productId}`} className={`font-semibold hover:underline ${theme.cellMain}`}>{s.productName ?? "-"}</Link>
                  </td>
                  <td className={`px-4 py-3 ${theme.cellSub}`}>{s.partnerName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/buzz/pipeline/${s.id}`} className={`font-bold hover:underline ${theme.cellMain}`}>{s.customerName ?? "-"}</Link>
                  </td>
                  <td className={`px-4 py-3 ${theme.cellSub}`}>{s.buzzName ?? "-"}</td>
                  <td className={`px-4 py-3 ${theme.cellSub}`}>{s.centerName ?? "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${DONE.has(s.status) ? theme.stageDone : theme.stageOn}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {mode === "intake"
                      ? <IntakeAction s={s} />
                      : <button onClick={() => setAssignId(s.id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${theme.stageDone}`}>진행 관리</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button disabled={page <= 0} onClick={() => load(page - 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${theme.tableWrap} ${theme.cellSub} disabled:opacity-40`}>이전</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => load(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? theme.primaryBtn : `border ${theme.tableWrap} ${theme.cellSub}`}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${theme.tableWrap} ${theme.cellSub} disabled:opacity-40`}>다음</button>
          </div>
        )}

        {assignId != null && <AssignModal saleId={assignId} onClose={() => setAssignId(null)} onSaved={() => load(page)} />}
      </Card>
    </div>
  );
}
