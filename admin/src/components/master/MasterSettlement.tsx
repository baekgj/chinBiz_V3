"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, SectionTitle, krw } from "@/components/ui";
import { apiGet, apiPost } from "@/lib/api";

type Tab = "sales" | "closed" | "payments" | "paid";
type Row = Record<string, unknown>;
type Resp = { content: Row[]; total?: number; count?: number };

const CFG: Record<Tab, {
  title: string; sub: string; get: string; action?: { path: string; label: string; confirm: string };
  cols: { key: string; label: string; align?: "right" | "center"; money?: boolean }[];
}> = {
  sales: {
    title: "매출현황", sub: "구매확정(MP)·미지급·미마감 수당 (확정월 기준)", get: "/api/org/settlement/sales",
    action: { path: "/api/org/settlement/sales/close", label: "마감완료", confirm: "조회된 매출을 마감완료 처리하시겠습니까? (확정일자/확정월 기록)" },
    cols: [
      { key: "saleRegDate", label: "영업등록일" }, { key: "orderNo", label: "주문번호" },
      { key: "memberType", label: "회원유형" }, { key: "memberId", label: "회원ID" },
      { key: "allowanceType", label: "수당구분" }, { key: "amount", label: "수당금액", align: "right", money: true },
      { key: "confirmDate", label: "확정일자" },
    ],
  },
  closed: {
    title: "마감내역", sub: "마감완료·미지급 수당 (회원별 합산)", get: "/api/org/settlement/closed",
    action: { path: "/api/org/settlement/closed/settle", label: "정산완료", confirm: "조회된 마감내역을 정산완료 처리하시겠습니까? (정산전표 생성)" },
    cols: [
      { key: "memberType", label: "회원유형" }, { key: "memberId", label: "회원ID" },
      { key: "amount", label: "수당금액", align: "right", money: true },
    ],
  },
  payments: {
    title: "정산내역", sub: "정산전표 · 지급 대기", get: "/api/org/settlement/payments",
    action: { path: "/api/org/settlement/payments/pay", label: "지급완료", confirm: "조회된 정산내역을 지급완료 처리하시겠습니까?" },
    cols: [
      { key: "memberType", label: "회원유형" }, { key: "memberId", label: "회원ID" },
      { key: "bankName", label: "은행명" }, { key: "accountNumber", label: "계좌번호" }, { key: "accountHolder", label: "예금주" },
      { key: "amount", label: "지급금액", align: "right", money: true },
    ],
  },
  paid: {
    title: "지급내역", sub: "지급완료 정산 전표", get: "/api/org/settlement/paid",
    cols: [
      { key: "memberType", label: "회원유형" }, { key: "memberId", label: "회원ID" },
      { key: "bankName", label: "은행명" }, { key: "accountNumber", label: "계좌번호" }, { key: "accountHolder", label: "예금주" },
      { key: "amount", label: "지급금액", align: "right", money: true }, { key: "paymentDate", label: "지급일자" },
    ],
  },
};

const thisMonthInput = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`; };

export default function MasterSettlement({ tab }: { tab: Tab }) {
  const cfg = CFG[tab];
  const [monthInput, setMonthInput] = useState(thisMonthInput());
  const [q, setQ] = useState(thisMonthInput().replace("-", ""));
  const [data, setData] = useState<Resp>({ content: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiGet<Resp>(`${cfg.get}?month=${q}`);
    if (r.ok && r.data) setData(r.data); else setData({ content: [] });
    setLoading(false);
  }, [cfg.get, q]);
  useEffect(() => { load(); }, [load]);

  async function runAction() {
    if (!cfg.action) return;
    if (!confirm(cfg.action.confirm)) return;
    setBusy(true); setMsg(null);
    const r = await apiPost<{ message: string }>(cfg.action.path, { month: q });
    setBusy(false);
    setMsg(r.data?.message ?? (r.ok ? "처리되었습니다." : r.message ?? "처리 실패"));
    if (r.ok) load();
  }

  // 합계금액·대상건수 (API 제공 시 우선, 없으면 content amount 합산)
  const count = data.count ?? data.content.length;
  const total = typeof data.total === "number"
    ? data.total
    : data.content.reduce((s, r) => s + Number((r as { amount?: number }).amount ?? 0), 0);

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle title={cfg.title} sub={cfg.sub} />

        {/* 상단바: 좌측 합계/건수 · 우측 대상월/검색 (4화면 통일) */}
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="text-sm text-slate-300">
            합계 <b className="text-base text-white">{krw(total)}</b>
            <span className="mx-2 text-slate-600">·</span>
            대상 <b className="text-white">{count.toLocaleString()}</b>건
          </div>
          <div className="flex items-end gap-2">
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-400">대상월</p>
              <input type="month" value={monthInput} onChange={(e) => setMonthInput(e.target.value)}
                className="rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500" />
            </div>
            <button onClick={() => setQ(monthInput.replace("-", ""))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">검색</button>
          </div>
        </div>

        {/* 리스트 (스크롤, 페이징 없음) */}
        <div className="max-h-[62vh] overflow-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 z-10 bg-navy-900">
              <tr className="border-b border-line text-xs text-slate-400">
                {cfg.cols.map((c) => <th key={c.key} className={`px-3 py-3 font-semibold ${c.align === "right" ? "text-right" : "text-left"}`}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={cfg.cols.length} className="px-3 py-10 text-center text-slate-500">불러오는 중…</td></tr>
              ) : data.content.length === 0 ? (
                <tr><td colSpan={cfg.cols.length} className="px-3 py-10 text-center text-slate-500">내역이 없습니다.</td></tr>
              ) : data.content.map((row, i) => (
                <tr key={i} className="hover:bg-navy-800/50">
                  {cfg.cols.map((c) => {
                    const v = row[c.key];
                    return <td key={c.key} className={`px-3 py-2.5 ${c.align === "right" ? "text-right font-black text-white" : "text-slate-300"}`}>
                      {c.money ? krw(Number(v ?? 0)) : (v == null || v === "" ? "-" : String(v))}
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {msg && <p className="mt-3 rounded-lg border border-brand-500/40 bg-brand-600/10 px-3 py-2 text-sm text-brand-200">{msg}</p>}

        {/* 액션 버튼 (리스트 하단 오른쪽) */}
        {cfg.action && (
          <div className="mt-4 flex justify-end">
            <button onClick={runAction} disabled={busy || data.content.length === 0}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-50">
              {busy ? "처리 중…" : cfg.action.label}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
