"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Term = { code: string; title: string; content: string | null; updatedAt?: string | null };

/** 내용이 HTML 태그를 포함하는지 판별 (아니면 평문 취급) */
function looksHtml(s: string) {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

/** 약관 본문 렌더 (공개 조회). variant page=전체페이지 / modal=모달 내부 */
export default function TermView({ code, variant = "page" }: { code: string; variant?: "page" | "modal" }) {
  const [t, setT] = useState<Term | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    apiGet<Term>(`/api/public/terms/${code}`).then((r) => { if (r.ok && r.data) setT(r.data); else setErr(true); });
  }, [code]);

  if (err) return <p className="text-sm text-muted">약관을 불러올 수 없습니다.</p>;
  if (!t) return <p className="text-sm text-muted">불러오는 중…</p>;

  const gap = variant === "page" ? "mt-6" : "";

  return (
    <div>
      {variant === "page" && <h1 className="text-2xl font-black text-ink sm:text-3xl">{t.title}</h1>}
      {!t.content ? (
        <p className={`${gap} text-sm text-muted`}>등록된 내용이 없습니다.</p>
      ) : looksHtml(t.content) ? (
        <div className={`term-content ${gap} text-sm leading-relaxed text-ink-soft`} dangerouslySetInnerHTML={{ __html: t.content }} />
      ) : (
        <div className={`${gap} whitespace-pre-wrap text-sm leading-relaxed text-ink-soft`}>{t.content}</div>
      )}
    </div>
  );
}
