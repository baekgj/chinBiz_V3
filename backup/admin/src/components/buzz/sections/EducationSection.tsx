"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiGet, apiPost } from "@/lib/api";

type Row = { productId: number; productName: string; partnerName?: string };

/** 매니저 교육관리 — 이수 전 상품만 노출. [교육완료] 클릭 시 자동배정 동의 모달 → education 저장 */
export default function EducationSection() {
  const { theme } = useBuzz();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<Row | null>(null); // 자동배정 동의 모달 대상

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiGet<{ content: Row[] }>("/api/buzz/education");
    if (r.data?.content) setRows(r.data.content);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function complete(productId: number, autoAssign: boolean) {
    setBusy(true);
    await apiPost("/api/buzz/education/complete", { productId, autoAssign });
    setTarget(null);
    await load();
    setBusy(false);
  }

  return (
    <Card title="상품 교육 관리" sub="교육 이수 대상 상품 (이수완료 상품은 목록에서 제외됩니다)">
      <div className={`overflow-x-auto rounded-xl border ${theme.tableWrap}`}>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className={`text-xs ${theme.thead}`}>
              <th className="px-4 py-3 text-left font-semibold">상품명</th>
              <th className="px-4 py-3 text-left font-semibold">파트너사</th>
              <th className="px-4 py-3 text-right font-semibold">처리</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.divide}`}>
            {loading ? (
              <tr><td colSpan={3} className={`px-4 py-10 text-center ${theme.note}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className={`px-4 py-10 text-center ${theme.note}`}>교육 이수 대상 상품이 없습니다.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.productId} className={theme.rowHover}>
                <td className={`px-4 py-3 font-bold ${theme.cellMain}`}>{r.productName}</td>
                <td className={`px-4 py-3 ${theme.cellSub}`}>{r.partnerName ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setTarget(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${theme.primaryBtn}`}>
                    교육완료
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 자동배정 동의 레이어 */}
      {target && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !busy && setTarget(null)}>
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${theme.tableWrap} ${theme.page}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-black ${theme.cardHead}`}>교육완료 처리</h3>
            <p className={`mt-3 text-sm ${theme.cellSub}`}>
              <b className={theme.cellMain}>{target.productName}</b> 상품에 대한
              <br />자동 배정 여부를 허용하시겠습니까?
            </p>
            <p className={`mt-2 text-xs ${theme.note}`}>동의 시 해당 상품의 지역 고객 접수 건이 회원님에게 자동 배정 대상으로 포함됩니다.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button disabled={busy} onClick={() => complete(target.productId, false)}
                className={`rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50 ${theme.tableWrap} ${theme.cellSub}`}>
                미동의
              </button>
              <button disabled={busy} onClick={() => complete(target.productId, true)}
                className={`rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 ${theme.primaryBtn}`}>
                {busy ? "처리 중…" : "동의"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
