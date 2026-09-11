"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, SectionTitle, krw } from "@/components/ui";
import { apiGet } from "@/lib/api";
import DatePicker from "@/components/DatePicker";

/** 본사 [수당및정산관리]-[회비결제내역] — 전체 회비/입점비 결제내역 검색·조회 */

type Row = {
  id: number; paidAt?: string | null; payerType?: string; role?: string;
  payerLoginId?: string; payerName?: string; feeType?: string; method?: string;
  amount?: number; expiryAfter?: string | null; status?: string; receiptType?: string | null; receiptStatus?: string | null;
};
type PageResp = { content: Row[]; page: number; size: number; totalElements: number; totalPages: number };

const ROLE_LABEL: Record<string, string> = { MANAGER: "매니저", CENTER_ADMIN: "센터", PARTNER: "파트너" };
const FEE_LABEL: Record<string, string> = { monthly: "월회비", yearly: "연회비", entry: "입점비" };
const METHOD_LABEL: Record<string, string> = { CARD: "신용카드", VBANK: "가상계좌", TRANSFER: "계좌이체", NAVERPAY: "네이버페이", KAKAOPAY: "카카오페이", EASYPAY: "간편결제", MP: "MP수당" };

const TARGETS = [["", "전체"], ["MANAGER", "매니저"], ["CENTER_ADMIN", "센터"], ["PARTNER", "파트너"]] as const;
const METHODS = [["", "전체"], ["CARD", "신용카드"], ["VBANK", "가상계좌"], ["TRANSFER", "계좌이체"], ["NAVERPAY", "네이버페이"], ["KAKAOPAY", "카카오페이"], ["MP", "MP"]] as const;
const FEETYPES = [["", "전체"], ["monthly", "월회비"], ["yearly", "연회비"], ["entry", "입점비"]] as const;

const inputCls = "rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500";
const SIZE = 15;

export default function FeePaymentList() {
  // 검색 폼(draft)
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [target, setTarget] = useState("");
  const [method, setMethod] = useState("");
  const [feeType, setFeeType] = useState("");
  const [keyword, setKeyword] = useState("");
  // 적용된 검색조건
  const [q, setQ] = useState({ from: "", to: "", target: "", method: "", feeType: "", keyword: "" });
  const [page, setPage] = useState(0);

  const [data, setData] = useState<PageResp | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(p), size: String(SIZE) });
    if (q.from) sp.set("from", q.from);
    if (q.to) sp.set("to", q.to);
    if (q.target) sp.set("target", q.target);
    if (q.method) sp.set("method", q.method);
    if (q.feeType) sp.set("feeType", q.feeType);
    if (q.keyword) sp.set("keyword", q.keyword);
    const r = await apiGet<PageResp>(`/api/payment/admin/list?${sp}`);
    setData(r.ok && r.data ? r.data : { content: [], page: 0, size: SIZE, totalElements: 0, totalPages: 1 });
    setLoading(false);
  }, [q]);

  useEffect(() => { load(page); }, [load, page]);

  function search() {
    setQ({ from, to, target, method, feeType, keyword });
    setPage(0);
  }

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="animate-float-up space-y-6">
      <Card>
        <SectionTitle title="회비결제내역" sub="매니저·센터 회비 및 파트너 입점비 전체 결제내역" />

        {/* 검색 */}
        <div className="grid gap-3 rounded-xl bg-navy-800 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="shrink-0">결제일</span>
            <div className="flex-1"><DatePicker variant="dark" value={from} onChange={setFrom} placeholder="시작일" /></div>
            <span className="text-slate-500">~</span>
            <div className="flex-1"><DatePicker variant="dark" value={to} onChange={setTo} min={from || undefined} placeholder="종료일" /></div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            대상
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={`flex-1 ${inputCls}`}>
              {TARGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            결제방법
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={`flex-1 ${inputCls}`}>
              {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            구분
            <select value={feeType} onChange={(e) => setFeeType(e.target.value)} className={`flex-1 ${inputCls}`}>
              {FEETYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400 sm:col-span-2 lg:col-span-1">
            검색어
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(); }}
              placeholder="회원ID·회원명" className={`flex-1 ${inputCls}`} />
          </label>
          <div className="flex items-center justify-end sm:col-span-2 lg:col-span-3">
            <button onClick={search} className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-bold text-white hover:bg-brand-500">검색</button>
          </div>
        </div>

        {/* 리스트 */}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
          <span>총 <b className="text-white">{(data?.totalElements ?? 0).toLocaleString()}</b>건</span>
        </div>
        <div className="mt-2 max-h-[60vh] overflow-auto rounded-xl border border-line">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 z-10 bg-navy-900">
              <tr className="border-b border-line text-xs text-slate-400">
                <th className="px-3 py-3 text-left font-semibold">결제일자</th>
                <th className="px-3 py-3 text-left font-semibold">회원유형</th>
                <th className="px-3 py-3 text-left font-semibold">회원ID(회원명)</th>
                <th className="px-3 py-3 text-left font-semibold">구분</th>
                <th className="px-3 py-3 text-left font-semibold">결제수단</th>
                <th className="px-3 py-3 text-right font-semibold">결제금액</th>
                <th className="px-3 py-3 text-center font-semibold">만기일자</th>
                <th className="px-3 py-3 text-center font-semibold">현금영수증</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">불러오는 중…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-slate-500">결제내역이 없습니다.</td></tr>
              ) : rows.map((r) => {
                const receipt = r.receiptStatus === "ISSUED" ? { t: "발급완료", c: "bg-emerald-500/15 text-emerald-400" }
                  : r.receiptType ? { t: "미발급", c: "bg-red-500/15 text-red-400" } : null;
                return (
                  <tr key={r.id} className="hover:bg-navy-800/50">
                    <td className="px-3 py-2.5 text-slate-300">{r.paidAt ? r.paidAt.replace("T", " ").slice(0, 16) : "-"}</td>
                    <td className="px-3 py-2.5 text-slate-300">{ROLE_LABEL[r.role ?? ""] ?? r.role ?? "-"}</td>
                    <td className="px-3 py-2.5 text-slate-200">{r.payerLoginId}{r.payerName ? ` (${r.payerName})` : ""}</td>
                    <td className="px-3 py-2.5 text-slate-300">{FEE_LABEL[r.feeType ?? ""] ?? r.feeType ?? "-"}</td>
                    <td className="px-3 py-2.5 text-slate-300">{METHOD_LABEL[r.method ?? ""] ?? r.method ?? "-"}</td>
                    <td className="px-3 py-2.5 text-right font-black text-white">{krw(Number(r.amount ?? 0))}</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">{r.expiryAfter ?? "-"}</td>
                    <td className="px-3 py-2.5 text-center">
                      {receipt ? <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${receipt.c}`}>{receipt.t}</span> : <span className="text-slate-500">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이징 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button disabled={page <= 0} onClick={() => setPage(page - 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40">이전</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? "bg-brand-600 text-white" : "border border-line text-slate-300"}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40">다음</button>
          </div>
        )}
      </Card>
    </div>
  );
}
