"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet } from "@/lib/api";
import { krw } from "@/components/ui";

type Sale = {
  id: number; createdAt: string; kind: string; orderNo?: string; productId?: number; productName?: string;
  partnerName?: string; customerName?: string; myAmount?: number; status: string;
};
type PageResp = { content: Sale[]; page: number; totalPages: number; totalElements: number };

const SIZE = 10;
const DONE = new Set(["구매확정"]);

/** 버즈 영업 파이프라인 — 내가 등록한 1차영업 + 나를 추천인으로 등록한 버즈의 1차영업 */
export default function PipelineSection() {
  const { theme } = useBuzz();
  const router = useRouter();
  const sp = useSearchParams();
  const initialPage = Math.max(0, Number(sp.get("page")) || 0); // URL ?page=N (0-indexed)
  const [rows, setRows] = useState<Sale[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const r = await apiGet<PageResp>(`/api/buzz/sales?page=${p}&size=${SIZE}`);
    if (r.data) { setRows(r.data.content); setTotalPages(r.data.totalPages || 1); setTotal(r.data.totalElements); setPage(r.data.page); }
    setLoading(false);
  }, []);

  // 페이지 이동을 URL(?page=)에 저장 → 상세 다녀와 돌아가기 시 해당 페이지 복원
  const go = useCallback((p: number) => {
    router.replace(`/buzz/pipeline?page=${p}`, { scroll: false });
    load(p);
  }, [router, load]);

  useEffect(() => { load(initialPage); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card
      title="1차 영업 파이프라인"
      sub={`총 ${total}건 · 내 영업 + 추천 네트워크 영업`}
      right={<Link href="/buzz/pipeline/new" className={`rounded-xl px-4 py-2 text-sm font-bold ${theme.primaryBtn}`}>+ 1차 영업등록</Link>}
    >
      <div className={`overflow-x-auto rounded-xl border ${theme.tableWrap}`}>
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className={`text-xs ${theme.thead}`}>
              <th className="px-4 py-3 text-left font-semibold">등록일</th>
              <th className="px-4 py-3 text-center font-semibold">구분</th>
              <th className="px-4 py-3 text-left font-semibold">주문번호</th>
              <th className="px-4 py-3 text-left font-semibold">상품명</th>
              <th className="px-4 py-3 text-left font-semibold">파트너사</th>
              <th className="px-4 py-3 text-left font-semibold">고객명</th>
              <th className="px-4 py-3 text-right font-semibold">수당금액</th>
              <th className="px-4 py-3 text-center font-semibold">영업단계</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.divide}`}>
            {loading ? (
              <tr><td colSpan={8} className={`px-4 py-10 text-center ${theme.note}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className={`px-4 py-10 text-center ${theme.note}`}>등록된 영업 건이 없습니다.</td></tr>
            ) : rows.map((s) => (
              <tr key={s.id} className={theme.rowHover}>
                <td className={`px-4 py-3 ${theme.cellSub}`}>{s.createdAt}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.kind === "영업" ? theme.stageOn : theme.goldBadge}`}>{s.kind}</span>
                </td>
                <td className={`px-4 py-3 font-mono text-xs ${theme.cellSub}`}>{s.orderNo ?? "-"}</td>
                <td className="px-4 py-3">
                  {s.productId
                    ? <Link href={`/buzz/market/${s.productId}`} className={`font-semibold hover:underline ${theme.cellMain}`}>{s.productName ?? "-"}</Link>
                    : <span className={`font-semibold ${theme.cellMain}`}>{s.productName ?? "-"}</span>}
                </td>
                <td className={`px-4 py-3 ${theme.cellSub}`}>{s.partnerName ?? "-"}</td>
                <td className="px-4 py-3">
                  <Link href={`/buzz/pipeline/${s.id}`} className={`font-bold hover:underline ${theme.cellMain}`}>{s.customerName ?? "-"}</Link>
                </td>
                <td className={`px-4 py-3 text-right font-bold ${theme.statTone.gold}`}>{krw(s.myAmount ?? 0)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${DONE.has(s.status) ? theme.stageDone : theme.stageOn}`}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button disabled={page <= 0} onClick={() => go(page - 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${theme.tableWrap} ${theme.cellSub} disabled:opacity-40`}>이전</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => go(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? theme.primaryBtn : `border ${theme.tableWrap} ${theme.cellSub}`}`}>{i + 1}</button>
          ))}
          <button disabled={page >= totalPages - 1} onClick={() => go(page + 1)} className={`rounded-lg border px-3 py-1.5 text-sm ${theme.tableWrap} ${theme.cellSub} disabled:opacity-40`}>다음</button>
        </div>
      )}
    </Card>
  );
}
