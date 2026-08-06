"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Stat } from "@/components/partner/PartnerUI";
import SaleDetailModal from "@/components/partner/SaleDetailModal";

type Deal = {
  id: number; customerName: string; productName?: string; buzzName?: string; managerName?: string;
  status: string; group: string; updatedAt?: string;
};
type Stats = { total: number; progress: number; done: number; canceled: number };
type Resp = { content: Deal[]; stats: Stats };

const TABS = [
  { key: "전체", label: "전체" },
  { key: "진행중", label: "진행 중" },
  { key: "계약완료", label: "계약 완료" },
  { key: "설치완료", label: "설치 완료" },
  { key: "취소반품", label: "취소/반품" },
];

const groupTone: Record<string, string> = {
  진행중: "bg-sky-50 text-sky-700 ring-sky-200",
  계약완료: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  설치완료: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  취소반품: "bg-red-50 text-red-700 ring-red-200",
};

function fmtDate(s?: string) {
  if (!s) return "-";
  return s.slice(0, 10);
}

export default function PartnerPipeline() {
  const [tab, setTab] = useState("전체");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, progress: 0, done: 0, canceled: 0 });
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const SIZE = 10;

  const load = useCallback(() => {
    setLoading(true);
    apiGet<Resp>("/api/partner/sales").then((r) => {
      if (r.data) { setDeals(r.data.content ?? []); if (r.data.stats) setStats(r.data.stats); }
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, kind: "confirm" | "cancel") => {
    const msg = kind === "confirm" ? "이 건을 구매확정 처리할까요? (수당 CP→MP 전환)" : "이 건을 취소/반품 처리할까요? (상계 전표가 추가됩니다)";
    if (!window.confirm(msg)) return;
    setBusy(id); setNotice(null);
    const r = await apiPost<{ message: string }>(`/api/partner/sales/${id}/${kind}`, {});
    setBusy(null);
    if (r.ok) { setNotice(r.data?.message ?? "처리되었습니다."); load(); }
    else setNotice(r.message ?? "처리에 실패했습니다.");
  };

  const filtered = tab === "전체" ? deals : deals.filter((d) => d.group === tab);
  const totalPages = Math.max(1, Math.ceil(filtered.length / SIZE));
  const cur = Math.min(page, totalPages - 1);
  const rows = filtered.slice(cur * SIZE, cur * SIZE + SIZE);

  const changeTab = (key: string) => { setTab(key); setPage(0); };

  return (
    <div>
      {/* 요약 지표 (실데이터) */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="전체 유입 고객 DB" value={String(stats.total)} unit="건" tone="slate" />
        <Stat label="진행 중" value={String(stats.progress)} unit="건" tone="sky" />
        <Stat label="완결(구매확정)" value={String(stats.done)} unit="건" tone="emerald" />
        <Stat label="취소/반품" value={String(stats.canceled)} unit="건" tone="red" />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const on = tab === t.key;
          const count = t.key === "전체" ? deals.length : deals.filter((d) => d.group === t.key).length;
          return (
            <button key={t.key} onClick={() => changeTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t.label} <span className={on ? "text-sky-100" : "text-slate-400"}>{count}</span>
            </button>
          );
        })}
      </div>

      {notice && <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700">{notice}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500">
              <th className="px-4 py-3 text-left font-semibold">고객사/명</th>
              <th className="px-4 py-3 text-left font-semibold">접수 상품</th>
              <th className="px-4 py-3 text-left font-semibold">1차 접수자(버즈)</th>
              <th className="px-4 py-3 text-left font-semibold">2차 담당자(매니저)</th>
              <th className="px-4 py-3 text-left font-semibold">진행 상태</th>
              <th className="px-4 py-3 text-right font-semibold">최종 업데이트</th>
              <th className="px-4 py-3 text-center font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">{tab === "전체" ? "내 상품에 접수된 영업 건이 없습니다." : "해당 상태의 영업 건이 없습니다."}</td></tr>
            ) : rows.map((d) => (
              <tr key={d.id} className="hover:bg-sky-50/50">
                <td className="px-4 py-3">
                  <button onClick={() => setOpenId(d.id)} className="font-bold text-slate-900 hover:text-sky-600 hover:underline">{d.customerName ?? "-"}</button>
                </td>
                <td className="px-4 py-3 text-slate-600">{d.productName ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{d.buzzName ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{d.managerName ?? "미배정"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${groupTone[d.group] ?? "bg-slate-50 text-slate-600 ring-slate-200"}`}>{d.status}</span>
                </td>
                <td className="px-4 py-3 text-right text-xs text-slate-400">{fmtDate(d.updatedAt)}</td>
                <td className="px-4 py-3">
                  {d.status === "취소/반품" ? (
                    <span className="block text-center text-xs font-semibold text-red-500">취소됨</span>
                  ) : (
                    <div className="flex justify-center gap-1.5">
                      {d.status !== "구매확정" && (
                        <button disabled={busy === d.id} onClick={() => act(d.id, "confirm")}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">구매확정</button>
                      )}
                      <button disabled={busy === d.id} onClick={() => act(d.id, "cancel")}
                        className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">취소</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">전체 {filtered.length}건 · {cur + 1}/{totalPages} 페이지</p>
          <div className="flex items-center gap-1">
            <button disabled={cur <= 0} onClick={() => setPage(cur - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">이전</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === cur ? "bg-sky-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>{i + 1}</button>
            ))}
            <button disabled={cur >= totalPages - 1} onClick={() => setPage(cur + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">다음</button>
          </div>
        </div>
      )}

      {openId != null && <SaleDetailModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
