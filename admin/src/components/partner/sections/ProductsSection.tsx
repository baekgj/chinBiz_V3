"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { krw } from "@/components/ui";
import { Card, Stat } from "@/components/partner/PartnerUI";
import { apiGet } from "@/lib/api";

type Product = {
  id: number; name: string; rewardType: string; salePrice: number; totalAllowance: number;
  categoryId: number | null; onSale: boolean;
};
type Cat = { id: number; name: string };

/** 파트너 · 위탁 상품 및 총수당 관리 (실데이터 + 상품 등록 버튼) */
export default function ProductsSection() {
  const [rows, setRows] = useState<Product[]>([]);
  const [cats, setCats] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ content: Product[] }>("/api/partner/products?page=0&size=100").then((r) => {
      if (r.data?.content) setRows(r.data.content);
      setLoading(false);
    });
    apiGet<Cat[]>("/api/partner/categories").then((r) => {
      if (r.data) setCats(Object.fromEntries(r.data.map((c) => [c.id, c.name])));
    });
  }, []);

  const onSaleCount = rows.filter((p) => p.onSale).length;

  return (
    <Card
      title="위탁 영업대행 상품 및 총수당 관리"
      sub="대행 맡긴 상품 라인업과 상품별 총수당(7주체 배정액) 룰"
      right={
        <Link href="/partner/products/new"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-sky-500">
          + 상품 등록
        </Link>
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="등록 위탁 상품" value={String(rows.length)} unit="종" tone="sky" />
        <Stat label="판매중 상품" value={String(onSaleCount)} unit="종" tone="emerald" />
        <Stat label="판매중지" value={String(rows.length - onSaleCount)} unit="종" tone="slate" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500">
              <th className="px-4 py-3 text-left font-semibold">상품명</th>
              <th className="px-4 py-3 text-left font-semibold">카테고리</th>
              <th className="px-4 py-3 text-center font-semibold">수당유형</th>
              <th className="px-4 py-3 text-right font-semibold">판매가</th>
              <th className="px-4 py-3 text-right font-semibold">총수당(위탁비)</th>
              <th className="px-4 py-3 text-center font-semibold">상태</th>
              <th className="px-4 py-3 text-right font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">등록된 위탁 상품이 없습니다. [+ 상품 등록]으로 추가하세요.</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className="hover:bg-sky-50/50">
                <td className="px-4 py-3 font-bold text-slate-900">
                  <Link href={`/partner/products/${p.id}`} className="hover:text-sky-600 hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.categoryId ? (cats[p.categoryId] ?? "-") : "-"}</td>
                <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500">{p.rewardType === "RATE" ? "비율" : "고정"}</td>
                <td className="px-4 py-3 text-right text-slate-700">{krw(p.salePrice)}</td>
                <td className="px-4 py-3 text-right font-black text-sky-600">{krw(p.totalAllowance)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.onSale ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.onSale ? "판매중" : "중지"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/partner/products/${p.id}`} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">수정</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
