"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Card, Stat } from "@/components/partner/PartnerUI";
import SaleDetailModal from "@/components/partner/SaleDetailModal";

/** 파트너 대시보드 · 실시간 상품 영업 및 고객정보 현황 (partner.docx p.3) — 실DB 연동(/api/partner/sales, docs/34) */

type Stage = "진행중" | "계약완료" | "설치완료" | "취소반품";
type Deal = { id: number; customerName?: string; productName?: string; buzzName?: string; managerName?: string; status: string; group: Stage; updatedAt?: string };
type Stats = { total: number; progress: number; done: number; canceled: number };

const LIMIT = 10; // 대시보드는 최근 10건만 노출 (전체는 [영업 현황])

const STAGE_BADGE: Record<Stage, { icon: string; cls: string }> = {
  진행중: { icon: "🕐", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
  계약완료: { icon: "📄", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  설치완료: { icon: "✓", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  취소반품: { icon: "⚠", cls: "bg-red-50 text-red-600 ring-1 ring-red-200" },
};

/** ISO 일시 → "방금 전 / N분 전 / N시간 전 / N일 전 / YYYY-MM-DD" */
function ago(iso?: string): string {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso.slice(0, 10);
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}시간 전`;
  if (m < 60 * 24 * 30) return `${Math.floor(m / 1440)}일 전`;
  return iso.slice(0, 10);
}

const TABS: { key: "전체" | Stage; label: string }[] = [
  { key: "전체", label: "전체" },
  { key: "진행중", label: "진행 중" },
  { key: "계약완료", label: "계약 완료" },
  { key: "설치완료", label: "설치 완료" },
  { key: "취소반품", label: "취소/반품" },
];

export default function LiveSalesSection() {
  const [tab, setTab] = useState<"전체" | Stage>("전체");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, progress: 0, done: 0, canceled: 0 });
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    apiGet<{ content: Deal[]; stats: Stats }>("/api/partner/sales").then((r) => {
      if (r.data) { setDeals(r.data.content ?? []); if (r.data.stats) setStats(r.data.stats); }
      setLoading(false);
    });
  }, []);

  // 최신 업데이트순 상위 LIMIT 건
  const sorted = [...deals].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  const filtered = tab === "전체" ? sorted : sorted.filter((r) => r.group === tab);
  const rows = filtered.slice(0, LIMIT);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-900">실시간 상품 영업 및 고객정보 현황</h2>
        <p className="mt-0.5 text-sm text-slate-500">버즈회원과 관리매니저를 통해 접수되어 유입된 오가닉 B2B 고객 DB의 진행 상태 추적</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat label="전체 유입 고객 DB" value={String(stats.total)} unit="건" tone="slate" />
        <Stat label="진행 중" value={String(stats.progress)} unit="건" tone="sky" />
        <Stat label="완결 (구매확정)" value={String(stats.done)} unit="건" tone="emerald" />
        <Stat label="취소 / 반품" value={String(stats.canceled)} unit="건" tone="red" />
      </div>

      {/* 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors ${tab === t.key ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            {t.label} <span className="opacity-60">{t.key === "전체" ? deals.length : deals.filter((d) => d.group === t.key).length}</span>
          </button>
        ))}
      </div>

      {/* 고객정보 목록 */}
      <Card title="🧊 실시간 진행 단계별 고객정보 목록"
        right={<Link href="/partner/pipeline" className="text-sm font-bold text-sky-600 hover:underline">전체보기 &gt;</Link>}>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                <th className="px-3 py-2.5">고객사/명</th>
                <th className="px-3 py-2.5">접수 상품명</th>
                <th className="px-3 py-2.5">1차 접수자 (버즈)</th>
                <th className="px-3 py-2.5">2차 담당자 (매니저)</th>
                <th className="px-3 py-2.5">진행 상태</th>
                <th className="px-3 py-2.5 text-right">최종 업데이트</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">불러오는 중…</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3.5 font-bold text-slate-900">
                    <button onClick={() => setOpenId(r.id)} className="text-left hover:text-sky-600 hover:underline">{r.group === "취소반품" ? "🚩 " : ""}{r.customerName ?? "-"}</button>
                  </td>
                  <td className="px-3 py-3.5 text-slate-600">{r.productName ?? "-"}</td>
                  <td className="px-3 py-3.5 text-slate-600">👤 {r.buzzName ?? "-"}</td>
                  <td className="px-3 py-3.5 text-slate-600">🔧 {r.managerName ?? "미배정"}</td>
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${STAGE_BADGE[r.group]?.cls ?? "bg-slate-50 text-slate-600 ring-1 ring-slate-200"}`}>{STAGE_BADGE[r.group]?.icon ?? ""} {r.status}</span>
                  </td>
                  <td className="px-3 py-3.5 text-right text-xs text-slate-400">{ago(r.updatedAt)}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">{tab === "전체" ? "내 상품에 접수된 영업 건이 없습니다." : "해당 단계의 고객 정보가 없습니다."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {openId != null && <SaleDetailModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
