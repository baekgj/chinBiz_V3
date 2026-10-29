"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import { apiDownload, apiGet, apiPost } from "@/lib/api";

type Material = { id: number; title: string; fileName: string; fileSize?: number | null; downloaded: boolean };
type Row = { productId: number; productName: string; partnerName?: string; materials?: Material[]; materialsReady?: boolean };

/**
 * 매니저 교육관리 — 이수 전 상품만 노출. [교육완료] 클릭 시 자동배정 동의 모달 → education 저장.
 * docs/32: 본사 등록 교육자료 다운로드 버튼 — 상품의 자료를 모두 다운로드해야 [교육완료] 활성화.
 */
export default function EducationSection() {
  const { theme } = useBuzz();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<Row | null>(null); // 자동배정 동의 모달 대상
  const [dl, setDl] = useState<number | null>(null);       // 다운로드 중인 자료 id
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiGet<{ content: Row[] }>("/api/buzz/education");
    if (r.data?.content) setRows(r.data.content);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  /** 교육자료 다운로드 — 파일 수신 완료 후 다운로드 완료 기록 → 해당 상품 행 갱신(교육완료 활성화 판단) */
  async function download(row: Row, m: Material) {
    setDl(m.id); setErr(null);
    const r = await apiDownload(`/api/buzz/education/materials/${m.id}/download`, m.fileName);
    if (r.ok) {
      const done = await apiPost<{ materials: Material[]; materialsReady: boolean }>(`/api/buzz/education/materials/${m.id}/downloaded`, {});
      if (done.ok && done.data) {
        const { materials, materialsReady } = done.data;
        setRows((prev) => prev.map((x) => (x.productId === row.productId ? { ...x, materials, materialsReady } : x)));
      }
    } else setErr(r.message ?? "다운로드에 실패했습니다.");
    setDl(null);
  }

  async function complete(productId: number, autoAssign: boolean) {
    setBusy(true); setErr(null);
    const r = await apiPost("/api/buzz/education/complete", { productId, autoAssign });
    if (!r.ok) setErr(r.message ?? "교육완료 처리에 실패했습니다.");
    setTarget(null);
    await load();
    setBusy(false);
  }

  return (
    <Card title="상품 교육 관리" sub="교육자료를 모두 다운로드하면 [교육완료] 버튼이 활성화됩니다 (이수완료 상품은 목록에서 제외)">
      {err && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">{err}</p>}
      <div className={`overflow-x-auto rounded-xl border ${theme.tableWrap}`}>
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className={`text-xs ${theme.thead}`}>
              <th className="px-4 py-3 text-left font-semibold">상품명</th>
              <th className="px-4 py-3 text-left font-semibold">파트너사</th>
              <th className="px-4 py-3 text-left font-semibold">교육자료</th>
              <th className="px-4 py-3 text-right font-semibold">처리</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.divide}`}>
            {loading ? (
              <tr><td colSpan={4} className={`px-4 py-10 text-center ${theme.note}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className={`px-4 py-10 text-center ${theme.note}`}>교육 이수 대상 상품이 없습니다.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.productId} className={theme.rowHover}>
                <td className={`px-4 py-3 font-bold ${theme.cellMain}`}>{r.productName}</td>
                <td className={`px-4 py-3 ${theme.cellSub}`}>{r.partnerName ?? "-"}</td>
                <td className="px-4 py-3">
                  {(r.materials ?? []).length === 0 ? (
                    <span className={`text-xs ${theme.note}`}>교육자료 준비중</span>
                  ) : (
                    <div className="flex flex-col items-start gap-1.5">
                      {r.materials!.map((m) => (
                        <button key={m.id} onClick={() => download(r, m)} disabled={dl === m.id} title={m.fileName}
                          className={`flex max-w-[16rem] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold disabled:opacity-60 ${m.downloaded ? `${theme.tableWrap} ${theme.cellSub}` : theme.outlineBtn}`}>
                          <span>{dl === m.id ? "⏳" : m.downloaded ? "✅" : "⬇"}</span>
                          <span className="truncate">{m.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {/* 교육자료 전체 다운로드 전에는 비활성 (docs/32) */}
                  <button onClick={() => setTarget(r)} disabled={!r.materialsReady}
                    title={r.materialsReady ? undefined : "교육자료를 모두 다운로드하면 활성화됩니다"}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${theme.primaryBtn}`}>
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
