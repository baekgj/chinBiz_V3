"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { apiGet, apiPut } from "@/lib/api";
import RichTextEditor from "@/components/RichTextEditor";

type Term = { code: string; title: string; content: string | null; updatedAt?: string | null };

/** 내용이 HTML 태그를 포함하는지 판별 */
function looksHtml(s: string) {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}
/** 저장된 평문(\n)을 에디터용 HTML로 변환. 이미 HTML이면 그대로. */
function toHtml(s: string | null | undefined): string {
  if (!s) return "";
  if (looksHtml(s)) return s;
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
}

export default function TermsManager() {
  const [list, setList] = useState<Term[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => apiGet<Term[]>("/api/org/terms").then((r) => { if (r.ok && r.data) { setList(r.data); if (!sel && r.data[0]) pick(r.data[0]); } });
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  function pick(t: Term) { setSel(t.code); setTitle(t.title); setContent(toHtml(t.content)); setMsg(null); }

  async function save() {
    if (!sel) return;
    setSaving(true); setMsg(null);
    const r = await apiPut<{ message: string }>(`/api/org/terms/${sel}`, { title, content });
    setSaving(false);
    if (r.ok) { setMsg("저장되었습니다."); load(); } else setMsg(r.message || "저장 실패");
  }

  return (
    <div className="space-y-6 animate-float-up">
      <Card>
        <SectionTitle title="약관설정" sub="10종 약관/동의서 등록·수정 (home·회원가입·입점신청 등에 노출). 서식 편집 또는 HTML 코드로 등록" />
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* 목록 */}
          <ul className="space-y-1">
            {list.map((t) => (
              <li key={t.code}>
                <button onClick={() => pick(t)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${sel === t.code ? "bg-brand-600/25 text-white ring-1 ring-brand-500/40" : "text-slate-300 hover:bg-navy-800"}`}>
                  <span className="block font-bold">{t.title}</span>
                  <span className="block font-mono text-[10px] text-slate-500">{t.code}{!t.content ? " · 미등록" : ""}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* 편집 */}
          {sel ? (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-400">약관 제목</p>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500" />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-400">약관 내용 <span className="font-normal text-slate-500">(서식 편집 또는 툴바의 [&lt;/&gt; HTML]로 코드 직접 등록)</span></p>
                <RichTextEditor key={sel} value={content} onChange={setContent} theme="dark" minHeight={420} placeholder="약관 내용을 입력하세요" />
              </div>
              {msg && <p className="text-sm font-semibold text-brand-300">{msg}</p>}
              <div className="flex justify-end">
                <button onClick={save} disabled={saving}
                  className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
                  {saving ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          ) : <p className="text-sm text-slate-500">왼쪽에서 약관을 선택하세요.</p>}
        </div>
      </Card>
    </div>
  );
}
