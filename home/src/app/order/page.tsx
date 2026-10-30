"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { apiGet, apiPost, mediaUrl } from "@/lib/api";
import { openPostcode } from "@/lib/postcode";

type FormInfo = {
  orderNo: string; productId: number; productName: string; salePrice: number; image1?: string | null;
  ordererName?: string | null; ordererTel?: string | null; ordererMobile?: string | null; ordererEmail?: string | null;
  ordererZipcode?: string | null; ordererAddress?: string | null; ordererAddressDetail?: string | null;
  existingOrderId?: number | null;
};

type Orderer = { name: string; tel: string; mobile: string; email: string; zipcode: string; address: string; addressDetail: string };
type Delivery = { receiverName: string; receiverMobile: string; zipcode: string; address: string; addressDetail: string; quantity: number };

const won = (n: number) => n.toLocaleString("ko-KR") + " 원";
const emptyDelivery = (quantity: number): Delivery => ({ receiverName: "", receiverMobile: "", zipcode: "", address: "", addressDetail: "", quantity });

const inputCls = "w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-forest-500";
const btnCls = "shrink-0 rounded-lg border border-forest-600/40 px-3 py-2.5 text-sm font-bold text-forest-700 hover:bg-forest-50";

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[8rem_1fr] sm:items-center sm:gap-3">
      <span className="text-sm font-bold text-ink">{label}{required && <span className="text-danger"> *</span>}</span>
      <div>{children}</div>
    </div>
  );
}

/** 주소 3칸 (우편번호검색 / 기본주소 / 상세주소) */
function AddressFields({ zipcode, address, addressDetail, onPick, onDetail }: {
  zipcode: string; address: string; addressDetail: string;
  onPick: (zip: string, addr: string) => void; onDetail: (v: string) => void;
}) {
  return (
    <>
      <Row label="우편번호" required>
        <div className="flex gap-2">
          <input className={`${inputCls} max-w-[10rem] bg-surface-2`} value={zipcode} readOnly placeholder="우편번호" />
          <button type="button" className={btnCls}
            onClick={async () => { if (!(await openPostcode(onPick))) alert("우편번호 서비스를 불러오지 못했습니다."); }}>우편번호검색</button>
        </div>
      </Row>
      <Row label="기본주소" required><input className={`${inputCls} bg-surface-2`} value={address} readOnly placeholder="우편번호검색으로 입력" /></Row>
      <Row label="상세주소"><input className={inputCls} value={addressDetail} onChange={(e) => onDetail(e.target.value)} placeholder="상세주소" /></Row>
    </>
  );
}

/** 단순배송상품 주문서 입력 (docs/33) — /order?refId=&ordNo=&productId= */
export default function OrderPage() {
  const router = useRouter();
  const [params, setParams] = useState<{ refId: string; ordNo: string; productId: string } | null>(null);
  const [info, setInfo] = useState<FormInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [qty, setQty] = useState(1);
  const [orderer, setOrderer] = useState<Orderer>({ name: "", tel: "", mobile: "", email: "", zipcode: "", address: "", addressDetail: "" });
  const [deliveries, setDeliveries] = useState<Delivery[]>([emptyDelivery(1)]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = { refId: q.get("refId") ?? "", ordNo: q.get("ordNo") ?? "", productId: q.get("productId") ?? "" };
    setParams(p);
    if (!p.refId || !p.ordNo) { setStatus("error"); return; }
    apiGet<FormInfo>(`/api/public/orders/form?${new URLSearchParams({ refId: p.refId, ordNo: p.ordNo })}`).then((r) => {
      if (!r.ok || !r.data || (p.productId && String(r.data.productId) !== p.productId)) { setStatus("error"); return; }
      const d = r.data;
      setInfo(d);
      setOrderer({
        name: d.ordererName ?? "", tel: d.ordererTel ?? "", mobile: d.ordererMobile ?? "", email: d.ordererEmail ?? "",
        zipcode: d.ordererZipcode ?? "", address: d.ordererAddress ?? "", addressDetail: d.ordererAddressDetail ?? "",
      });
      setStatus("ok");
    });
  }, []);

  const completeHref = params ? `/order/complete?${new URLSearchParams({ refId: params.refId, ordNo: params.ordNo })}` : "#";
  const setO = (k: keyof Orderer) => (v: string) => setOrderer((o) => ({ ...o, [k]: v }));
  const setD = (i: number, patch: Partial<Delivery>) => setDeliveries((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const assigned = deliveries.reduce((s, d) => s + d.quantity, 0);
  const remain = qty - assigned;

  /** 구매수량 변경 — 배송지 수는 수량을 넘지 않고, 배송지별 수량 합계가 구매수량을 넘지 않도록 뒤에서부터 차감 */
  function changeQty(next: number) {
    const n = Math.max(1, Math.min(999, next));
    setQty(n);
    setDeliveries((ds) => {
      let list = ds.slice(0, n).map((d) => ({ ...d }));
      if (list.length === 1) { list[0].quantity = n; return list; }  // 배송지 1곳이면 전량
      let over = list.reduce((s, d) => s + d.quantity, 0) - n;
      for (let i = list.length - 1; i >= 0 && over > 0; i--) {
        const cut = Math.min(over, list[i].quantity - 1);
        list[i].quantity -= cut; over -= cut;
      }
      list = list.filter((d) => d.quantity > 0);
      return list;
    });
  }

  function addDelivery() {
    if (deliveries.length >= qty) return;
    // 남은 수량이 없으면 첫 배송지에서 1개 떼어 새 배송지로
    if (remain > 0) { setDeliveries((ds) => [...ds, emptyDelivery(remain)]); return; }
    const src = deliveries.findIndex((d) => d.quantity > 1);
    if (src < 0) return;
    setDeliveries((ds) => [...ds.map((d, j) => (j === src ? { ...d, quantity: d.quantity - 1 } : d)), emptyDelivery(1)]);
  }

  function removeDelivery(i: number) {
    setDeliveries((ds) => {
      const left = ds.filter((_, j) => j !== i);
      left[0] = { ...left[0], quantity: left[0].quantity + ds[i].quantity }; // 삭제 수량은 첫 배송지로
      return left;
    });
  }

  async function submit() {
    if (!info || !params) return;
    if (!orderer.name.trim() || !orderer.mobile.trim() || !orderer.address.trim()) { alert("주문자 정보(주문자명·핸드폰번호·주소)를 입력해 주세요."); return; }
    if (deliveries.some((d) => !d.receiverName.trim() || !d.receiverMobile.trim() || !d.address.trim())) { alert("수령인 정보(수령인명·핸드폰번호·주소)를 모두 입력해 주세요."); return; }
    if (remain !== 0) { alert(`배송지별 수량의 합계(${assigned})가 구매수량(${qty})과 같아야 합니다.`); return; }
    if (!confirm(`총 ${won(info.salePrice * qty)}을 무통장으로 주문하시겠습니까?`)) return;
    setSubmitting(true);
    const r = await apiPost<{ id: number }>("/api/public/orders", {
      refId: Number(params.refId), ordNo: params.ordNo, productId: info.productId, quantity: qty, payMethod: "BANK",
      ordererName: orderer.name, ordererTel: orderer.tel, ordererMobile: orderer.mobile, ordererEmail: orderer.email,
      ordererZipcode: orderer.zipcode, ordererAddress: orderer.address, ordererAddressDetail: orderer.addressDetail,
      deliveries,
    });
    setSubmitting(false);
    if (r.ok) router.push(completeHref);
    else alert(r.message ?? "주문에 실패했습니다.");
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:py-10">
          {params?.productId && (
            <Link href={`/products/${params.productId}?${new URLSearchParams({ refId: params.refId, ordNo: params.ordNo })}`}
              className="text-sm font-semibold text-ink-soft hover:text-forest-700">← 상품 상세</Link>
          )}
          <h1 className="mt-3 text-2xl font-black text-ink">주문서 작성</h1>

          {status === "loading" && <p className="mt-10 text-center text-sm text-muted">불러오는 중…</p>}
          {status === "error" && <p className="mt-10 text-center text-sm text-danger">주문 가능한 상품 정보를 찾을 수 없습니다.</p>}

          {status === "ok" && info && info.existingOrderId != null && (
            <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-center">
              <p className="text-sm font-bold text-ink">이미 주문이 접수된 건입니다.</p>
              <Link href={completeHref} className="mt-4 inline-block rounded-xl bg-forest-800 px-6 py-3 text-sm font-bold text-white hover:bg-forest-700">주문내역 보기</Link>
            </div>
          )}

          {status === "ok" && info && info.existingOrderId == null && (
            <div className="mt-6 space-y-5">
              {/* 상품 · 수량 */}
              <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center">
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-line bg-forest-50 sm:w-32">
                  {info.image1 ? <img src={mediaUrl(info.image1)} alt={info.productName} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex-1 space-y-1.5 text-sm">
                  <p><span className="text-muted">상품명 : </span><b className="text-ink">{info.productName}</b></p>
                  <p><span className="text-muted">판매가 : </span><b className="text-ink">{won(info.salePrice)}</b></p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-muted">수량 : </span>
                    <div className="flex items-center overflow-hidden rounded-lg border border-line">
                      <button type="button" onClick={() => changeQty(qty - 1)} disabled={qty <= 1} className="grid h-9 w-9 place-items-center text-lg font-bold text-ink-soft hover:bg-surface disabled:opacity-30" aria-label="수량 감소">−</button>
                      <span className="w-12 text-center font-black text-ink">{qty}</span>
                      <button type="button" onClick={() => changeQty(qty + 1)} className="grid h-9 w-9 place-items-center text-lg font-bold text-ink-soft hover:bg-surface" aria-label="수량 증가">+</button>
                    </div>
                  </div>
                  <p className="pt-1"><span className="text-muted">결제금액 : </span><b className="text-lg text-forest-800">{won(info.salePrice * qty)}</b></p>
                </div>
              </section>

              {/* 주문자정보 */}
              <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-black text-ink">주문자정보</h2>
                <Row label="주문자명" required><input className={inputCls} value={orderer.name} onChange={(e) => setO("name")(e.target.value)} /></Row>
                <Row label="연락처"><input className={inputCls} value={orderer.tel} onChange={(e) => setO("tel")(e.target.value)} placeholder="02-000-0000" /></Row>
                <Row label="핸드폰번호" required><input className={inputCls} value={orderer.mobile} onChange={(e) => setO("mobile")(e.target.value)} placeholder="010-0000-0000" /></Row>
                <Row label="이메일주소"><input type="email" className={inputCls} value={orderer.email} onChange={(e) => setO("email")(e.target.value)} /></Row>
                <AddressFields zipcode={orderer.zipcode} address={orderer.address} addressDetail={orderer.addressDetail}
                  onPick={(zip, addr) => setOrderer((o) => ({ ...o, zipcode: zip, address: addr }))} onDetail={setO("addressDetail")} />
              </section>

              {/* 수령인정보 — 배송지는 구매수량만큼 추가 가능, 배송지별 수량 지정 */}
              <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-black text-ink">수령인정보</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${remain === 0 ? "text-forest-700" : "text-danger"}`}>배송 수량 {assigned} / {qty}</span>
                    <button type="button" onClick={addDelivery} disabled={deliveries.length >= qty}
                      className="rounded-lg bg-forest-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-forest-700 disabled:opacity-30">+ 배송지 추가</button>
                  </div>
                </div>
                {deliveries.map((d, i) => {
                  const maxQ = qty - (assigned - d.quantity); // 다른 배송지 수량 제외한 최대치
                  return (
                    <div key={i} className="space-y-3 rounded-xl border border-line p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-forest-800">배송지 {i + 1}</span>
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <button type="button" onClick={() => setD(0, { receiverName: orderer.name, receiverMobile: orderer.mobile, zipcode: orderer.zipcode, address: orderer.address, addressDetail: orderer.addressDetail })}
                              className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-ink-soft ring-1 ring-line hover:text-forest-700">주문자와 동일</button>
                          )}
                          {deliveries.length > 1 && (
                            <button type="button" onClick={() => removeDelivery(i)} className="rounded-md px-2 py-1 text-xs font-semibold text-danger hover:bg-surface">삭제</button>
                          )}
                        </div>
                      </div>
                      <Row label="수령인명" required><input className={inputCls} value={d.receiverName} onChange={(e) => setD(i, { receiverName: e.target.value })} /></Row>
                      <Row label="핸드폰번호" required><input className={inputCls} value={d.receiverMobile} onChange={(e) => setD(i, { receiverMobile: e.target.value })} placeholder="010-0000-0000" /></Row>
                      <AddressFields zipcode={d.zipcode} address={d.address} addressDetail={d.addressDetail}
                        onPick={(zip, addr) => setD(i, { zipcode: zip, address: addr })} onDetail={(v) => setD(i, { addressDetail: v })} />
                      <Row label="수량" required>
                        <select className={`${inputCls} max-w-[8rem]`} value={d.quantity} onChange={(e) => setD(i, { quantity: Number(e.target.value) })}>
                          {Array.from({ length: Math.max(1, maxQ) }, (_, k) => k + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </Row>
                    </div>
                  );
                })}
              </section>

              {/* 결제방식 — 신용카드 비활성 */}
              <section className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center gap-6">
                  <h2 className="text-lg font-black text-ink">결제방식</h2>
                  <label className="flex cursor-not-allowed items-center gap-1.5 text-sm font-semibold text-muted opacity-50">
                    <input type="radio" name="pay" disabled className="h-4 w-4" /> 신용카드
                  </label>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-forest-800">
                    <input type="radio" name="pay" checked readOnly className="h-4 w-4 accent-forest-700" /> 무통장
                  </label>
                </div>
              </section>

              <button type="button" onClick={submit} disabled={submitting}
                className="w-full rounded-xl bg-forest-800 px-5 py-4 text-base font-black text-white hover:bg-forest-700 disabled:opacity-50">
                {submitting ? "처리 중…" : "결제하기"}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
