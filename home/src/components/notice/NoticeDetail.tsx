"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Ref = { id: number; title: string; targetLabel: string; createdAt: string | null };
type Detail = Ref & { content: string | null; prev?: Ref; next?: Ref };

const ymd = (iso: string | null) => (iso ? iso.slice(0, 10).replace(/-/g, ".") : "");

/** HOME 공지사항 상세 — 본문(본사 admin 에디터 HTML) + 이전/다음 글 + 목록 */
export default function NoticeDetail({ id }: { id: string }) {
  const [n, setN] = useState<Detail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    apiGet<Detail>(`/api/public/notices/${id}`).then((r) => {
      if (r.ok && r.data) setN(r.data); else setMissing(true);
    });
  }, [id]);

  if (missing) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted">공지사항을 찾을 수 없습니다.</p>
        <Link href="/notices" className="mt-6 inline-block rounded-lg bg-forest-800 px-5 py-2.5 text-sm font-bold text-white">목록으로</Link>
      </div>
    );
  }
  if (!n) return <p className="py-20 text-center text-sm text-muted">불러오는 중…</p>;

  const nav: [string, Ref | undefined][] = [["다음글", n.next], ["이전글", n.prev]];

  return (
    <article>
      <Link href="/notices" className="text-sm font-semibold text-forest-700 hover:underline">← 공지사항</Link>
      <header className="mt-4 border-b-2 border-forest-800 pb-5">
        <h1 className="text-xl font-black leading-snug text-ink sm:text-2xl">
          {n.targetLabel && <span className="mr-2 text-gold-600">[{n.targetLabel}]</span>}
          {n.title}
        </h1>
        <p className="mt-2 text-sm text-muted">{ymd(n.createdAt)}</p>
      </header>

      <div className="notice-content min-h-[200px] break-words border-b border-line py-8 text-[15px] leading-relaxed text-ink"
        dangerouslySetInnerHTML={{ __html: n.content || "" }} />

      <nav className="divide-y divide-line border-b border-line text-sm">
        {nav.map(([label, ref]) => (
          <div key={label} className="flex items-center gap-4 px-2 py-3">
            <span className="w-12 shrink-0 font-semibold text-muted">{label}</span>
            {ref ? (
              <Link href={`/notices/${ref.id}`} className="min-w-0 flex-1 truncate text-ink hover:text-forest-700">{ref.title}</Link>
            ) : (
              <span className="text-muted">없음</span>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-8 text-center">
        <Link href="/notices" className="inline-block rounded-lg bg-forest-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-forest-700">목록으로</Link>
      </div>
    </article>
  );
}
