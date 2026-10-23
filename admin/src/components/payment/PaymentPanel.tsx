"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

/** 회비/입점비 결제 화면 (매니저·센터 회비, 파트너 입점비 공통). app-settings 금액 + /api/payment 연동 */

type FeeOption = { key: string; label: string; baseFee: number; supplyValue: number };
type PayInfo = {
  payerType: "USER" | "PARTNER";
  role: string;
  vatPercent: number;
  feeKind: "MEMBERSHIP" | "ENTRY";
  feeOptions: FeeOption[];
  methods: string[];
  availableMp: number;
  membershipExpiry?: string | null;
  expired?: boolean;
  entryFeePaid?: boolean;
  entryFeePaidDate?: string | null;
};

type PrepareResp = {
  done: boolean; info?: PayInfo; message?: string;
  orderId?: string; amount?: number; orderName?: string; customerName?: string;
  customerMobilePhone?: string; receiptRequested?: boolean;
  tossEnabled?: boolean; clientKey?: string; method?: string;
};

type HistoryRow = {
  id: number; paidAt?: string | null; feeType?: string; method?: string;
  baseFee?: number; vat?: number; amount?: number; status?: string; expiryAfter?: string | null; orderId?: string;
  receiptEligible?: boolean; receiptType?: string | null; receiptStatus?: string | null; receiptKey?: string | null;
};

const FEE_LABEL: Record<string, string> = { monthly: "월회비", yearly: "연회비", entry: "입점비" };
const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  DONE: { text: "결제완료", cls: "bg-emerald-50 text-emerald-700" },
  PENDING: { text: "결제대기", cls: "bg-slate-100 text-slate-500" },
  WAITING_DEPOSIT: { text: "입금대기", cls: "bg-amber-50 text-amber-700" },
  CANCELED: { text: "취소", cls: "bg-red-50 text-red-600" },
};

const METHOD_LABEL: Record<string, string> = {
  CARD: "신용카드", VBANK: "가상계좌", TRANSFER: "계좌이체", NAVERPAY: "네이버페이", KAKAOPAY: "카카오페이", MP: "MP수당 결제",
};
// 우리 결제수단 → 토스 SDK 결제수단 코드 (네이버페이·카카오페이는 간편결제 provider)
const TOSS_METHOD: Record<string, string> = {
  CARD: "CARD", VBANK: "VIRTUAL_ACCOUNT", TRANSFER: "TRANSFER", NAVERPAY: "간편결제", KAKAOPAY: "간편결제",
};
// 간편결제 provider 코드(토스): 네이버페이=NAVERPAY, 카카오페이=KAKAOPAY
const EASYPAY_PROVIDER: Record<string, string> = { NAVERPAY: "NAVERPAY", KAKAOPAY: "KAKAOPAY" };

const won = (n: number) => n.toLocaleString("ko-KR");

/** 토스 결제 SDK(v2) 동적 로드 — clientKey 설정 시에만 사용 */
function loadTossSdk(): Promise<(clientKey: string) => unknown> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { TossPayments?: (k: string) => unknown };
    if (w.TossPayments) return resolve(w.TossPayments);
    const s = document.createElement("script");
    s.src = "https://js.tosspayments.com/v2/standard";
    s.onload = () => (w.TossPayments ? resolve(w.TossPayments) : reject(new Error("SDK 로드 실패")));
    s.onerror = () => reject(new Error("SDK 로드 실패"));
    document.head.appendChild(s);
  });
}

export default function PaymentPanel({ homePath }: { homePath: string }) {
  const [info, setInfo] = useState<PayInfo | null>(null);
  const [feeType, setFeeType] = useState<string>("");
  const [method, setMethod] = useState<string>("CARD");
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [receiptBusy, setReceiptBusy] = useState<number | null>(null);
  const [receiptMsg, setReceiptMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function issueReceipt(id: number) {
    setReceiptBusy(id); setReceiptMsg(null);
    const r = await apiPost<{ message?: string }>(`/api/payment/${id}/receipt`, {});
    setReceiptBusy(null);
    setReceiptMsg({ ok: r.ok, text: r.message || (r.ok ? "발행되었습니다." : "발행에 실패했습니다.") });
    apiGet<{ content: HistoryRow[] }>("/api/payment/history").then((rr) => { if (rr.ok && rr.data) setHistory(rr.data.content); });
    setTimeout(() => setReceiptMsg(null), 3000);
  }

  function load() {
    apiGet<PayInfo>("/api/payment/info").then((r) => {
      if (r.ok && r.data) {
        setInfo(r.data);
        setFeeType((prev) => prev || r.data!.feeOptions[0]?.key || "");
      }
    });
    apiGet<{ content: HistoryRow[] }>("/api/payment/history").then((r) => {
      setHistory(r.ok && r.data ? r.data.content : []);
    });
  }
  function cleanUrl() {
    window.history.replaceState({}, "", window.location.pathname);
  }
  // 토스 결제창 리다이렉트 복귀 처리(successUrl/failUrl = 이 페이지)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const paymentKey = q.get("paymentKey"), orderId = q.get("orderId"), amountQ = q.get("amount");
    if (paymentKey && orderId) {
      apiPost<PayInfo & { message?: string }>("/api/payment/confirm", { orderId, paymentKey, amount: amountQ ? Number(amountQ) : undefined })
        .then((r) => {
          cleanUrl();
          if (r.ok) { setMsg({ ok: true, text: "결제가 완료되었습니다. 잠시 후 이동합니다." }); setTimeout(() => { window.location.href = homePath; }, 1400); }
          else setMsg({ ok: false, text: r.message || "결제 승인에 실패했습니다." });
          load();
        });
      return;
    }
    if (q.get("code")) { cleanUrl(); setMsg({ ok: false, text: q.get("message") || "결제가 취소/실패했습니다." }); }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const option = useMemo(() => info?.feeOptions.find((o) => o.key === feeType) ?? info?.feeOptions[0], [info, feeType]);
  const isMp = method === "MP";
  const amount = option ? (isMp ? option.supplyValue : option.baseFee) : 0;
  const vat = option ? option.baseFee - option.supplyValue : 0;
  const mpDisabledForPartner = info?.payerType === "PARTNER";

  function succeed(next?: PayInfo) {
    if (next) setInfo(next);
    setMsg({ ok: true, text: "결제가 완료되었습니다. 잠시 후 이동합니다." });
    setTimeout(() => { window.location.href = homePath; }, 1400); // 재검증(게이트 해제) 위해 전체 이동
  }

  async function pay() {
    if (!option) return;
    if (isMp && mpDisabledForPartner) { setMsg({ ok: false, text: "파트너 회원은 MP수당 결제를 사용할 수 없습니다." }); return; }
    if (isMp && info && info.availableMp < amount) { setMsg({ ok: false, text: "MP 수당 잔액이 부족합니다." }); return; }
    setPaying(true); setMsg(null);

    // 1) 결제 준비(주문번호 발급). MP수당/이미납부는 여기서 즉시 완료됨.
    const pr = await apiPost<PrepareResp>("/api/payment/prepare", { feeType: option.key, method });
    if (!pr.ok || !pr.data) { setPaying(false); setMsg({ ok: false, text: pr.message || "결제 준비에 실패했습니다." }); return; }
    const d = pr.data;
    if (d.done) { setPaying(false); succeed(d.info); return; }

    // 2) clientKey 설정 시: 토스 결제창 호출(리다이렉트) / 키 미설정(mock): 즉시 승인
    //    (secretKey 미설정이면 결제창은 실제로 뜨되 서버 confirm 은 mock 확정)
    if (d.clientKey && d.orderId) {
      try {
        const TossPayments = await loadTossSdk();
        const tp = (TossPayments as (k: string) => unknown)(d.clientKey) as {
          payment: (o: { customerKey: string }) => { requestPayment: (o: Record<string, unknown>) => Promise<void> };
        };
        const anon = (TossPayments as unknown as { ANONYMOUS?: string }).ANONYMOUS ?? "ANONYMOUS";
        const payment = tp.payment({ customerKey: anon });
        const backUrl = `${window.location.origin}${window.location.pathname}`;
        const opts: Record<string, unknown> = {
          method: TOSS_METHOD[method] ?? "CARD",
          amount: { currency: "KRW", value: d.amount },
          orderId: d.orderId, orderName: d.orderName, customerName: d.customerName,
          successUrl: backUrl, failUrl: backUrl,
        };
        // 현금영수증 결제창 동시 발급 요청 (가상계좌·계좌이체). 필드 형태는 토스 SDK 수단별 규격을 따름.
        if (d.receiptRequested && (method === "VBANK" || method === "TRANSFER")) {
          const cashReceipt = { type: "소득공제" };
          if (method === "VBANK") opts.virtualAccount = { cashReceipt };
          else opts.transfer = { cashReceipt };
          if (d.customerMobilePhone) opts.customerMobilePhone = d.customerMobilePhone;
        }
        // 네이버페이·카카오페이 → 간편결제 provider 지정
        if (EASYPAY_PROVIDER[method]) opts.easyPay = { provider: EASYPAY_PROVIDER[method] };
        await payment.requestPayment(opts);
        // requestPayment 는 결제창으로 리다이렉트 → 이후 코드 실행 안 됨
      } catch (e) {
        setPaying(false);
        // 사용자가 결제창을 닫은 경우(USER_CANCEL)는 실패로 표시하지 않음
        const err = e as { code?: string; message?: string };
        if (err?.code === "USER_CANCEL") return;
        // 토스 실제 오류 메시지를 노출(키 종류 불일치 등 진단 가능하도록)
        setMsg({ ok: false, text: err?.message || "결제창 호출에 실패했습니다." });
      }
      return;
    }

    // mock 모드(토스 키 미설정) → 서버가 승인 없이 확정
    const cf = await apiPost<PayInfo & { message?: string }>("/api/payment/confirm", { orderId: d.orderId, paymentKey: "MOCK", amount: d.amount });
    setPaying(false);
    if (cf.ok && cf.data) succeed(cf.data);
    else setMsg({ ok: false, text: cf.message || "결제에 실패했습니다." });
  }

  if (!info) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">불러오는 중…</div>;

  const isEntry = info.feeKind === "ENTRY";
  const title = isEntry ? "입점비 결제" : "회비 결제";
  const paidAlready = isEntry && info.entryFeePaid;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="mx-auto max-w-2xl space-y-5">
      {/* 현재 상태 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        {isEntry ? (
          <p className="mt-1 text-sm text-slate-500">
            입점비 납부 상태:{" "}
            {info.entryFeePaid
              ? <b className="text-emerald-600">납부 완료{info.entryFeePaidDate ? ` (${info.entryFeePaidDate})` : ""}</b>
              : <b className="text-red-500">미납 — 입점비 결제 후 ADMIN 메뉴를 이용할 수 있습니다.</b>}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            회원 만기일자:{" "}
            <b className={info.expired ? "text-red-500" : "text-slate-800"}>{info.membershipExpiry || "미설정"}</b>
            {info.expired && <span className="ml-1 text-red-500">— 만료됨(회비 납부 후 전체 메뉴 이용 가능)</span>}
          </p>
        )}
      </div>

      {/* 결제 항목 */}
      {!paidAlready && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* 회비 종류 (회비만) */}
          {!isEntry && (
            <div>
              <p className="text-xs font-bold text-slate-500">회비 종류</p>
              <div className="mt-2 flex gap-2">
                {info.feeOptions.map((o) => (
                  <button key={o.key} type="button" onClick={() => setFeeType(o.key)}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-left transition-colors ${feeType === o.key ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <span className="block text-sm font-bold text-slate-900">{o.label}</span>
                    <span className="block text-sm font-black text-sky-700">{won(o.baseFee)}원</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {isEntry && option && (
            <div className="rounded-xl bg-slate-50 p-4">
              <span className="text-sm font-bold text-slate-900">입점비</span>
              <span className="ml-2 text-sm font-black text-sky-700">{won(option.baseFee)}원</span>
            </div>
          )}

          {/* 결제 수단 */}
          <div className="mt-5">
            <p className="text-xs font-bold text-slate-500">결제 수단</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {info.methods.map((m) => {
                const disabled = m === "MP" && mpDisabledForPartner;
                return (
                  <button key={m} type="button" disabled={disabled} onClick={() => setMethod(m)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors ${method === m ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
                    {METHOD_LABEL[m] ?? m}
                    {m === "MP" && !mpDisabledForPartner && <span className="block text-[11px] font-semibold text-slate-400">잔액 {won(info.availableMp)}원</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 결제 금액 */}
          <div className="mt-5 rounded-xl bg-slate-900 p-5 text-white">
            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold text-slate-300">{isMp ? "결제 금액 (부가세 제외)" : "결제 금액"}</span>
              <span className="text-3xl font-black">{won(amount)}<span className="ml-1 text-lg">원</span></span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {isMp
                ? `MP수당 결제는 부가세(${info.vatPercent}%) 제외 금액으로 결제됩니다. (공급가 ${won(amount)}원 = ${won(option?.baseFee ?? 0)}원 − 부가세 ${won(vat)}원)`
                : `부가세(${info.vatPercent}%) 포함 금액입니다.`}
            </p>
          </div>

          {msg && <p className={`mt-4 rounded-lg px-4 py-2.5 text-sm font-bold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}

          <button onClick={pay} disabled={paying || amount <= 0}
            className="mt-4 w-full rounded-xl bg-sky-600 px-6 py-3.5 text-center text-sm font-black text-white hover:bg-sky-500 disabled:opacity-50">
            {paying ? "결제 처리 중…" : `${won(amount)}원 결제하기`}
          </button>
          {amount <= 0 && <p className="mt-2 text-center text-xs text-slate-400">* 본사 [관리비설정]에서 금액이 설정되지 않았습니다.</p>}
        </div>
      )}

      {paidAlready && msg && <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">{msg.text}</p>}
      </div>

      {/* 결제 내역 조회 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">결제 내역</h2>
        {receiptMsg && <p className={`mt-2 rounded-lg px-4 py-2 text-sm font-bold ${receiptMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{receiptMsg.text}</p>}
        <div className="mt-3 -mx-1 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                <th className="px-3 py-2.5">결제일시</th>
                <th className="px-3 py-2.5">{isEntry ? "항목" : "회비"}</th>
                <th className="px-3 py-2.5">결제수단</th>
                <th className="px-3 py-2.5 text-right">결제금액</th>
                <th className="px-3 py-2.5 text-center">상태</th>
                {!isEntry && <th className="px-3 py-2.5 text-center">적용 만기일</th>}
                <th className="px-3 py-2.5 text-center">현금영수증</th>
              </tr>
            </thead>
            <tbody>
              {history === null ? (
                <tr><td colSpan={isEntry ? 6 : 7} className="px-3 py-8 text-center text-sm text-slate-400">불러오는 중…</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={isEntry ? 6 : 7} className="px-3 py-8 text-center text-sm text-slate-400">결제 내역이 없습니다.</td></tr>
              ) : history.map((h) => {
                const st = STATUS_LABEL[h.status ?? ""] ?? { text: h.status ?? "-", cls: "bg-slate-100 text-slate-500" };
                return (
                  <tr key={h.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 text-slate-600">{h.paidAt ? h.paidAt.replace("T", " ").slice(0, 16) : "-"}</td>
                    <td className="px-3 py-3 font-semibold text-slate-800">{FEE_LABEL[h.feeType ?? ""] ?? h.feeType ?? "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{METHOD_LABEL[h.method ?? ""] ?? h.method ?? "-"}</td>
                    <td className="px-3 py-3 text-right font-black text-slate-900">{won(h.amount ?? 0)}원</td>
                    <td className="px-3 py-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${st.cls}`}>{st.text}</span></td>
                    {!isEntry && <td className="px-3 py-3 text-center text-slate-600">{h.expiryAfter ?? "-"}</td>}
                    <td className="px-3 py-3 text-center">
                      {!h.receiptEligible ? (
                        <span className="text-xs text-slate-300">-</span>
                      ) : h.receiptStatus === "ISSUED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">✓ 발급완료</span>
                      ) : (
                        <button type="button" disabled={receiptBusy === h.id} onClick={() => issueReceipt(h.id)}
                          className="rounded-lg border border-sky-300 px-3 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-50 disabled:opacity-50">
                          {receiptBusy === h.id ? "처리 중…" : "현금영수증 발급"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">* 가상계좌·계좌이체는 결제창에서 현금영수증이 함께 발급됩니다(가상계좌는 입금 완료 시점). 미발급 건은 [현금영수증 발급] 버튼으로 재요청할 수 있습니다.</p>
      </div>
    </div>
  );
}
