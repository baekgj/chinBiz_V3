"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Badge, krw } from "@/components/ui";
import Icon from "@/components/Icon";
import { apiGet } from "@/lib/api";

type Product = {
  id: number; name: string; rewardType: "RATE" | "FIXED"; salePrice: number; totalAllowance: number;
  categoryId: number | null; partnerId: number | null; onSale: boolean;
  buzzReward: number; chinkuReward: number; managerReward: number; salesCenterReward: number;
  mgmtCenterReward: number; divisionReward: number; hqReward: number;
};
type Cat = { id: number; level: string; name: string };
type Partner = { id: number; companyName: string };
type PageResp = { content: Product[]; page: number; totalElements: number; totalPages: number };

const SUBJECTS: { key: keyof Product; label: string }[] = [
  { key: "buzzReward", label: "1차 버즈회원" },
  { key: "chinkuReward", label: "상위 추천회원(친쿠)" },
  { key: "managerReward", label: "2차 관리매니저" },
  { key: "salesCenterReward", label: "소속센터" },
  { key: "mgmtCenterReward", label: "관리센터" },
  { key: "divisionReward", label: "총괄본부" },
  { key: "hqReward", label: "친비즈 본사" },
];
const SIZE = 8;

export default function ProductsPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [onSale, setOnSale] = useState("");
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResp | null>(null);
  const [sel, setSel] = useState<Product | null>(null);

  useEffect(() => {
    apiGet<Cat[]>("/api/categories").then((r) => { if (r.data) setCats(r.data); });
    apiGet<{ content: Partner[] }>("/api/partners?page=0&size=1000").then((r) => { if (r.data?.content) setPartners(r.data.content); });
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), size: String(SIZE) });
    if (categoryId) qs.set("categoryId", categoryId);
    if (partnerId) qs.set("partnerId", partnerId);
    if (onSale) qs.set("onSale", onSale);
    if (query) qs.set("keyword", query);
    apiGet<PageResp>(`/api/products?${qs.toString()}`).then((r) => {
      if (r.data) {
        setData(r.data);
        setSel((prev) => prev ?? r.data!.content[0] ?? null);
      }
    });
  }, [page, categoryId, partnerId, onSale, query]);

  const catName = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c.name])), [cats]);
  const partnerName = useMemo(() => Object.fromEntries(partners.map((p) => [p.id, p.companyName])), [partners]);

  function applySearch() { setPage(0); setQuery(keyword.trim()); }
  function onFilter(setter: (v: string) => void, v: string) { setter(v); setPage(0); }

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[3fr_2fr] animate-float-up">
      {/* 좌 60% — 리스트 */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-white">상품 리스트</h2>
          <Link href="/master/products/new" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500">+ 상품 등록</Link>
        </div>

        {/* 필터 */}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select value={categoryId} onChange={(e) => onFilter(setCategoryId, e.target.value)} className="rounded-lg border border-line bg-navy-950 px-2 py-1.5 text-xs text-white outline-none focus:border-brand-500">
            <option value="">전체 카테고리</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={partnerId} onChange={(e) => onFilter(setPartnerId, e.target.value)} className="rounded-lg border border-line bg-navy-950 px-2 py-1.5 text-xs text-white outline-none focus:border-brand-500">
            <option value="">전체 파트너사</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.companyName}</option>)}
          </select>
          <select value={onSale} onChange={(e) => onFilter(setOnSale, e.target.value)} className="rounded-lg border border-line bg-navy-950 px-2 py-1.5 text-xs text-white outline-none focus:border-brand-500">
            <option value="">판매여부 전체</option>
            <option value="true">판매중</option>
            <option value="false">판매중지</option>
          </select>
          <div className="flex gap-1">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="상품명 검색" className="w-full rounded-lg border border-line bg-navy-950 px-2 py-1.5 text-xs text-white outline-none focus:border-brand-500 placeholder:text-slate-600" />
            <button onClick={applySearch} className="shrink-0 rounded-lg bg-navy-700 px-2.5 text-xs font-semibold text-slate-200 hover:bg-navy-600">검색</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-slate-400">
                <th className="px-2 py-2.5 text-left font-semibold">상품명</th>
                <th className="px-2 py-2.5 text-left font-semibold">카테고리</th>
                <th className="px-2 py-2.5 text-left font-semibold">파트너사</th>
                <th className="px-2 py-2.5 text-right font-semibold">총수당</th>
                <th className="px-2 py-2.5 text-center font-semibold">판매</th>
                <th className="px-2 py-2.5 text-right font-semibold">수정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-2 py-10 text-center text-slate-500">상품이 없습니다.</td></tr>
              ) : rows.map((p) => (
                <tr key={p.id} className={`cursor-pointer ${sel?.id === p.id ? "bg-brand-600/15" : "hover:bg-navy-800/50"}`} onClick={() => setSel(p)}>
                  <td className="px-2 py-2.5">
                    <span className="font-bold text-brand-400">{p.name}</span>
                    <span className="ml-1 text-[10px] text-slate-500">{p.rewardType}</span>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-slate-300">{p.categoryId ? catName[p.categoryId] ?? "-" : "-"}</td>
                  <td className="px-2 py-2.5 text-xs text-slate-300">{p.partnerId ? partnerName[p.partnerId] ?? "-" : "-"}</td>
                  <td className="px-2 py-2.5 text-right font-semibold text-slate-100">{krw(p.totalAllowance)}</td>
                  <td className="px-2 py-2.5 text-center">{p.onSale ? <Badge tone="pos">판매</Badge> : <Badge tone="slate">중지</Badge>}</td>
                  <td className="px-2 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/master/products/${p.id}/edit`} className="rounded-md border border-line px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:bg-navy-700">수정</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line px-2.5 py-1 text-xs text-slate-300 disabled:opacity-40 hover:bg-navy-800">이전</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`h-7 w-7 rounded-lg text-xs font-semibold ${i === page ? "bg-brand-600 text-white" : "text-slate-400 hover:bg-navy-800"}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line px-2.5 py-1 text-xs text-slate-300 disabled:opacity-40 hover:bg-navy-800">다음</button>
          </div>
        )}
      </Card>

      {/* 우 40% — 시뮬레이터 */}
      <Simulator product={sel} />
    </div>
  );
}

function Simulator({ product }: { product: Product | null }) {
  if (!product) {
    return <Card><p className="py-16 text-center text-sm text-slate-500">상품을 선택하면 총수당 분배가 표시됩니다.</p></Card>;
  }
  const isRate = product.rewardType === "RATE";
  const total = product.totalAllowance;
  const rows = SUBJECTS.map((s) => ({ label: s.label, val: Number(product[s.key]) }));
  const sum = rows.reduce((a, b) => a + b.val, 0);
  const amount = (val: number) => (isRate ? Math.round((total * val) / 100) : val);
  const amountSum = rows.reduce((a, b) => a + amount(b.val), 0);
  const valid = isRate ? Math.abs(sum - 100) < 0.001 : sum === total;

  return (
    <Card>
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-base font-black text-white"><Icon name="sitemap" className="h-5 w-5 text-brand-400" /> 총수당 분배</h2>
        <p className="mt-0.5 text-xs text-slate-500">{product.name} · {product.rewardType} · 총수당 {krw(total)}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-800 text-xs text-slate-400">
              <th className="px-3 py-2 text-left font-semibold">분배 대상</th>
              <th className="px-2 py-2 text-right font-semibold">{isRate ? "비율(%)" : "금액"}</th>
              <th className="px-3 py-2 text-right font-semibold">지급액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2 text-slate-200">{i + 1}. {r.label}</td>
                <td className="px-2 py-2 text-right font-semibold text-slate-300">{isRate ? `${r.val}%` : krw(r.val)}</td>
                <td className="px-3 py-2 text-right font-bold text-slate-100">{krw(amount(r.val))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={`text-sm font-black ${valid ? "bg-pos/10 text-pos" : "bg-danger/10 text-danger"}`}>
              <td className="px-3 py-2.5">합계</td>
              <td className="px-2 py-2.5 text-right">{isRate ? `${sum}%` : krw(sum)}</td>
              <td className="px-3 py-2.5 text-right">{krw(amountSum)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold ${valid ? "bg-pos/10 text-pos ring-1 ring-pos/30" : "bg-danger/10 text-danger ring-1 ring-danger/30"}`}>
        {valid ? "✓ 분배 검증 완료" : isRate ? `⚠ 비율 합계 ${sum}% (100% 필요)` : `⚠ 금액 합계가 총수당(${krw(total)})과 불일치`}
      </p>
      <Link href={`/master/products/${product.id}/edit`} className="mt-3 block rounded-xl border border-line py-2 text-center text-sm font-semibold text-slate-300 hover:bg-navy-800">상품 정보 수정</Link>
    </Card>
  );
}
