"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { NOTICE_META, NoticeSeg } from "@/lib/noticeMeta";

type Org = { idx: number; name: string };
type NoticeData = {
  id: number; title: string; content: string; targetType: string;
  allFlag: boolean; targetId: number | null; published: boolean;
};

const inputCls = "w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 placeholder:text-slate-600";

/** 본사 공지사항 등록/수정 (대상별 전체공지 or 본부/센터 선택) */
export default function NoticeForm({ seg, mode, id }: { seg: NoticeSeg; mode: "new" | "edit"; id?: number }) {
  const meta = NOTICE_META[seg];
  const router = useRouter();
  const listHref = `/master/notice/${seg}`;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [allFlag, setAllFlag] = useState(true);
  const [published, setPublished] = useState(true);
  const [divisions, setDivisions] = useState<Org[]>([]);
  const [centers, setCenters] = useState<Org[]>([]);
  const [divisionIdx, setDivisionIdx] = useState(""); // 본부 선택
  const [centerIdx, setCenterIdx] = useState("");      // 센터 선택 (scope=center)
  const [loaded, setLoaded] = useState(mode === "new");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 본부 목록
  useEffect(() => { apiGet<Org[]>("/api/org/center-codes/divisions").then((r) => { if (r.data) setDivisions(r.data); }); }, []);

  // 본부 변경 → 센터 목록 (scope=center)
  useEffect(() => {
    if (meta.scope !== "center") return;
    if (!divisionIdx) { setCenters([]); return; }
    apiGet<Org[]>(`/api/org/center-codes/centers?divisionIdx=${divisionIdx}`).then((r) => { if (r.data) setCenters(r.data); });
  }, [divisionIdx, meta.scope]);

  // 수정 모드: 기존 값 로드 + target_id로 본부/센터 복원
  useEffect(() => {
    if (mode !== "edit" || id == null) return;
    apiGet<NoticeData>(`/api/notices/${id}`).then(async (r) => {
      if (!r.data) { setNotice("공지사항을 찾을 수 없습니다."); setLoaded(true); return; }
      const n = r.data;
      setTitle(n.title); setContent(n.content ?? ""); setAllFlag(n.allFlag); setPublished(n.published);
      if (!n.allFlag && n.targetId != null) {
        if (meta.scope === "division") {
          setDivisionIdx(String(n.targetId));
        } else {
          // 센터 idx → 본부 찾기: 각 본부의 센터 목록에서 매칭
          const divs = (await apiGet<Org[]>("/api/org/center-codes/divisions")).data ?? [];
          for (const d of divs) {
            const cs = (await apiGet<Org[]>(`/api/org/center-codes/centers?divisionIdx=${d.idx}`)).data ?? [];
            if (cs.some((c) => c.idx === n.targetId)) { setDivisionIdx(String(d.idx)); setCenterIdx(String(n.targetId)); break; }
          }
        }
      }
      setLoaded(true);
    });
  }, [mode, id, meta.scope]);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!title.trim()) { setNotice("제목을 입력해 주세요."); return; }
    let targetId: number | null = null;
    if (!allFlag) {
      if (meta.scope === "division") {
        if (!divisionIdx) { setNotice("본부를 선택해 주세요."); return; }
        targetId = Number(divisionIdx);
      } else {
        if (!divisionIdx) { setNotice("본부를 선택해 주세요."); return; }
        if (!centerIdx) { setNotice("센터를 선택해 주세요."); return; }
        targetId = Number(centerIdx);
      }
    }
    setSaving(true);
    const payload = { title, content, targetType: meta.key, allFlag, targetId, published };
    const res = mode === "new" ? await apiPost("/api/notices", payload) : await apiPut(`/api/notices/${id}`, payload);
    setSaving(false);
    if (res.ok) router.push(listHref);
    else setNotice(res.message ?? "저장에 실패했습니다.");
  }

  async function onDelete() {
    if (id == null) return;
    if (!window.confirm("이 공지사항을 삭제할까요?")) return;
    const res = await apiDelete(`/api/notices/${id}`);
    if (res.ok) router.push(listHref);
    else setNotice(res.message ?? "삭제에 실패했습니다.");
  }

  if (!loaded) return <p className="text-sm text-slate-400">불러오는 중…</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-white">{meta.label} 공지사항 {mode === "new" ? "등록" : "수정"}</h3>
          <button type="button" onClick={() => router.push(listHref)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-navy-800">← 목록</button>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-400">제목 *</span>
            <input className={`mt-1 ${inputCls}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목" />
          </label>

          {/* 공지 대상 (전체공지 or 본부/센터 선택) */}
          <div>
            <span className="text-xs font-semibold text-slate-400">공지 대상 · {meta.label}</span>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setAllFlag(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${allFlag ? "border-brand-500 bg-brand-600/20 text-white" : "border-line text-slate-400 hover:bg-navy-800"}`}>
                {meta.label} 전체 공지
              </button>
              <button type="button" onClick={() => setAllFlag(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${!allFlag ? "border-brand-500 bg-brand-600/20 text-white" : "border-line text-slate-400 hover:bg-navy-800"}`}>
                {meta.scope === "division" ? "특정 본부 선택" : "특정 센터 선택"}
              </button>
            </div>
          </div>

          {!allFlag && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">본부</span>
                <select className={`mt-1 ${inputCls}`} value={divisionIdx} onChange={(e) => { setDivisionIdx(e.target.value); setCenterIdx(""); }}>
                  <option value="">본부 선택</option>
                  {divisions.map((d) => <option key={d.idx} value={d.idx}>{d.name}</option>)}
                </select>
              </label>
              {meta.scope === "center" && (
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">센터</span>
                  <select className={`mt-1 ${inputCls}`} value={centerIdx} disabled={!divisionIdx} onChange={(e) => setCenterIdx(e.target.value)}>
                    <option value="">{!divisionIdx ? "본부 먼저 선택" : centers.length ? "센터 선택" : "센터 없음"}</option>
                    {centers.map((c) => <option key={c.idx} value={c.idx}>{c.name}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-slate-400">내용</span>
            <textarea rows={8} className={`mt-1 ${inputCls}`} value={content} onChange={(e) => setContent(e.target.value)} placeholder="공지 내용" />
          </label>

          <div>
            <span className="text-xs font-semibold text-slate-400">게시 여부</span>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setPublished(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${published ? "border-pos/50 bg-pos/15 text-pos" : "border-line text-slate-400 hover:bg-navy-800"}`}>게시</button>
              <button type="button" onClick={() => setPublished(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${!published ? "border-danger/50 bg-danger/15 text-danger" : "border-line text-slate-400 hover:bg-navy-800"}`}>미게시</button>
            </div>
          </div>
        </div>
      </section>

      {notice && <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{notice}</div>}

      <div className="flex justify-between">
        {mode === "edit"
          ? <button type="button" onClick={onDelete} className="rounded-xl border border-danger/50 bg-danger/10 px-5 py-2.5 text-sm font-bold text-danger hover:bg-danger/20">삭제</button>
          : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push(listHref)} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-navy-800">취소</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
            {saving ? "저장 중…" : mode === "new" ? "공지 등록" : "변경 저장"}
          </button>
        </div>
      </div>
    </form>
  );
}
