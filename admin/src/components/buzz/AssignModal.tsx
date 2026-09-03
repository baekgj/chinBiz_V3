"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPost, apiUpload, mediaUrl } from "@/lib/api";
import { useBuzz } from "@/components/buzz/theme";

type Detail = Record<string, unknown> & {
  id: number; productName?: string; customerName?: string; companyName?: string; ceoName?: string;
  phone?: string; address?: string; addressDetail?: string; status?: string; memo?: string; mine?: boolean;
  categoryId?: number | null; productId?: number | null; installPhotos?: string | null;
};
type Cat = { id: number; name: string; level: string };
type Prod = { id: number; name: string; partnerName?: string };
const STAGES = ["접수", "상담/방문", "계약체결", "배송/설치", "구매확정", "취소/반품"];

/** 매니저 영업관리(우선할당/영업권확보) — 진행현황·영업내용 기록 후 sales.manager_id 저장 */
export default function AssignModal({ saleId, onClose, onSaved }: { saleId: number; onClose: () => void; onSaved: () => void }) {
  const { theme } = useBuzz();
  const [d, setD] = useState<Detail | null>(null);
  const [status, setStatus] = useState("상담/방문");
  const [memo, setMemo] = useState("");
  const [cats, setCats] = useState<Cat[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [catId, setCatId] = useState("");
  const [prodId, setProdId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const prevCat = useRef<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]); // 현장설치 사진 URL 목록
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    apiGet<Cat[]>("/api/buzz/categories").then((r) => { if (r.data) setCats(r.data); });
    apiGet<Detail>(`/api/buzz/sales/${saleId}`).then((r) => {
      if (r.ok && r.data) {
        setD(r.data); if (r.data.status) setStatus(r.data.status); setMemo(r.data.memo ?? "");
        if (r.data.categoryId != null) setCatId(String(r.data.categoryId));
        if (r.data.productId != null) setProdId(String(r.data.productId));
        if (r.data.installPhotos) setPhotos(String(r.data.installPhotos).split(",").filter(Boolean));
      } else setErr(r.message ?? "영업 건을 불러오지 못했습니다.");
    });
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [saleId]);

  // 카테고리 변경 → 상품 목록 로드 (초기 자동선택은 유지, 사용자가 바꾼 경우에만 상품 초기화)
  useEffect(() => {
    const p = new URLSearchParams({ size: "200" });
    if (catId) p.set("categoryId", catId);
    apiGet<{ content: Prod[] }>(`/api/buzz/products?${p}`).then((r) => { if (r.data?.content) setProds(r.data.content); });
    if (prevCat.current !== null && prevCat.current !== catId) setProdId("");
    prevCat.current = catId;
  }, [catId]);

  async function handlePhotos(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).filter((x) => x.type.startsWith("image/"));
    if (files.length === 0) return;
    setErr(null); setUploading(true);
    for (const file of files.slice(0, 10 - photos.length)) {
      const res = await apiUpload<{ url: string }>("/api/uploads", file);
      if (res.ok && res.data?.url) setPhotos((p) => (p.length >= 10 ? p : [...p, res.data!.url]));
      else setErr(res.message ?? "사진 업로드에 실패했습니다.");
    }
    setUploading(false);
  }

  async function save() {
    if (!prodId) { setErr("상품을 선택해 주세요."); return; }
    setSaving(true); setErr(null);
    const res = await apiPost(`/api/buzz/sales/${saleId}/assign`, {
      status, memo, categoryId: catId ? Number(catId) : null, productId: Number(prodId),
      installPhotos: photos.join(","),
    });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else setErr(res.message ?? "저장에 실패했습니다.");
  }

  if (!mounted) return null;
  const dark = theme.card.includes("neutral");
  const panel = dark ? "bg-neutral-900 text-neutral-100" : "bg-white text-slate-900";
  const inp = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${theme.input}`;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className={`flex h-[80vh] w-[80vw] flex-col overflow-hidden rounded-2xl shadow-xl sm:h-[70vh] sm:w-[70vw] ${panel}`} onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${theme.tableWrap}`}>
          <div>
            <h3 className="text-lg font-black">{d?.mine ? "영업권 확보 · 관리" : "우선 할당"}</h3>
            <p className={`text-xs ${theme.cardSub}`}>{d?.productName} · {d?.companyName ?? d?.customerName}</p>
          </div>
          <button onClick={onClose} className={`grid h-8 w-8 place-items-center rounded-lg ${theme.cellSub} hover:opacity-70`}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
        {err && <div className="mx-5 mt-4 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-500">{err}</div>}

        {!d ? <div className={`px-5 py-10 text-center text-sm ${theme.cardSub}`}>불러오는 중…</div> : (
          <div className="space-y-4 px-5 py-5">
            <div className={`rounded-xl border p-4 ${theme.tableWrap}`}>
              <p className={`text-xs ${theme.cardSub}`}>고객</p>
              <p className={`font-bold ${theme.cellMain}`}>{d.companyName ?? d.customerName}{d.ceoName ? ` · ${d.ceoName}` : ""}</p>
              <p className={`mt-0.5 text-xs ${theme.cellSub}`}>{[d.phone, d.address, d.addressDetail].filter(Boolean).join(" · ")}</p>
            </div>
            {/* 카테고리·상품 선택 (docs/24) — 저장 시 sale 에 반영 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={`text-xs font-semibold ${theme.fieldLabel}`}>카테고리</span>
                <select className={`mt-1 ${inp}`} value={catId} onChange={(e) => setCatId(e.target.value)}>
                  <option value="">전체</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{"·".repeat(["LARGE", "MEDIUM", "SMALL"].indexOf(c.level))}{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={`text-xs font-semibold ${theme.fieldLabel}`}>상품 *</span>
                <select className={`mt-1 ${inp}`} value={prodId} onChange={(e) => setProdId(e.target.value)}>
                  <option value="">상품 선택</option>
                  {prods.map((p) => <option key={p.id} value={p.id}>{p.name}{p.partnerName ? ` (${p.partnerName})` : ""}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className={`text-xs font-semibold ${theme.fieldLabel}`}>영업 진행현황</span>
              <select className={`mt-1 ${inp}`} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={`text-xs font-semibold ${theme.fieldLabel}`}>영업 내용</span>
              <textarea rows={4} className={`mt-1 ${inp}`} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="상담·방문·진행 내용을 기록하세요" />
            </label>

            {/* 현장설치 사진 업로드 (docs/25_2) */}
            <div className="block">
              <span className={`text-xs font-semibold ${theme.fieldLabel}`}>현장설치 사진 <span className="font-normal opacity-70">({photos.length}/10)</span></span>
              <div className="mt-1 flex flex-wrap gap-2">
                {photos.map((url, i) => (
                  <div key={i} className={`relative h-20 w-20 overflow-hidden rounded-lg border ${theme.tableWrap}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(url)} alt={`설치사진 ${i + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-md bg-black/60 text-xs text-white hover:bg-red-600">✕</button>
                  </div>
                ))}
                {photos.length < 10 && (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className={`grid h-20 w-20 place-items-center rounded-lg border-2 border-dashed ${theme.tableWrap} ${theme.cellSub} text-2xl disabled:opacity-40`}>
                    {uploading ? "…" : "📷"}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden
                  onChange={(e) => { handlePhotos(e.target.files); e.currentTarget.value = ""; }} />
              </div>
              <p className={`mt-1 text-[11px] ${theme.note}`}>모바일에서는 카메라로 촬영, PC에서는 파일 선택으로 업로드됩니다. (최대 10장)</p>
            </div>
          </div>
        )}
        </div>

        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${theme.tableWrap} ${panel}`}>
          <button onClick={onClose} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${theme.cancelBtn}`}>취소</button>
          <button onClick={save} disabled={saving || !d} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${theme.primaryBtn}`}>
            {saving ? "저장 중…" : d?.mine ? "저장" : "영업권 확보"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
