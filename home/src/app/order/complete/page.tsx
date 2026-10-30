"use client";

import { useEffect, useState } from "react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { apiGet } from "@/lib/api";

type Delivery = { receiverName?: string; receiverMobile?: string; zipcode?: string; address?: string; addressDetail?: string; quantity: number };
type Order = {
  orderNo: string; createdAtFull?: string; productName: string; salePrice: number; quantity: number; totalAmount: number;
  payMethod: string; status: string; ordererName?: string; ordererMobile?: string;
  deliveries: Delivery[];
  bank?: { bankName?: string | null; accountNumber?: string | null; accountHolder?: string | null };
};

const won = (n: number) => (n ?? 0).toLocaleString("ko-KR") + " 원";

function Line({ k, v, strong }: { k: string; v?: string | number | null; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-muted">{k}</span>
      <span className={strong ? "font-black text-forest-800" : "font-semibold text-ink"}>{v === 0 || v ? v : "-"}</span>
    </div>
  );
}

/** 주문완료 (docs/33) — /order/complete?refId=&ordNo=. 무통장 주문은 파트너사 입금계좌 안내 */
export default function OrderCompletePage() {
  const [o, setO] = useState<Order | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const refId = q.get("refId"), ordNo = q.get("ordNo");
    if (!refId || !ordNo) { setStatus("error"); return; }
    apiGet<Order>(`/api/public/orders/complete?${new URLSearchParams({ refId, ordNo })}`).then((r) => {
      if (r.ok && r.data) { setO(r.data); setStatus("ok"); } else setStatus("error");
    });
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:py-10">
          {status === "loading" && <p className="mt-10 text-center text-sm text-muted">불러오는 중…</p>}
          {status === "error" && <p className="mt-10 text-center text-sm text-danger">주문 내역을 찾을 수 없습니다.</p>}

          {status === "ok" && o && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-forest-800 p-6 text-center text-white">
                <p className="text-3xl">✓</p>
                <h1 className="mt-2 text-2xl font-black">주문이 완료되었습니다</h1>
                <p className="mt-1 text-sm text-white/80">주문번호 {o.orderNo}{o.createdAtFull ? ` · ${o.createdAtFull}` : ""}</p>
              </div>

              {o.payMethod === "BANK" && (
                <section className="rounded-2xl border-2 border-gold-400 bg-gold-50 p-5">
                  <h2 className="text-lg font-black text-ink">무통장 입금 안내</h2>
                  <p className="mt-1 text-xs text-ink-soft">아래 계좌로 결제금액을 입금해 주시면 확인 후 배송이 진행됩니다.</p>
                  <div className="mt-3 rounded-xl bg-white px-4 py-1">
                    <Line k="은행명" v={o.bank?.bankName} />
                    <Line k="계좌번호" v={o.bank?.accountNumber} />
                    <Line k="예금주" v={o.bank?.accountHolder} />
                    <Line k="입금하실 금액" v={won(o.totalAmount)} strong />
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-black text-ink">주문 내역</h2>
                <div className="mt-2">
                  <Line k="상품명" v={o.productName} />
                  <Line k="판매가" v={won(o.salePrice)} />
                  <Line k="수량" v={o.quantity} />
                  <Line k="결제방식" v={o.payMethod === "BANK" ? "무통장" : "신용카드"} />
                  <Line k="주문상태" v={o.status} />
                  <Line k="결제금액" v={won(o.totalAmount)} strong />
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-black text-ink">배송지</h2>
                <ul className="mt-2 divide-y divide-line">
                  {o.deliveries.map((d, i) => (
                    <li key={i} className="py-3 text-sm">
                      <p className="font-bold text-ink">{d.receiverName} <span className="font-normal text-muted">{d.receiverMobile}</span> <span className="ml-1 rounded bg-forest-100 px-1.5 py-0.5 text-xs font-bold text-forest-700">{d.quantity}개</span></p>
                      <p className="mt-0.5 text-ink-soft">{[d.zipcode && `(${d.zipcode})`, d.address, d.addressDetail].filter(Boolean).join(" ")}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
