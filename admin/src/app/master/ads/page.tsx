"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { AD_POSITIONS, AD_TYPES } from "@/components/master/AdForm";
import { apiGet, mediaUrl } from "@/lib/api";

type Row = {
  id: number; title?: string | null; areaId: string; position: string; adType: string; published: boolean;
  imageCount: number; uploadedCount: number; thumbnail?: string | null; updatedAt?: string | null;
};

const label = (list: { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;

/** 본사 [광고관리]-[광고리스트] (docs/32) — 우측 상단 [광고등록] */
export default function AdListPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    apiGet<Row[]>("/api/ads").then((r) => setRows(r.ok && r.data ? r.data : []));
  }, []);

  return (
    <Card className="animate-float-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white">광고리스트</h2>
          <p className="mt-0.5 text-xs text-slate-500">HOME 메인화면에 노출되는 슬라이드·배너·레이어팝업 광고</p>
        </div>
        <Link href="/master/ads/new" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500">+ 광고등록</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-slate-400">
              <th className="px-2 py-2 font-semibold">이미지</th>
              <th className="px-2 py-2 font-semibold">광고영역ID / 광고명</th>
              <th className="px-2 py-2 font-semibold">광고위치</th>
              <th className="px-2 py-2 font-semibold">광고유형</th>
              <th className="px-2 py-2 text-center font-semibold">이미지 수</th>
              <th className="px-2 py-2 text-center font-semibold">게시여부</th>
              <th className="px-2 py-2 font-semibold">수정일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows === null && <tr><td colSpan={7} className="px-2 py-10 text-center text-slate-500">불러오는 중…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={7} className="px-2 py-10 text-center text-slate-500">등록된 광고가 없습니다. 우측 상단 [광고등록]으로 추가하세요.</td></tr>}
            {rows?.map((a) => (
              <tr key={a.id} className="hover:bg-navy-800/50">
                <td className="px-2 py-2">
                  <Link href={`/master/ads/${a.id}`} className="block h-12 w-32 overflow-hidden rounded-md bg-navy-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {a.thumbnail && <img src={mediaUrl(a.thumbnail)} alt="" className="h-full w-full object-cover" />}
                  </Link>
                </td>
                <td className="px-2 py-2">
                  <Link href={`/master/ads/${a.id}`} className="font-mono text-sm font-bold text-brand-300 hover:underline">{a.areaId}</Link>
                  {a.title && <p className="text-xs text-slate-400">{a.title}</p>}
                </td>
                <td className="px-2 py-2 text-xs text-slate-300">{label(AD_POSITIONS, a.position)}</td>
                <td className="px-2 py-2 text-xs text-slate-300">{label(AD_TYPES, a.adType)}</td>
                <td className="px-2 py-2 text-center text-xs text-slate-300">{a.uploadedCount} / {a.imageCount}</td>
                <td className="px-2 py-2 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${a.published ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"}`}>
                    {a.published ? "게시" : "미게시"}
                  </span>
                </td>
                <td className="px-2 py-2 text-xs text-slate-400">{a.updatedAt?.slice(0, 10) ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
