"use client";

import { useState } from "react";
import { Card, Stat } from "@/components/partner/PartnerUI";

/** 파트너 대시보드 · 실시간 상품 영업 및 고객정보 현황 (partner.docx p.3) */

type Stage = "진행중" | "계약완료" | "설치완료" | "취소반품";
type Row = { customer: string; product: string; buzz: string; manager: string; stage: Stage; updated: string; flag?: boolean };

const ROWS: Row[] = [
  { customer: "대박식당 신촌점", product: "깔끔돌이 돌솥세척기 (자동형)", buzz: "버즈_김OO", manager: "직영_이매니저", stage: "설치완료", updated: "방금 전" },
  { customer: "명동 갈비하우스", product: "깔끔돌이 숯불통세척기", buzz: "버즈_박OO", manager: "외부_최매니저", stage: "진행중", updated: "3분 전" },
  { customer: "한강 정육식당", product: "깔끔돌이 돌솥세척기 (자동형)", buzz: "버즈_최OO", manager: "직영_박매니저", stage: "계약완료", updated: "2시간 전" },
  { customer: "종로가든", product: "깔끔돌이 돌솥세척기 (수동형)", buzz: "버즈_이OO", manager: "외부_정매니저", stage: "취소반품", updated: "1일 전", flag: true },
];

const STAGE_BADGE: Record<Stage, { label: string; cls: string }> = {
  진행중: { label: "🕐 상담/방문 단계", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
  계약완료: { label: "📄 계약체결 완료", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  설치완료: { label: "✓ 배송/설치 완료", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  취소반품: { label: "⚠ 취소/반품 접수", cls: "bg-red-50 text-red-600 ring-1 ring-red-200" },
};

const TABS: { key: "전체" | Stage; label: string }[] = [
  { key: "전체", label: "전체" },
  { key: "진행중", label: "진행 중" },
  { key: "계약완료", label: "계약 완료" },
  { key: "설치완료", label: "설치 완료" },
  { key: "취소반품", label: "취소/반품" },
];

export default function LiveSalesSection() {
  const [tab, setTab] = useState<"전체" | Stage>("전체");
  const rows = tab === "전체" ? ROWS : ROWS.filter((r) => r.stage === tab);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-900">실시간 상품 영업 및 고객정보 현황</h2>
        <p className="mt-0.5 text-sm text-slate-500">버즈회원과 관리매니저를 통해 접수되어 유입된 오가닉 B2B 고객 DB의 진행 상태 추적</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat label="전체 유입 고객 DB" value="142" unit="건" tone="slate" />
        <Stat label="진행 중" value="38" unit="건" tone="sky" />
        <Stat label="완결 (구매확정)" value="95" unit="건" tone="emerald" />
        <Stat label="취소 / 반품" value="9" unit="건" tone="red" />
      </div>

      {/* 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors ${tab === t.key ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 고객정보 목록 */}
      <Card title="🧊 실시간 진행 단계별 고객정보 목록">
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
              {rows.map((r) => (
                <tr key={r.customer} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3.5 font-bold text-slate-900">{r.flag ? "🚩 " : ""}{r.customer}</td>
                  <td className="px-3 py-3.5 text-slate-600">{r.product}</td>
                  <td className="px-3 py-3.5 text-slate-600">👤 {r.buzz}</td>
                  <td className="px-3 py-3.5 text-slate-600">🔧 {r.manager}</td>
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${STAGE_BADGE[r.stage].cls}`}>{STAGE_BADGE[r.stage].label}</span>
                  </td>
                  <td className="px-3 py-3.5 text-right text-xs text-slate-400">{r.updated}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">해당 단계의 고객 정보가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
