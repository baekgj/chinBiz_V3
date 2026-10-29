"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { apiDelete, apiDownload, apiGet, apiUpload } from "@/lib/api";

type Product = { id: number; name: string; partnerId: number | null; simpleDelivery?: boolean; onSale?: boolean };
type Material = {
  id: number; productId: number; productName?: string; title: string; description?: string | null;
  fileName: string; fileSize?: number | null; downloadCount?: number; createdAt?: string | null;
};

const MAX_MB = 100;
const inputCls = "w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 placeholder:text-slate-600";

function fmtSize(n?: number | null) {
  if (!n) return "-";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

/** 본사 [교육관리]-[교육자료 등록] (docs/32) — 상품 선택 + 파일 업로드, 매니저 [교육관리]에서 다운로드 */
export default function EduMaterialsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<Material[]>([]);
  const [filter, setFilter] = useState("");
  const [productId, setProductId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 교육 대상 = 파트너 공급 상품(단순배송 제외) — 매니저 교육관리 목록 기준과 동일
    apiGet<{ content: Product[] }>("/api/products?page=0&size=1000").then((r) => {
      if (r.data?.content) setProducts(r.data.content.filter((p) => p.partnerId != null && !p.simpleDelivery));
    });
  }, []);

  const load = () => {
    apiGet<Material[]>(`/api/education/materials${filter ? `?productId=${filter}` : ""}`).then((r) => { if (r.ok && r.data) setRows(r.data); });
  };
  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const productName = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p.name])), [products]);

  function pick(f: File | null) {
    setMsg(null);
    if (f && f.size > MAX_MB * 1024 * 1024) { setMsg({ ok: false, text: `파일은 ${MAX_MB}MB 이하만 업로드할 수 있습니다.` }); return; }
    setFile(f);
    if (f && !title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return setMsg({ ok: false, text: "상품을 선택해 주세요." });
    if (!title.trim()) return setMsg({ ok: false, text: "자료명을 입력해 주세요." });
    if (!file) return setMsg({ ok: false, text: "업로드할 파일을 선택해 주세요." });
    setSaving(true); setMsg(null);
    const r = await apiUpload("/api/education/materials", file, { productId, title: title.trim(), description: desc.trim() });
    setSaving(false);
    if (!r.ok) return setMsg({ ok: false, text: r.status === 413 ? `파일 용량이 너무 큽니다(최대 ${MAX_MB}MB).` : (r.message || "등록에 실패했습니다.") });
    setMsg({ ok: true, text: "교육자료가 등록되었습니다." });
    setTitle(""); setDesc(""); setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function remove(m: Material) {
    if (!confirm(`[${m.title}] 교육자료를 삭제하시겠습니까?\n삭제 후 매니저는 해당 자료를 다운로드할 수 없습니다.`)) return;
    const r = await apiDelete(`/api/education/materials/${m.id}`);
    if (r.ok) load(); else alert(r.message || "삭제에 실패했습니다.");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_3fr] animate-float-up">
      {/* 등록 */}
      <Card>
        <SectionTitle title="교육자료 등록" sub="상품을 선택하고 교육자료 파일을 업로드하세요" />
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">상품 선택 <span className="text-danger">*</span></span>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={`mt-1 ${inputCls}`}>
              <option value="">교육 대상 상품을 선택하세요</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.onSale === false ? " (판매중지)" : ""}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">자료명 <span className="text-danger">*</span></span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="예: 설치 매뉴얼 v1.2" className={`mt-1 ${inputCls}`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">설명 <span className="font-normal text-slate-500">(선택)</span></span>
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="매니저에게 안내할 내용" className={`mt-1 ${inputCls}`} />
          </label>
          <div>
            <span className="text-xs font-semibold text-slate-400">파일 업로드 <span className="text-danger">*</span> <span className="font-normal text-slate-500">(PDF·PPT·문서·이미지·동영상, 최대 {MAX_MB}MB)</span></span>
            <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line bg-navy-950 px-3 py-3 hover:border-brand-500">
              <span className="shrink-0 rounded-md bg-navy-700 px-3 py-1.5 text-xs font-bold text-slate-200">파일 선택</span>
              <span className={`min-w-0 truncate text-sm ${file ? "text-white" : "text-slate-600"}`}>
                {file ? `${file.name} · ${fmtSize(file.size)}` : "선택된 파일 없음"}
              </span>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-brand-300" : "text-danger"}`}>{msg.text}</p>}
          <button type="submit" disabled={saving}
            className="w-full rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
            {saving ? "업로드 중…" : "교육자료 등록"}
          </button>
          <p className="text-xs leading-relaxed text-slate-500">
            * 매니저는 [교육관리]에서 상품별 교육자료를 <b className="text-slate-300">모두 다운로드</b>해야 [교육완료] 버튼이 활성화됩니다.
          </p>
        </form>
      </Card>

      {/* 목록 */}
      <Card>
        <SectionTitle title="등록된 교육자료" sub={`${rows.length}건`}
          right={
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-line bg-navy-950 px-2 py-1.5 text-xs text-white outline-none focus:border-brand-500">
              <option value="">전체 상품</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          } />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-slate-400">
                <th className="px-2 py-2 font-semibold">상품</th>
                <th className="px-2 py-2 font-semibold">자료명 / 파일</th>
                <th className="px-2 py-2 text-right font-semibold">용량</th>
                <th className="px-2 py-2 text-center font-semibold">다운로드</th>
                <th className="px-2 py-2 font-semibold">등록일</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {rows.length === 0 && <tr><td colSpan={6} className="px-2 py-10 text-center text-sm text-slate-500">등록된 교육자료가 없습니다.</td></tr>}
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-navy-800/50">
                  <td className="px-2 py-2.5 text-xs text-slate-300">{m.productName ?? productName[m.productId] ?? `#${m.productId}`}</td>
                  <td className="px-2 py-2.5">
                    <p className="font-semibold text-white">{m.title}</p>
                    <button onClick={() => apiDownload(`/api/education/materials/${m.id}/download`, m.fileName).then((r) => { if (!r.ok) alert(r.message); })}
                      className="mt-0.5 max-w-[16rem] truncate text-left text-xs text-brand-300 hover:underline">📎 {m.fileName}</button>
                    {m.description && <p className="mt-0.5 text-xs text-slate-500">{m.description}</p>}
                  </td>
                  <td className="px-2 py-2.5 text-right text-xs text-slate-400">{fmtSize(m.fileSize)}</td>
                  <td className="px-2 py-2.5 text-center text-xs text-slate-300">{(m.downloadCount ?? 0).toLocaleString()}회</td>
                  <td className="px-2 py-2.5 text-xs text-slate-400">{m.createdAt?.slice(0, 10) ?? "-"}</td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => remove(m)} className="rounded-md border border-danger/40 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
