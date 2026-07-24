"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { apiGet, apiPost, apiPut } from "@/lib/api";

type Cat = { id: number; level: string; name: string; parentId: number | null; status: string };

const LEVEL_LABEL: Record<string, string> = { LARGE: "대분류", MEDIUM: "중분류", SMALL: "소분류" };

type Modal = { id?: number; level: string; name: string; largeId: number | ""; mediumId: number | "" };

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await apiGet<Cat[]>("/api/categories");
    if (res.ok && res.data) setCats(res.data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const nameById = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c.name])), [cats]);
  const larges = useMemo(() => cats.filter((c) => c.level === "LARGE"), [cats]);
  const mediumsOf = (largeId: number | "") => cats.filter((c) => c.level === "MEDIUM" && c.parentId === largeId);

  async function toggle(id: number) { await apiPost(`/api/categories/${id}/toggle`, {}); load(); }

  function openNew() { setModal({ level: "LARGE", name: "", largeId: "", mediumId: "" }); setModalErr(null); }
  function openEdit(c: Cat) {
    let largeId: number | "" = ""; let mediumId: number | "" = "";
    if (c.level === "MEDIUM") largeId = c.parentId ?? "";
    if (c.level === "SMALL") {
      mediumId = c.parentId ?? "";
      const med = cats.find((x) => x.id === c.parentId);
      largeId = med?.parentId ?? "";
    }
    setModal({ id: c.id, level: c.level, name: c.name, largeId, mediumId });
    setModalErr(null);
  }
  function changeLevel(level: string) {
    setModal((m) => (m ? { ...m, level, largeId: "", mediumId: "" } : m));
    setModalErr(null);
  }

  async function save() {
    if (!modal || !modal.name.trim()) return;
    let parentId: number | null = null;
    if (modal.level === "MEDIUM") {
      if (modal.largeId === "") { setModalErr("상위 대분류를 선택해 주세요."); return; }
      parentId = Number(modal.largeId);
    } else if (modal.level === "SMALL") {
      if (modal.largeId === "") { setModalErr("상위 대분류를 선택해 주세요."); return; }
      if (modal.mediumId === "") { setModalErr("상위 중분류를 선택해 주세요."); return; }
      parentId = Number(modal.mediumId);
    }
    setModalErr(null);
    setSaving(true);
    const body = { level: modal.level, name: modal.name.trim(), parentId };
    const res = modal.id ? await apiPut(`/api/categories/${modal.id}`, body) : await apiPost(`/api/categories`, body);
    setSaving(false);
    if (res.ok) { setModal(null); load(); }
  }

  const selCls = "mt-1.5 w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500";

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle title="카테고리 관리" sub="대/중/소 분류 · 상위 분류 · 운영상태(게시/중지)"
          right={<button onClick={openNew} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">+ 카테고리 등록</button>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-slate-400">
                <th className="px-3 py-3 text-left font-semibold">분류</th>
                <th className="px-3 py-3 text-left font-semibold">상위 분류</th>
                <th className="px-3 py-3 text-left font-semibold">카테고리명</th>
                <th className="px-3 py-3 text-left font-semibold">운영상태</th>
                <th className="px-3 py-3 text-right font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-500">불러오는 중…</td></tr>
              ) : cats.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-500">등록된 카테고리가 없습니다.</td></tr>
              ) : cats.map((c) => (
                <tr key={c.id} className="hover:bg-navy-800/50">
                  <td className="px-3 py-3"><Badge tone="brand">{LEVEL_LABEL[c.level] ?? c.level}</Badge></td>
                  <td className="px-3 py-3 text-slate-400">{c.parentId ? (nameById[c.parentId] ?? "-") : "-"}</td>
                  <td className="px-3 py-3"><button onClick={() => openEdit(c)} className="font-bold text-brand-400 hover:underline">{c.name}</button></td>
                  <td className="px-3 py-3">{c.status === "ACTIVE" ? <Badge tone="pos">게시중</Badge> : <Badge tone="slate">중지</Badge>}</td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => toggle(c.id)} className={`rounded-lg border px-3 py-1 text-xs font-semibold ${c.status === "ACTIVE" ? "border-danger/40 text-danger hover:bg-danger/10" : "border-pos/40 text-pos hover:bg-pos/10"}`}>
                      {c.status === "ACTIVE" ? "중지" : "게시"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-navy-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-black text-white">{modal.id ? "카테고리 수정" : "카테고리 등록"}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">분류</label>
                <div className="mt-1.5 flex gap-2">
                  {(["LARGE", "MEDIUM", "SMALL"] as const).map((lv) => (
                    <button key={lv} onClick={() => changeLevel(lv)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${modal.level === lv ? "border-brand-500 bg-brand-600/20 text-white" : "border-line text-slate-400 hover:bg-navy-800"}`}>
                      {LEVEL_LABEL[lv]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 상위 대분류 (중/소분류) */}
              {(modal.level === "MEDIUM" || modal.level === "SMALL") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400">상위 대분류 <span className="text-danger">*</span></label>
                  <select value={modal.largeId} onChange={(e) => { setModal({ ...modal, largeId: e.target.value ? Number(e.target.value) : "", mediumId: "" }); setModalErr(null); }} className={selCls}>
                    <option value="">{larges.length ? "대분류 선택" : "등록된 대분류가 없습니다"}</option>
                    {larges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* 상위 중분류 (소분류만) */}
              {modal.level === "SMALL" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400">상위 중분류 <span className="text-danger">*</span></label>
                  <select value={modal.mediumId} disabled={modal.largeId === ""} onChange={(e) => { setModal({ ...modal, mediumId: e.target.value ? Number(e.target.value) : "" }); setModalErr(null); }} className={selCls}>
                    <option value="">{modal.largeId === "" ? "대분류 먼저 선택" : (mediumsOf(modal.largeId).length ? "중분류 선택" : "해당 대분류에 중분류가 없습니다")}</option>
                    {mediumsOf(modal.largeId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400">카테고리명</label>
                <input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} autoFocus placeholder="예: 주방자동화기기" className={selCls} />
              </div>
              {modalErr && <p className="text-xs text-danger">{modalErr}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-navy-800">취소</button>
              <button onClick={save} disabled={saving || !modal.name.trim()} className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
