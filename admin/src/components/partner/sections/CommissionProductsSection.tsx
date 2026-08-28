"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { krw } from "@/components/ui";
import { Card, Stat } from "@/components/partner/PartnerUI";

/** 파트너 대시보드 · 위탁 영업대행 상품 및 총수당 관리 (partner.docx p.2) — 실데이터 */

type Product = { id: number; name: string; salePrice?: number; totalAllowance?: number; categoryId?: number | null; onSale?: boolean };
type Cat = { id: number; name: string };

export default function CommissionProductsSection() {
  const [rows, setRows] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<Record<number, string>>({});

  useEffect(() => {
    apiGet<{ content: Product[] }>("/api/partner/products?page=0&size=100").then((r) => {
      setRows(r.ok && r.data ? r.data.content : []);
    });
    apiGet<Cat[]>("/api/partner/categories").then((r) => {
      if (r.ok && r.data) setCats(Object.fromEntries(r.data.map((c) => [c.id, c.name])));
    });
  }, []);

  const total = rows?.length ?? 0;
  const withAllowance = rows?.filter((p) => (p.totalAllowance ?? 0) > 0).length ?? 0;
  const active = rows?.filter((p) => p.onSale).length ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-900">위탁 영업대행 상품 및 총수당 관리</h2>
        <p className="mt-0.5 text-sm text-slate-500">파트너사가 대행을 맡긴 상품 라인업과 각 상품별 총수당(버즈+매니저+센터 총합 배정액)을 관리</p>
      </div>

      {/* 요약 통계 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="등록된 위탁 상품 수" value={String(total)} unit="종" tone="sky" />
        <Stat label="총수당 설정 완료" value={String(withAllowance)} unit={`/ ${total}`} tone="sky" />
        <Stat label="활성 영업 상품" value={String(active)} unit="종" tone="sky" />
      </div>

      {/* 상품별 총수당 목록 */}
      <Card title="🧊 영업대행 상품별 총수당 및 설정 목록">
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                <th className="px-3 py-2.5">상품 코드</th>
                <th className="px-3 py-2.5">상품명</th>
                <th className="px-3 py-2.5">카테고리</th>
                <th className="px-3 py-2.5 text-right">공급가 / 판매가</th>
                <th className="px-3 py-2.5 text-right">설정된 총수당 (위탁비)</th>
                <th className="px-3 py-2.5 text-center">상품 관리</th>
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">불러오는 중…</td></tr>
              )}
              {rows !== null && rows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">등록된 위탁 상품이 없습니다.</td></tr>
              )}
              {rows?.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">#{p.id}</span>
                  </td>
                  <td className="px-3 py-3.5 font-bold text-slate-900">{p.name}</td>
                  <td className="px-3 py-3.5">
                    {p.categoryId != null && cats[p.categoryId]
                      ? <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{cats[p.categoryId]}</span>
                      : <span className="text-xs text-slate-400">-</span>}
                  </td>
                  <td className="px-3 py-3.5 text-right font-bold text-slate-900">{krw(p.salePrice ?? 0)}</td>
                  <td className="px-3 py-3.5 text-right">
                    <span className="font-black text-sky-700">{krw(p.totalAllowance ?? 0)}</span>
                    <span className="ml-1 text-[11px] text-slate-400">총액</span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <Link href={`/partner/products/${p.id}`} className="inline-block rounded-lg border border-sky-300 px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-50">상품보기</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
