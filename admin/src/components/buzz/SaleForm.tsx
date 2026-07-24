"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { openDaumPostcode } from "@/lib/postcode";
import { useBuzz } from "@/components/buzz/theme";
import { canApplySale } from "@/lib/dday";

type Cat = { id: number; name: string; level: string; parentId: number | null };
type Prod = { id: number; name: string; categoryId: number | null; partnerName?: string; contractEndDate?: string | null };

const STAGES = ["접수", "상담/방문", "계약체결", "배송/설치", "구매확정", "취소/반품"];

// ★ 모듈 스코프 (렌더마다 재생성 X → 입력 포커스 유지)
function F({ label, labelCls, children }: { label: string; labelCls: string; children: React.ReactNode }) {
  return <label className="block"><span className={`text-xs font-semibold ${labelCls}`}>{label}</span><div className="mt-1">{children}</div></label>;
}

/** 1차 영업 등록 — 카테고리·상품 선택 + 고객(B2B) 기본정보 + 영업진행상태·메모 */
export default function SaleForm() {
  const router = useRouter();
  const sp = useSearchParams();
  // 마켓 [1차영업신청]에서 넘어온 자동선택 값
  const initCat = sp.get("categoryId") ?? "";
  const initProd = sp.get("productId") ?? "";
  const { theme } = useBuzz();
  const [cats, setCats] = useState<Cat[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [catId, setCatId] = useState(initCat);
  const [f, setF] = useState({
    productId: initProd, companyName: "", businessNumber: "", ceoName: "", companyPhone: "",
    managerName: "", phone: "", email: "", zipcode: "", address: "", addressDetail: "",
    status: "접수", memo: "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const prevCat = useRef<string | null>(null); // 카테고리가 "실제로 바뀔 때만" 상품 초기화 (StrictMode 이중실행 안전)

  useEffect(() => { apiGet<Cat[]>("/api/buzz/categories").then((r) => { if (r.data) setCats(r.data); }); }, []);

  // 카테고리 변경 시 상품 목록 로드 (7일 이상 남은 상품만 선택 가능)
  useEffect(() => {
    const p = new URLSearchParams({ size: "200" });
    if (catId) p.set("categoryId", catId);
    apiGet<{ content: Prod[] }>(`/api/buzz/products?${p}`).then((r) => {
      if (r.data?.content) setProds(r.data.content.filter((x) => canApplySale(x.contractEndDate)));
    });
    // 마운트(자동선택) 시엔 유지, 사용자가 카테고리를 바꾼 경우에만 상품 초기화
    if (prevCat.current !== null && prevCat.current !== catId) setF((prev) => ({ ...prev, productId: "" }));
    prevCat.current = catId;
  }, [catId]);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-slate-400 ${theme.input}`;
  const lc = theme.fieldLabel;

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!f.productId) { setNotice("상품을 선택해 주세요."); return; }
    if (!f.companyName.trim()) { setNotice("고객 상호명을 입력해 주세요."); return; }
    setSaving(true);
    const payload = { ...f, productId: Number(f.productId), categoryId: catId ? Number(catId) : null };
    const res = await apiPost("/api/buzz/sales", payload);
    setSaving(false);
    if (res.ok) router.push("/buzz/pipeline");
    else setNotice(res.message ?? "저장에 실패했습니다.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className={theme.card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>상품 선택</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="카테고리" labelCls={lc}>
            <select className={inputCls} value={catId} onChange={(e) => setCatId(e.target.value)}>
              <option value="">전체</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{"·".repeat(["LARGE", "MEDIUM", "SMALL"].indexOf(c.level))}{c.name}</option>)}
            </select>
          </F>
          <F label="상품 *" labelCls={lc}>
            <select className={inputCls} value={f.productId} onChange={(e) => set("productId")(e.target.value)}>
              <option value="">상품 선택</option>
              {prods.map((p) => <option key={p.id} value={p.id}>{p.name}{p.partnerName ? ` (${p.partnerName})` : ""}</option>)}
            </select>
          </F>
        </div>
      </section>

      <section className={theme.card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>고객 기본정보</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <F label="상호명 *" labelCls={lc}><input className={inputCls} value={f.companyName} onChange={(e) => set("companyName")(e.target.value)} placeholder="상호명" /></F>
          <F label="사업자등록번호" labelCls={lc}><input className={inputCls} value={f.businessNumber} onChange={(e) => set("businessNumber")(e.target.value)} placeholder="000-00-00000" /></F>
          <F label="대표자명" labelCls={lc}><input className={inputCls} value={f.ceoName} onChange={(e) => set("ceoName")(e.target.value)} placeholder="대표자명" /></F>
          <F label="회사 전화번호" labelCls={lc}><input className={inputCls} value={f.companyPhone} onChange={(e) => set("companyPhone")(e.target.value)} placeholder="02-000-0000" /></F>
          <F label="담당자명" labelCls={lc}><input className={inputCls} value={f.managerName} onChange={(e) => set("managerName")(e.target.value)} placeholder="담당자명" /></F>
          <F label="핸드폰번호" labelCls={lc}><input className={inputCls} value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="010-0000-0000" /></F>
          <F label="이메일" labelCls={lc}><input className={inputCls} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="mail@example.com" /></F>
        </div>
        <div className="mt-4">
          <span className={`text-xs font-semibold ${theme.fieldLabel}`}>회사 주소</span>
          <div className="mt-1 flex gap-2">
            <input className={`${inputCls} w-32`} value={f.zipcode} readOnly placeholder="우편번호" />
            <button type="button" onClick={() => openDaumPostcode((r) => setF((p) => ({ ...p, zipcode: r.zipcode, address: r.address })))}
              className={`shrink-0 rounded-lg px-3 text-xs font-bold ${theme.outlineBtn}`}>우편번호 검색</button>
          </div>
          <input className={`${inputCls} mt-2`} value={f.address} readOnly placeholder="기본주소" />
          <input className={`${inputCls} mt-2`} value={f.addressDetail} onChange={(e) => set("addressDetail")(e.target.value)} placeholder="회사 상세주소" />
        </div>
      </section>

      <section className={theme.card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>영업 진행</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="영업진행상태" labelCls={lc}>
            <select className={inputCls} value={f.status} onChange={(e) => set("status")(e.target.value)}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
        </div>
        <div className="mt-4">
          <F label="메모" labelCls={lc}><textarea rows={4} className={inputCls} value={f.memo} onChange={(e) => set("memo")(e.target.value)} placeholder="영업 관련 메모" /></F>
        </div>
      </section>

      {notice && <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-500 ring-1 ring-red-500/30">{notice}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/buzz/pipeline")} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${theme.cancelBtn}`}>취소</button>
        <button type="submit" disabled={saving} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${theme.primaryBtn}`}>{saving ? "저장 중…" : "영업 등록"}</button>
      </div>
    </form>
  );
}
