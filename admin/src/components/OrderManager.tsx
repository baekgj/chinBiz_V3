"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPut } from "@/lib/api";

/**
 * 단순배송상품 주문관리 (docs/33) — 파트너 admin(/api/partner/orders, 라이트) · 본사 admin(/api/org/orders, 다크) 공용.
 * 리스트: 주문번호·주문일자·구매자명·상품명·판매가격·수량·결제금액·주문상태. 주문번호 클릭 → 상세 + 주문상태 변경.
 */
type Row = { id: number; orderNo: string; createdAt: string; ordererName?: string; productName?: string; partnerName?: string; salePrice: number; quantity: number; totalAmount: number; payMethod?: string; status: string };
type Delivery = { receiverName?: string; receiverMobile?: string; zipcode?: string; address?: string; addressDetail?: string; quantity: number };
type Detail = Row & {
  createdAtFull?: string; ordererTel?: string; ordererMobile?: string; ordererEmail?: string;
  ordererZipcode?: string; ordererAddress?: string; ordererAddressDetail?: string; deliveries: Delivery[];
};
type Resp = { content: Row[]; page: number; totalPages: number; totalElements: number };

const STATUSES = ["접수", "입금", "배송완료", "취소"] as const;
const SIZE = 10;
const won = (n?: number) => (n ?? 0).toLocaleString("ko-KR") + "원";

const THEME = {
  light: {
    card: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", title: "text-slate-900", sub: "text-slate-500",
    input: "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500",
    primary: "rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-50",
    ghost: "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100",
    table: "overflow-x-auto rounded-xl border border-slate-200", thead: "bg-slate-50 text-xs text-slate-500", divide: "divide-y divide-slate-100",
    rowHover: "hover:bg-slate-50", cell: "text-slate-600", cellMain: "text-slate-900", link: "font-bold text-sky-600 hover:underline",
    modal: "bg-white border-slate-200", modalLine: "border-slate-100", pageOn: "bg-sky-600 text-white", pageOff: "border border-slate-300 text-slate-600 hover:bg-slate-100",
    box: "rounded-lg bg-slate-50 px-3 py-2",
  },
  dark: {
    card: "card p-5", title: "text-white", sub: "text-slate-500",
    input: "rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500",
    primary: "rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-50",
    ghost: "rounded-lg border border-line px-3 py-2 text-sm text-slate-300 hover:bg-navy-800",
    table: "overflow-x-auto rounded-xl border border-line", thead: "bg-navy-900 text-xs text-slate-500", divide: "divide-y divide-line",
    rowHover: "hover:bg-navy-800/40", cell: "text-slate-400", cellMain: "text-white", link: "font-bold text-brand-400 hover:underline",
    modal: "bg-navy-900 border-line", modalLine: "border-line/50", pageOn: "bg-brand-600 text-white", pageOff: "border border-line text-slate-300 hover:bg-navy-800",
    box: "rounded-lg bg-navy-950 px-3 py-2",
  },
};

const STATUS_BADGE: Record<string, string> = {
  접수: "bg-sky-500/15 text-sky-500", 입금: "bg-amber-500/15 text-amber-500",
  배송완료: "bg-emerald-500/15 text-emerald-500", 취소: "bg-red-500/15 text-red-500",
};

export default function OrderManager({ api, tone, showPartner = false }: { api: string; tone: "light" | "dark"; showPartner?: boolean }) {
  const t = THEME[tone];
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [kw, setKw] = useState("");
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), size: String(SIZE) });
    if (q) params.set("keyword", q);
    if (st) params.set("status", st);
    const r = await apiGet<Resp>(`${api}?${params}`);
    if (r.data) { setRows(r.data.content); setTotalPages(r.data.totalPages || 1); setTotal(r.data.totalElements); setPage(r.data.page); }
    setLoading(false);
  }, [api, q, st]);

  useEffect(() => { load(0); }, [load]);

  const cols = showPartner ? 9 : 8;

  return (
    <section className={t.card}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={`text-base font-black ${t.title}`}>주문 관리</h2>
          <p className={`mt-0.5 text-xs ${t.sub}`}>단순배송상품 주문접수 내역 (총 {total}건)</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select className={t.input} value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="">전체 상태</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className={t.input} value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setQ(kw)} placeholder="구매자명·상품명·주문번호" />
          <button onClick={() => setQ(kw)} className={t.primary}>검색</button>
          <button onClick={() => { setKw(""); setQ(""); setSt(""); }} className={t.ghost}>초기화</button>
        </div>
      </div>

      <div className={t.table}>
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className={t.thead}>
              <th className="px-4 py-3 text-left font-semibold">주문번호</th>
              <th className="px-4 py-3 text-left font-semibold">주문일자</th>
              <th className="px-4 py-3 text-left font-semibold">구매자명</th>
              <th className="px-4 py-3 text-left font-semibold">상품명</th>
              {showPartner && <th className="px-4 py-3 text-left font-semibold">파트너사</th>}
              <th className="px-4 py-3 text-right font-semibold">판매가격</th>
              <th className="px-4 py-3 text-right font-semibold">수량</th>
              <th className="px-4 py-3 text-right font-semibold">결제금액</th>
              <th className="px-4 py-3 text-center font-semibold">주문상태</th>
            </tr>
          </thead>
          <tbody className={t.divide}>
            {loading ? (
              <tr><td colSpan={cols} className={`px-4 py-10 text-center ${t.sub}`}>불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={cols} className={`px-4 py-10 text-center ${t.sub}`}>주문 내역이 없습니다.</td></tr>
            ) : rows.map((o) => (
              <tr key={o.id} className={t.rowHover}>
                <td className="px-4 py-3"><button onClick={() => setOpenId(o.id)} className={t.link}>{o.orderNo}</button></td>
                <td className={`px-4 py-3 ${t.cell}`}>{o.createdAt}</td>
                <td className={`px-4 py-3 font-semibold ${t.cellMain}`}>{o.ordererName ?? "-"}</td>
                <td className={`px-4 py-3 ${t.cellMain}`}>{o.productName ?? "-"}</td>
                {showPartner && <td className={`px-4 py-3 ${t.cell}`}>{o.partnerName ?? "-"}</td>}
                <td className={`px-4 py-3 text-right ${t.cell}`}>{won(o.salePrice)}</td>
                <td className={`px-4 py-3 text-right ${t.cell}`}>{o.quantity}</td>
                <td className={`px-4 py-3 text-right font-bold ${t.cellMain}`}>{won(o.totalAmount)}</td>
                <td className="px-4 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[o.status] ?? ""}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <button disabled={page <= 0} onClick={() => load(page - 1)} className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 ${t.pageOff}`}>이전</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => load(i)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${i === page ? t.pageOn : t.pageOff}`}>{i + 1}</button>
          ))}
          <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 ${t.pageOff}`}>다음</button>
        </div>
      )}

      {openId != null && (
        <OrderDetailModal api={api} id={openId} tone={tone} onClose={() => setOpenId(null)} onSaved={() => load(page)} />
      )}
    </section>
  );
}

function OrderDetailModal({ api, id, tone, onClose, onSaved }: { api: string; id: number; tone: "light" | "dark"; onClose: () => void; onSaved: () => void }) {
  const t = THEME[tone];
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    apiGet<Detail>(`${api}/${id}`).then((r) => {
      if (r.ok && r.data) { setD(r.data); setStatus(r.data.status); } else setErr(r.message ?? "주문을 찾을 수 없습니다.");
    });
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [api, id]);

  async function save() {
    if (!d || status === d.status) return;
    if (!window.confirm(`주문상태를 [${d.status}] → [${status}](으)로 변경하시겠습니까?`)) return;
    setBusy(true); setMsg(null);
    const r = await apiPut<Detail>(`${api}/${id}/status`, { status });
    setBusy(false);
    if (r.ok && r.data) { setD(r.data); setMsg("주문상태가 변경되었습니다."); onSaved(); }
    else setMsg(r.message ?? "변경에 실패했습니다.");
  }

  const Line = ({ k, v }: { k: string; v?: string | number | null }) => (
    <div className={`flex justify-between gap-4 border-b py-2 last:border-0 ${t.modalLine}`}>
      <span className={`shrink-0 text-xs font-semibold ${t.sub}`}>{k}</span>
      <span className={`text-right text-sm ${t.cellMain}`}>{v === 0 || v ? v : "-"}</span>
    </div>
  );

  // 전체화면 레이어 — 헤더(닫기)·하단 상태변경 바 고정, 본문만 스크롤
  return createPortal(
    <div className={`fixed inset-0 z-[1000] flex flex-col ${t.modal}`}>
      <div className={`flex shrink-0 items-center justify-between border-b px-5 py-4 sm:px-8 ${t.modalLine}`}>
        <div>
          <h3 className={`text-xl font-black ${t.title}`}>주문 상세</h3>
          <p className={`text-xs ${t.sub}`}>{d ? `${d.orderNo} · ${d.createdAtFull ?? d.createdAt}` : ""}</p>
        </div>
        <button onClick={onClose} className={`rounded-lg px-4 py-2 text-sm font-bold ${t.ghost}`}>✕ 닫기</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-5 py-6 sm:px-8">
          {err ? <p className="text-sm text-red-500">{err}</p> : !d ? <p className={`text-sm ${t.sub}`}>불러오는 중…</p> : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
              <div className={t.box}>
                <p className={`mb-1 text-sm font-black ${t.title}`}>주문 정보</p>
                <Line k="상품명" v={d.productName} />
                {d.partnerName && <Line k="파트너사" v={d.partnerName} />}
                <Line k="판매가격" v={won(d.salePrice)} />
                <Line k="수량" v={d.quantity} />
                <Line k="결제금액" v={won(d.totalAmount)} />
                <Line k="결제방식" v={d.payMethod === "BANK" ? "무통장" : d.payMethod === "CARD" ? "신용카드" : d.payMethod} />
              </div>
              <div className={t.box}>
                <p className={`mb-1 text-sm font-black ${t.title}`}>주문자 정보</p>
                <Line k="주문자명" v={d.ordererName} />
                <Line k="연락처" v={d.ordererTel} />
                <Line k="핸드폰번호" v={d.ordererMobile} />
                <Line k="이메일" v={d.ordererEmail} />
                <Line k="주소" v={[d.ordererZipcode && `(${d.ordererZipcode})`, d.ordererAddress, d.ordererAddressDetail].filter(Boolean).join(" ")} />
              </div>
              </div>
              <div>
                <p className={`mb-2 text-sm font-black ${t.title}`}>수령인 정보 ({d.deliveries.length}곳)</p>
                <div className={t.table}>
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className={t.thead}>
                        <th className="px-4 py-3 text-center font-semibold">No</th>
                        <th className="px-4 py-3 text-left font-semibold">수령인명</th>
                        <th className="px-4 py-3 text-left font-semibold">핸드폰번호</th>
                        <th className="px-4 py-3 text-left font-semibold">우편번호</th>
                        <th className="px-4 py-3 text-left font-semibold">배송지 주소</th>
                        <th className="px-4 py-3 text-right font-semibold">수량</th>
                      </tr>
                    </thead>
                    <tbody className={t.divide}>
                      {d.deliveries.map((v, i) => (
                        <tr key={i}>
                          <td className={`px-4 py-3 text-center ${t.cell}`}>{i + 1}</td>
                          <td className={`px-4 py-3 font-bold ${t.cellMain}`}>{v.receiverName ?? "-"}</td>
                          <td className={`px-4 py-3 ${t.cell}`}>{v.receiverMobile ?? "-"}</td>
                          <td className={`px-4 py-3 ${t.cell}`}>{v.zipcode || "-"}</td>
                          <td className={`px-4 py-3 ${t.cellMain}`}>{[v.address, v.addressDetail].filter(Boolean).join(" ") || "-"}</td>
                          <td className={`px-4 py-3 text-right font-bold ${t.cellMain}`}>{v.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {d && (
        <div className={`shrink-0 border-t px-5 py-4 sm:px-8 ${t.modalLine}`}>
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2">
            <span className={`text-sm font-black ${t.title}`}>주문상태</span>
            <select className={t.input} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={save} disabled={busy || status === d.status} className={t.primary}>{busy ? "저장 중…" : "상태 변경"}</button>
            {msg && <span className={`text-xs font-semibold ${t.sub}`}>{msg}</span>}
            <button onClick={onClose} className={`ml-auto ${t.ghost}`}>목록으로</button>
          </div>
        </div>
      )}
    </div>, document.body);
}
