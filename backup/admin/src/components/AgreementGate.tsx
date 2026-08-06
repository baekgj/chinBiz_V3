"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Term = { code: string; title: string; content: string | null };

function looksHtml(s: string) { return /<\/?[a-z][\s\S]*>/i.test(s); }

/**
 * 약관 동의 게이트 — 센터/본부 담당자 최초 로그인 시 해당 이용약관을 창으로 띄우고,
 * [동의하기] 체크 후 동의하면 로그인ID·IP·동의시간·role 을 term_agreement 에 저장.
 * 이미 동의한 경우 아무것도 렌더하지 않음.
 */
export default function AgreementGate({ code, fallbackTitle }: { code: string; fallbackTitle: string }) {
  const [agreed, setAgreed] = useState<boolean | null>(null); // null=확인중
  const [term, setTerm] = useState<Term | null>(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ agreed: boolean }>(`/api/my/agreement?code=${code}`).then((r) => {
      if (r.ok && r.data) {
        setAgreed(r.data.agreed);
        if (!r.data.agreed) apiGet<Term>(`/api/public/terms/${code}`).then((t) => { if (t.ok && t.data) setTerm(t.data); });
      } else {
        setAgreed(true); // 조회 실패 시 게이트로 admin 차단하지 않음
      }
    });
  }, [code]);

  async function submit() {
    setErr(null); setSaving(true);
    const r = await apiPost<{ agreed: boolean; message: string }>("/api/my/agreement", { code });
    setSaving(false);
    if (r.ok) setAgreed(true);
    else setErr(r.message || "동의 처리 중 오류가 발생했습니다.");
  }

  if (agreed !== false) return null;

  const title = term?.title || fallbackTitle;
  const content = term?.content || "";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-black text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">서비스 이용을 위해 아래 약관에 동의해 주세요. (최초 1회)</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!content ? (
            <p className="text-sm text-slate-500">등록된 약관 내용이 없습니다.</p>
          ) : looksHtml(content) ? (
            <div className="rte-content text-sm leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{content}</div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="h-4 w-4" />
            위 이용약관을 확인하였으며 이에 동의합니다.
          </label>
          {err && <p className="mt-2 text-sm font-semibold text-red-500">{err}</p>}
          <button onClick={submit} disabled={!checked || saving}
            className="mt-3 w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
            {saving ? "처리 중…" : "동의하고 시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
