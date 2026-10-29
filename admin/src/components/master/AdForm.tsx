"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiDelete, apiPost, apiPut, apiUpload, mediaUrl } from "@/lib/api";

export type AdImage = { imageUrl: string; mobileUrl?: string | null; linkUrl?: string | null; altText?: string | null; width?: number | null; height?: number | null };
export type AdData = {
  id?: number; title?: string | null; areaId: string; position: string; adType: string;
  published: boolean; imageCount: number; images?: AdImage[];
};

export const AD_TYPES = [
  { value: "SLIDE", label: "슬라이드형", desc: "여러 이미지가 자동으로 넘어가는 메인 슬라이드" },
  { value: "BANNER", label: "배너형", desc: "이미지를 세로로 나열하는 고정 배너" },
  { value: "LAYER_POPUP", label: "레이어팝업형", desc: "메인 진입 시 띄우는 팝업 (오늘 하루 보지 않기)" },
];
export const AD_POSITIONS = [{ value: "MAIN", label: "메인화면" }];
const MAX_IMAGES = 10;
const RESIZE_NOTE: Record<string, string> = {
  SLIDE: "PC 1200px · 모바일 750px 폭으로 자동 리사이징 (권장 비율 3:1 ~ 4:1, 예: 1200×360)",
  BANNER: "PC 1200px · 모바일 750px 폭으로 자동 리사이징 (권장 높이 200~400px)",
  LAYER_POPUP: "600px 폭으로 자동 리사이징 (권장 600×600 ~ 600×800)",
};

const inputCls = "w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 placeholder:text-slate-600";
const emptyImg = (): AdImage => ({ imageUrl: "", mobileUrl: null, linkUrl: "", altText: "" });

/** 본사 [광고관리]-[광고등록/수정] (docs/32) — 등록이미지 수 +/− 마다 업로드 칸 증감, 업로드 시 HOME 폭 리사이징 */
export default function AdForm({ initial }: { initial?: AdData }) {
  const router = useRouter();
  const edit = initial?.id != null;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [areaId, setAreaId] = useState(initial?.areaId ?? "MAIN_SLIDE");
  const [position, setPosition] = useState(initial?.position ?? "MAIN");
  const [adType, setAdType] = useState(initial?.adType ?? "SLIDE");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [images, setImages] = useState<AdImage[]>(() => {
    const n = Math.max(1, initial?.imageCount ?? 1);
    return Array.from({ length: n }, (_, i) => initial?.images?.[i] ?? emptyImg());
  });
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const count = images.length;
  const setCount = (n: number) => {
    const next = Math.min(MAX_IMAGES, Math.max(1, n));
    setImages((prev) => (next > prev.length ? [...prev, ...Array.from({ length: next - prev.length }, emptyImg)] : prev.slice(0, next)));
  };
  const patch = (i: number, p: Partial<AdImage>) => setImages((prev) => prev.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) => setImages((prev) => {
    const j = i + d;
    if (j < 0 || j >= prev.length) return prev;
    const a = [...prev]; [a[i], a[j]] = [a[j], a[i]]; return a;
  });

  async function upload(i: number, file: File | null) {
    if (!file) return;
    if (!/^image\/(jpeg|png|gif)$/.test(file.type)) { setNotice("JPG·PNG·GIF 이미지만 업로드할 수 있습니다."); return; }
    setUploading(i); setNotice(null);
    const r = await apiUpload<AdImage>(`/api/ads/upload?adType=${adType}`, file);
    setUploading(null);
    if (r.ok && r.data) patch(i, { imageUrl: r.data.imageUrl, mobileUrl: r.data.mobileUrl, width: r.data.width, height: r.data.height });
    else setNotice(r.message || "이미지 업로드에 실패했습니다.");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (!areaId.trim()) return setNotice("광고영역ID를 입력해 주세요.");
    const missing = images.findIndex((x) => !x.imageUrl);
    if (missing >= 0) return setNotice(`이미지 ${missing + 1}을(를) 업로드해 주세요.`);
    setSaving(true);
    const payload = { title, areaId: areaId.trim(), position, adType, published, imageCount: count, images };
    const r = edit ? await apiPut(`/api/ads/${initial!.id}`, payload) : await apiPost("/api/ads", payload);
    setSaving(false);
    if (r.ok) router.push("/master/ads");
    else setNotice(r.message || "저장에 실패했습니다.");
  }

  async function remove() {
    if (!edit || !confirm("이 광고를 삭제하시겠습니까?")) return;
    const r = await apiDelete(`/api/ads/${initial!.id}`);
    if (r.ok) router.push("/master/ads"); else setNotice(r.message || "삭제에 실패했습니다.");
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="card p-5">
        <h3 className="mb-4 text-sm font-black text-white">광고 기본정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-400">광고게시여부</span>
            <div className="mt-1 flex gap-2">
              {[[true, "게시"], [false, "미게시"]].map(([v, l]) => (
                <button key={String(v)} type="button" onClick={() => setPublished(v as boolean)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${published === v ? "bg-brand-600 text-white" : "border border-line text-slate-400 hover:bg-navy-800"}`}>
                  {l as string}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">광고명 <span className="font-normal text-slate-500">(관리용)</span></span>
            <input className={`mt-1 ${inputCls}`} value={title ?? ""} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="예: 11월 메인 프로모션" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">광고영역ID <span className="text-danger">*</span> <span className="font-normal text-slate-500">(영문·숫자·_·-)</span></span>
            <input className={`mt-1 font-mono ${inputCls}`} value={areaId} maxLength={50} onChange={(e) => setAreaId(e.target.value)} placeholder="MAIN_SLIDE" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">광고위치</span>
            <select className={`mt-1 ${inputCls}`} value={position} onChange={(e) => setPosition(e.target.value)}>
              {AD_POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">광고유형</span>
            <select className={`mt-1 ${inputCls}`} value={adType} onChange={(e) => setAdType(e.target.value)}>
              {AD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span className="mt-1 block text-[11px] text-slate-500">{AD_TYPES.find((t) => t.value === adType)?.desc}</span>
          </label>
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-400">등록이미지 수</span>
            <div className="mt-1 flex items-center gap-2">
              <button type="button" onClick={() => setCount(count - 1)} disabled={count <= 1} aria-label="이미지 수 줄이기"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-lg font-bold text-slate-200 hover:bg-navy-800 disabled:opacity-30">−</button>
              <span className="w-12 text-center text-lg font-black text-white">{count}</span>
              <button type="button" onClick={() => setCount(count + 1)} disabled={count >= MAX_IMAGES} aria-label="이미지 수 늘리기"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-lg font-bold text-slate-200 hover:bg-navy-800 disabled:opacity-30">+</button>
              <span className="ml-2 text-xs text-slate-500">최대 {MAX_IMAGES}개 · 개수만큼 업로드 칸이 생성됩니다</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-black text-white">광고 이미지</h3>
        <p className="mb-4 mt-1 text-xs text-slate-500">{RESIZE_NOTE[adType]} · 업로드 후 광고유형을 바꾸면 이미지를 다시 업로드해 주세요.</p>
        <ul className="space-y-3">
          {images.map((img, i) => (
            <li key={i} className="grid gap-3 rounded-xl bg-navy-800 p-3 sm:grid-cols-[220px_1fr]">
              <label className="relative grid aspect-[3/1] cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-line bg-navy-950 hover:border-brand-500">
                {img.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(img.imageUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-500">{uploading === i ? "업로드 중…" : "＋ 이미지 업로드"}</span>
                )}
                {uploading === i && img.imageUrl && <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs text-white">업로드 중…</span>}
                <input type="file" accept="image/jpeg,image/png,image/gif" className="hidden"
                  onChange={(e) => { upload(i, e.target.files?.[0] ?? null); e.target.value = ""; }} />
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    이미지 {i + 1}
                    {img.width ? <span className="ml-2 font-normal text-slate-500">{img.width}×{img.height}px{img.mobileUrl ? " · 모바일본 생성" : ""}</span> : null}
                  </span>
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-2 text-xs text-slate-400 hover:bg-navy-700 disabled:opacity-30">▲</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded px-2 text-xs text-slate-400 hover:bg-navy-700 disabled:opacity-30">▼</button>
                  </span>
                </div>
                <input className={inputCls} value={img.linkUrl ?? ""} maxLength={500} onChange={(e) => patch(i, { linkUrl: e.target.value })} placeholder="클릭 시 이동 URL (선택) 예: /products/15" />
                <input className={inputCls} value={img.altText ?? ""} maxLength={200} onChange={(e) => patch(i, { altText: e.target.value })} placeholder="대체텍스트 (선택, 검색·접근성용)" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {notice && <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{notice}</div>}

      <div className="flex items-center justify-between gap-2">
        <div>{edit && <button type="button" onClick={remove} className="rounded-xl border border-danger/40 px-5 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10">삭제</button>}</div>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push("/master/ads")} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-navy-800">취소</button>
          <button type="submit" disabled={saving || uploading !== null} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
            {saving ? "저장 중…" : edit ? "변경 저장" : "광고 등록"}
          </button>
        </div>
      </div>
    </form>
  );
}
