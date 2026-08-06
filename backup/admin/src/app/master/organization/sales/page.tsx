"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPost } from "@/lib/api";
import { krw } from "@/components/ui";
import { sanitizeHtml } from "@/lib/sanitize";

type Sale = { id: number; createdAt: string; productId?: number; productName?: string; partnerName?: string; customerName?: string; ceoName?: string; buzzName?: string; managerName?: string; status: string; canReassign?: boolean };
type Resp = { content: Sale[]; page: number; totalPages: number; totalElements: number };

const SIZE = 10;
const DONE = new Set(["구매확정"]);

/* ── 공용 다크 모달 (portal) ── */
function Modal({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-navy-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div><h3 className="text-lg font-black text-white">{title}</h3>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-navy-800">✕</button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="sticky bottom-0 flex justify-end border-t border-line bg-navy-900 px-5 py-3">
          <button onClick={onClose} className="rounded-xl bg-navy-800 px-6 py-2.5 text-sm font-bold text-slate-200 hover:bg-navy-700">닫기</button>
        </div>
      </div>
    </div>, document.body);
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/50 py-2 last:border-0">
      <span className="shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm text-slate-200">{value === 0 || value ? value : "-"}</span>
    </div>
  );
}

/* 상품 정보 모달 (/api/products/{id}) */
function ProductModal({ id, onClose }: { id: number; onClose: () => void }) {
  const [p, setP] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { apiGet<Record<string, unknown>>(`/api/products/${id}`).then((r) => { if (r.ok && r.data) setP(r.data); else setErr(r.message ?? "상품을 찾을 수 없습니다."); }); }, [id]);
  const g = (k: string) => (p?.[k] as string | number | undefined);
  const isRate = g("rewardType") === "RATE";
  return (
    <Modal title={(g("name") as string) ?? "상품 정보"} sub="상품 상세 정보" onClose={onClose}>
      {err ? <p className="text-sm text-danger">{err}</p> : !p ? <p className="text-sm text-slate-500">불러오는 중…</p> : (
        <div>
          <Row label="수당 유형" value={isRate ? "비율(RATE)" : "고정(FIXED)"} />
          <Row label="판매가" value={krw(Number(g("salePrice") ?? 0))} />
          <Row label="총수당(위탁비)" value={krw(Number(g("totalAllowance") ?? 0))} />
          <Row label="1차 버즈회원" value={isRate ? `${g("buzzReward") ?? 0}%` : krw(Number(g("buzzReward") ?? 0))} />
          <Row label="상위 추천(친쿠)" value={isRate ? `${g("chinkuReward") ?? 0}%` : krw(Number(g("chinkuReward") ?? 0))} />
          <Row label="2차 관리매니저" value={isRate ? `${g("managerReward") ?? 0}%` : krw(Number(g("managerReward") ?? 0))} />
          <Row label="소속센터/관리센터" value={isRate ? `${g("salesCenterReward") ?? 0}% / ${g("mgmtCenterReward") ?? 0}%` : `${krw(Number(g("salesCenterReward") ?? 0))} / ${krw(Number(g("mgmtCenterReward") ?? 0))}`} />
          <Row label="본부 / 본사" value={isRate ? `${g("divisionReward") ?? 0}% / ${g("hqReward") ?? 0}%` : `${krw(Number(g("divisionReward") ?? 0))} / ${krw(Number(g("hqReward") ?? 0))}`} />
          {g("description") ? <div className="mt-3 rounded-lg bg-navy-950 px-3 py-2 text-sm text-slate-300"><b className="text-xs text-slate-500">상품 설명</b><div className="rte-content mt-1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(g("description") as string) }} /></div> : null}
        </div>
      )}
    </Modal>
  );
}

/* 고객 정보 모달 (/api/org/sales/{id}) */
function CustomerModal({ id, onClose }: { id: number; onClose: () => void }) {
  const [d, setD] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { apiGet<Record<string, unknown>>(`/api/org/sales/${id}`).then((r) => { if (r.ok && r.data) setD(r.data); else setErr(r.message ?? "고객 정보를 찾을 수 없습니다."); }); }, [id]);
  const g = (k: string) => (d?.[k] as string | undefined);
  return (
    <Modal title={(g("customerName") as string) ?? "고객 정보"} sub={`${g("productName") ?? ""} · ${g("status") ?? ""}`} onClose={onClose}>
      {err ? <p className="text-sm text-danger">{err}</p> : !d ? <p className="text-sm text-slate-500">불러오는 중…</p> : (
        <div>
          <Row label="상호명" value={g("customerName")} />
          <Row label="사업자등록번호" value={g("businessNumber")} />
          <Row label="대표자명" value={g("ceoName")} />
          <Row label="회사 전화번호" value={g("companyPhone")} />
          <Row label="담당자명" value={g("contactName")} />
          <Row label="핸드폰번호" value={g("phone")} />
          <Row label="이메일" value={g("email")} />
          <Row label="회사 주소" value={[g("zipcode"), g("address"), g("addressDetail")].filter(Boolean).join(" ")} />
          <Row label="1차 영업자(버즈)" value={g("buzzName")} />
          <Row label="2차 담당(매니저)" value={g("managerName") ?? "미배정"} />
          {g("memo") ? <div className="mt-3 rounded-lg bg-navy-950 px-3 py-2 text-sm text-slate-300"><b className="text-xs text-slate-500">메모</b><br />{g("memo")}</div> : null}
        </div>
      )}
    </Modal>
  );
}

export default function OrgSalesPage() {
  const [rows, setRows] = useState<Sale[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [kw, setKw] = useState("");
  const [q, setQ] = useState("");
  const [prodId, setProdId] = useState<number | null>(null);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: String(SIZE) });
    if (q) params.set("keyword", q);
    const r = await apiGet<Resp>(`/api/org/sales?${params}`);
    if (r.data) { setRows(r.data.content); setTotalPages(r.data.totalPages || 1); setTotal(r.data.totalElements); setPage(r.data.page); }
    setLoading(false);
  }, [q]);

  useEffect(() => { load(0); }, [load]);

  const reassign = async (id: number) => {
    if (!window.confirm("이 건의 매니저 지정을 취소하고 재배정할까요?\n(매니저·관리센터 수당이 상계 처리됩니다)")) return;
    setBusy(id); setNotice(null);
    const r = await apiPost<{ message: string }>(`/api/org/sales/${id}/reassign`, {});
    setBusy(null);
    if (r.ok) { setNotice(r.data?.message ?? "재배정 처리되었습니다."); load(page); }
    else setNotice(r.message ?? "처리에 실패했습니다.");
  };

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white">영업 관리</h2>
          <p className="mt-0.5 text-xs text-slate-500">전체 1차 영업 등록 현황 (총 {total}건)</p>
        </div>
        <div className="flex items-end gap-2">
          <input className="rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 placeholder:text-slate-600"
            value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setQ(kw)} placeholder="고객 상호명 검색" />
          <button onClick={() => setQ(kw)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">검색</button>
          <button onClick={() => { setKw(""); setQ(""); }} className="rounded-lg border border-line px-3 py-2 text-sm text-slate-300 hover:bg-navy-800">초기화</button>
        </div>
      </div>

      {notice && <div className="mb-3 rounded-lg border border-brand-500/40 bg-brand-600/10 px-4 py-2.5 text-sm font-semibold text-brand-300">{notice}</div>}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-navy-900 text-xs text-slate-500">
              <th className="px-4 py-3 text-left font-semibold">등록일</th>
              <th className="px-4 py-3 text-left font-semibold">상품명</th>
              <th className="px-4 py-3 text-left font-semibold">파트너사</th>
              <th className="px-4 py-3 text-left font-semibold">고객명</th>
              <th className="px-4 py-3 text-left font-semibold">1차영업자(버즈)</th>
              <th className="px-4 py-3 text-left font-semibold">2차담당(매니저)</th>
              <th className="px-4 py-3 text-center font-semibold">영업단계</th>
              <th className="px-4 py-3 text-center font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">검색 결과가 없습니다.</td></tr>
            ) : rows.map((s) => (
              <tr key={s.id} className="hover:bg-navy-800/40">
                <td className="px-4 py-3 text-slate-400">{s.createdAt}</td>
                <td className="px-4 py-3">
                  {s.productId ? <button onClick={() => setProdId(s.productId!)} className="font-semibold text-brand-400 hover:underline">{s.productName ?? "-"}</button> : <span className="font-semibold text-white">{s.productName ?? "-"}</span>}
                </td>
                <td className="px-4 py-3 text-slate-400">{s.partnerName ?? "-"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSaleId(s.id)} className="font-bold text-white hover:text-brand-300 hover:underline">{s.customerName ?? "-"}</button>
                  {s.ceoName ? <span className="text-slate-500"> · {s.ceoName}</span> : null}
                </td>
                <td className="px-4 py-3 text-slate-400">{s.buzzName ?? "-"}</td>
                <td className="px-4 py-3 text-slate-400">{s.managerName ?? "미배정"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${DONE.has(s.status) ? "bg-pos/15 text-pos" : "bg-brand-600/20 text-brand-300"}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {s.canReassign ? (
                    <button disabled={busy === s.id} onClick={() => reassign(s.id)}
                      className="rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50">매니저변경</button>
                  ) : <span className="text-xs text-slate-600">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button disabled={page <= 0} onClick={() => load(page - 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 hover:bg-navy-800 disabled:opacity-40">이전</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => load(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? "bg-brand-600 text-white" : "border border-line text-slate-300 hover:bg-navy-800"}`}>{i + 1}</button>
          ))}
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slate-300 hover:bg-navy-800 disabled:opacity-40">다음</button>
        </div>
      )}

      {prodId != null && <ProductModal id={prodId} onClose={() => setProdId(null)} />}
      {saleId != null && <CustomerModal id={saleId} onClose={() => setSaleId(null)} />}
    </section>
  );
}
