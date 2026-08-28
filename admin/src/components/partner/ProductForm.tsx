"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost, apiPut, apiUpload, mediaUrl } from "@/lib/api";
import RichTextEditor from "@/components/RichTextEditor";
import DatePicker from "@/components/DatePicker";

export type ProductData = Record<string, unknown> & { id?: number };

type Cat = { id: number; level: string; name: string; parentId: number | null; status: string };

const ROLE_FIELDS: { key: string; label: string }[] = [
  { key: "buzzReward", label: "1차 버즈회원" },
  { key: "chinkuReward", label: "상위 추천회원(친쿠)" },
  { key: "managerReward", label: "2차 관리매니저" },
  { key: "salesCenterReward", label: "소속센터" },
  { key: "mgmtCenterReward", label: "관리센터" },
  { key: "divisionReward", label: "총괄본부" },
  { key: "hqReward", label: "친비즈 본사" },
];

const REWARD_KEYS = ["buzzReward", "chinkuReward", "managerReward", "salesCenterReward", "mgmtCenterReward", "divisionReward", "hqReward"];
const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 placeholder:text-slate-400";

/** 파트너 · 위탁 상품 등록/수정 폼 (본사 상품등록 화면 참조, 라이트 테마) */
export default function ProductForm({ mode, initial }: { mode: "new" | "edit"; initial?: ProductData }) {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const g = (k: string, d: unknown = "") => (initial?.[k] ?? d) as string | number;
  const [f, setF] = useState<Record<string, string>>({
    name: String(g("name")),
    rewardType: String(g("rewardType", "RATE")),
    salePrice: String(g("salePrice", 0)),
    totalAllowance: String(g("totalAllowance", 0)),
    buzzReward: String(g("buzzReward", 0)), chinkuReward: String(g("chinkuReward", 0)),
    managerReward: String(g("managerReward", 0)), salesCenterReward: String(g("salesCenterReward", 0)),
    mgmtCenterReward: String(g("mgmtCenterReward", 0)), divisionReward: String(g("divisionReward", 0)),
    hqReward: String(g("hqReward", 0)),
    description: String(g("description")), installPolicy: String(g("installPolicy")), returnPolicy: String(g("returnPolicy")),
    contractEndDate: initial?.contractEndDate ? String(initial.contractEndDate) : "",
    videoUrl: String(g("videoUrl")),
    specEffect: String(g("specEffect")), salesTarget: String(g("salesTarget")),
    productFeature: String(g("productFeature")), processFlow: String(g("processFlow")),
  });
  const [onSale, setOnSale] = useState<boolean>(initial?.onSale != null ? Boolean(initial.onSale) : true);
  const [installProduct, setInstallProduct] = useState<boolean>(Boolean(initial?.installProduct));
  const [monthlyCare, setMonthlyCare] = useState<boolean>(Boolean(initial?.monthlyCare));
  const [asSupport, setAsSupport] = useState<boolean>(Boolean(initial?.asSupport));
  const [popular, setPopular] = useState<boolean>(Boolean(initial?.popular));
  const [recommended, setRecommended] = useState<boolean>(Boolean(initial?.recommended));
  const [images, setImages] = useState<string[]>(() =>
    [initial?.image1, initial?.image2, initial?.image3, initial?.image4, initial?.image5]
      .map((v) => (v ? String(v) : "")).filter((v) => v !== ""),
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 카테고리 3단 cascade (대 → 중 → 소)
  const [catLarge, setCatLarge] = useState<number | "">("");
  const [catMedium, setCatMedium] = useState<number | "">("");
  const [catSmall, setCatSmall] = useState<number | "">("");
  const catDerived = useRef(false);

  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const roleSumLive = REWARD_KEYS.reduce((a, k) => a + (f[k] === "" ? 0 : Number(f[k])), 0);

  useEffect(() => {
    apiGet<Cat[]>("/api/partner/categories").then((r) => { if (r.data) setCats(r.data); });
  }, []);

  // 수정 모드: 저장된 categoryId 로 대/중/소 cascade 복원
  useEffect(() => {
    if (catDerived.current || cats.length === 0 || initial?.categoryId == null) return;
    catDerived.current = true;
    const cat = cats.find((c) => c.id === Number(initial.categoryId));
    if (!cat) return;
    if (cat.level === "LARGE") setCatLarge(cat.id);
    else if (cat.level === "MEDIUM") { setCatMedium(cat.id); setCatLarge(cat.parentId ?? ""); }
    else if (cat.level === "SMALL") {
      setCatSmall(cat.id);
      const med = cats.find((c) => c.id === cat.parentId);
      setCatMedium(med?.id ?? "");
      setCatLarge(med?.parentId ?? "");
    }
  }, [cats, initial]);

  const larges = cats.filter((c) => c.level === "LARGE");
  const mediums = cats.filter((c) => c.level === "MEDIUM" && c.parentId === catLarge);
  const smalls = cats.filter((c) => c.level === "SMALL" && c.parentId === catMedium);
  const categoryId = catSmall || catMedium || catLarge || "";

  const isRate = f.rewardType === "RATE";
  const unit = isRate ? "%" : "원";

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).filter((x) => x.type.startsWith("image/"));
    if (files.length === 0) return;
    setNotice(null);
    const remaining = 5 - images.length;
    if (remaining <= 0) { setNotice("이미지는 최대 5개까지 등록할 수 있습니다."); return; }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) setNotice(`이미지는 최대 5개까지 등록할 수 있어 ${remaining}개만 추가합니다.`);
    setUploading(true);
    for (const file of toUpload) {
      const res = await apiUpload<{ url: string }>("/api/uploads", file);
      if (res.ok && res.data?.url) setImages((p) => (p.length >= 5 ? p : [...p, res.data!.url]));
      else setNotice(res.message ?? "이미지 업로드에 실패했습니다.");
    }
    setUploading(false);
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!f.name.trim()) { setNotice("상품명을 입력해 주세요."); return; }
    if (f.contractEndDate && f.contractEndDate < new Date().toLocaleDateString("sv-SE")) { setNotice("계약(영업) 종료일은 오늘 이후로 선택해 주세요."); return; }
    const num = (s: string) => (s === "" ? 0 : Number(s));
    const roleSum = REWARD_KEYS.reduce((a, k) => a + num(f[k]), 0);
    if (isRate) {
      if (roleSum !== 100) { setNotice(`비율 유형: 역할별 수당 합계가 100%가 아닙니다. (현재 ${roleSum}%)`); return; }
    } else {
      const total = num(f.totalAllowance);
      if (roleSum !== total) {
        setNotice(`고정 유형: 역할별 수당 합계(₩${roleSum.toLocaleString("ko-KR")})가 총수당(₩${total.toLocaleString("ko-KR")})과 일치하지 않습니다.`);
        return;
      }
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: f.name, rewardType: f.rewardType, salePrice: num(f.salePrice), totalAllowance: num(f.totalAllowance),
      categoryId: categoryId ? Number(categoryId) : null,
      image1: images[0] ?? "", image2: images[1] ?? "", image3: images[2] ?? "", image4: images[3] ?? "", image5: images[4] ?? "",
      buzzReward: num(f.buzzReward), chinkuReward: num(f.chinkuReward), managerReward: num(f.managerReward),
      salesCenterReward: num(f.salesCenterReward), mgmtCenterReward: num(f.mgmtCenterReward),
      divisionReward: num(f.divisionReward), hqReward: num(f.hqReward),
      description: f.description, installPolicy: f.installPolicy, returnPolicy: f.returnPolicy, onSale,
      contractEndDate: f.contractEndDate || null, installProduct, popular, recommended,
      videoUrl: f.videoUrl, monthlyCare, asSupport,
      specEffect: f.specEffect, salesTarget: f.salesTarget, productFeature: f.productFeature, processFlow: f.processFlow,
    };
    const res = mode === "new" ? await apiPost("/api/partner/products", payload) : await apiPut(`/api/partner/products/${initial?.id}`, payload);
    setSaving(false);
    if (res.ok) router.push("/partner/products");
    else setNotice(res.message ?? "저장에 실패했습니다.");
  }

  const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 기본 정보 */}
      <section className={card}>
        <h3 className="mb-3 text-sm font-black text-slate-900">기본 정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 block">
            <span className="text-xs font-semibold text-slate-500">상품명 *</span>
            <input className={`mt-1 ${inputCls}`} value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="상품명" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">수당 유형</span>
            <div className="mt-1 flex gap-2">
              {(["RATE", "FIXED"] as const).map((t) => (
                <button type="button" key={t} onClick={() => set("rewardType")(t)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${f.rewardType === t ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
                  {t === "RATE" ? "비율 (RATE)" : "고정 (FIXED)"}
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">판매여부</span>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setOnSale(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${onSale ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>판매중</button>
              <button type="button" onClick={() => setOnSale(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${!onSale ? "border-red-500 bg-red-50 text-red-600" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>판매중지</button>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">판매가 (원)</span>
            <input type="number" className={`mt-1 ${inputCls}`} value={f.salePrice} onChange={(e) => set("salePrice")(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">총수당 (원)</span>
            <input type="number" className={`mt-1 ${inputCls}`} value={f.totalAllowance} onChange={(e) => set("totalAllowance")(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">계약(영업) 종료일</span>
            <div className="mt-1"><DatePicker variant="light" value={f.contractEndDate} min={new Date().toLocaleDateString("sv-SE")} onChange={set("contractEndDate")} placeholder="종료일 선택 (상시 판매 시 비움)" /></div>
            <span className="mt-1 block text-[11px] text-slate-400">미지정 시 상시 판매 (마켓에 D-day 미표시)</span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">설치상품 여부</span>
            <button type="button" onClick={() => setInstallProduct((v) => !v)}
              className={`mt-1 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${installProduct ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
              <span className={`grid h-5 w-5 place-items-center rounded border ${installProduct ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300 text-transparent"}`}>✓</span>
              {installProduct ? "설치상품 (방문 설치형)" : "일반상품"}
            </button>
          </label>
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500">상품 특성 <span className="font-normal text-slate-400">(중복 선택 가능)</span></span>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setMonthlyCare((v) => !v)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${monthlyCare ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
                {monthlyCare ? "✓ 월관리상품" : "월관리상품"}
              </button>
              <button type="button" onClick={() => setAsSupport((v) => !v)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${asSupport ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
                {asSupport ? "✓ AS지원" : "AS지원"}
              </button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500">키워드 태그 <span className="font-normal text-slate-400">(마켓 배지 · 중복 선택 가능)</span></span>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setPopular((v) => !v)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${popular ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
                {popular ? "★ 인기" : "인기"}
              </button>
              <button type="button" onClick={() => setRecommended((v) => !v)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${recommended ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
                {recommended ? "✓ 추천" : "추천"}
              </button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500">카테고리 (대 → 중 → 소)</span>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select className={inputCls} value={catLarge} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setCatLarge(v); setCatMedium(""); setCatSmall(""); }}>
                <option value="">대분류 선택</option>
                {larges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={inputCls} value={catMedium} disabled={catLarge === ""} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setCatMedium(v); setCatSmall(""); }}>
                <option value="">{catLarge === "" ? "대분류 먼저" : mediums.length ? "중분류 선택" : "중분류 없음"}</option>
                {mediums.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={inputCls} value={catSmall} disabled={catMedium === ""} onChange={(e) => setCatSmall(e.target.value ? Number(e.target.value) : "")}>
                <option value="">{catMedium === "" ? "중분류 먼저" : smalls.length ? "소분류 선택" : "소분류 없음"}</option>
                {smalls.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 역할별 수당 — 상품상세보기(edit=보기전용)에서는 숨김, 신규등록 시에만 노출 */}
      {mode !== "edit" && (
        <section className={card}>
          <h3 className="mb-1 text-sm font-black text-slate-900">역할별 수당 <span className="text-xs font-medium text-slate-400">(단위: {unit})</span></h3>
          <p className="mb-3 text-xs text-slate-500">7주체 배분 — {isRate ? "총수당 대비 비율(%)" : "고정 금액(원)"}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROLE_FIELDS.map((r) => (
              <label key={r.key} className="block">
                <span className="text-xs font-semibold text-slate-500">{r.label}</span>
                <div className="mt-1 flex items-center gap-1">
                  <input type="number" className={inputCls} value={f[r.key]} onChange={(e) => set(r.key)(e.target.value)} />
                  <span className="text-xs text-slate-400">{unit}</span>
                </div>
              </label>
            ))}
          </div>
          {(() => {
            const target = isRate ? 100 : (f.totalAllowance === "" ? 0 : Number(f.totalAllowance));
            const okSum = roleSumLive === target;
            const fmt = (n: number) => isRate ? `${n}%` : `₩${n.toLocaleString("ko-KR")}`;
            return (
              <p className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold ${okSum ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"}`}>
                {okSum ? "✓ 합계 일치" : "⚠ 합계 불일치"} — 역할별 수당 합계 {fmt(roleSumLive)} / {isRate ? "필요 100%" : `총수당 ${fmt(target)}`}
              </p>
            );
          })()}
        </section>
      )}

      {/* 이미지 (파일 업로드 / 드래그 앤 드롭, 최대 5개) */}
      <section className={card}>
        <h3 className="text-sm font-black text-slate-900">상품 이미지 <span className="text-xs font-medium text-slate-400">({images.length}/5)</span></h3>
        <p className="mb-3 text-xs text-slate-500">이미지 파일을 드래그 & 드롭하거나 [파일 선택]으로 업로드합니다 (최대 5개)</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-sky-500 bg-sky-50" : "border-slate-300"} ${images.length >= 5 ? "opacity-50" : ""}`}
        >
          <p className="text-sm text-slate-600">이미지를 여기에 드래그 & 드롭</p>
          <p className="mt-0.5 text-xs text-slate-400">또는</p>
          <button type="button" disabled={images.length >= 5 || uploading} onClick={() => fileRef.current?.click()}
            className="mt-2 rounded-lg border border-sky-500 px-4 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-50 disabled:opacity-40">
            {uploading ? "업로드 중…" : images.length >= 5 ? "최대 5개" : "파일 선택"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden
            onChange={(e) => { handleFiles(e.target.files); e.currentTarget.value = ""; }} />
        </div>

        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((url, i) => (
              <div key={i} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(url)} alt={`상품 이미지 ${i + 1}`} className="h-24 w-full object-cover" />
                <button type="button" onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-black/50 text-sm text-white hover:bg-red-600">×</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 설명/규정 */}
      <section className={card}>
        <h3 className="mb-3 text-sm font-black text-slate-900">상품 설명 및 규정</h3>
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">상품영상 URL <span className="font-normal text-slate-400">(YouTube 등 · 상세화면 재생)</span></span>
            <input className={`mt-1 ${inputCls}`} value={f.videoUrl} onChange={(e) => set("videoUrl")(e.target.value)} placeholder="https://youtu.be/..." />
          </label>
          <div className="block">
            <span className="text-xs font-semibold text-slate-500">상품 설명 <span className="font-normal text-slate-400">(파트너 전용)</span></span>
            <div className="mt-1"><RichTextEditor theme="light" value={f.description} onChange={set("description")} placeholder="파트너 전용 상품 상세 설명 (서식·이미지 삽입·크기조절 지원)" /></div>
          </div>
          {/* 확장 상세 4종 (docs/25) */}
          {([
            ["specEffect", "핵심스펙/효과"],
            ["salesTarget", "영업대상"],
            ["productFeature", "상품특성"],
            ["processFlow", "처리프로세스"],
          ] as const).map(([key, label]) => (
            <div key={key} className="block">
              <span className="text-xs font-semibold text-slate-500">{label}</span>
              <div className="mt-1"><RichTextEditor key={key} theme="light" value={f[key] ?? ""} onChange={set(key)} placeholder={label} /></div>
            </div>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">설치 규정</span>
              <textarea rows={3} className={`mt-1 ${inputCls}`} value={f.installPolicy} onChange={(e) => set("installPolicy")(e.target.value)} placeholder="예: 배정 후 24h 내 상담, 5일 내 설치" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">반품/취소 규정</span>
              <textarea rows={3} className={`mt-1 ${inputCls}`} value={f.returnPolicy} onChange={(e) => set("returnPolicy")(e.target.value)} placeholder="예: 설치 단계 취소 시 실비 보전" />
            </label>
          </div>
        </div>
      </section>

      {notice && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{notice}</div>}

      <div className="flex justify-end gap-2">
        {mode === "edit" ? (
          // 파트너 상품정보 = 보기 전용: 변경저장 제거, 이전 페이지로 돌아가기 (docs/24)
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">돌아가기</button>
        ) : (
          <>
            <button type="button" onClick={() => router.push("/partner/products")} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">취소</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-60">
              {saving ? "저장 중…" : "상품 등록"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
