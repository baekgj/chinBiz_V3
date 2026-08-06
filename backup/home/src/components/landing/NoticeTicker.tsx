"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Notice = { id: number; title: string; targetLabel: string; createdAt: string };

/** 상대 시간 표기 (방금 전 / N분 전 / N시간 전 / N일 전) */
function ago(iso: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "방금 전";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

/** 홈 공지사항 롤링 티커 — notice 테이블 최근 5건 (docs/home01.jpg 스타일) */
export default function NoticeTicker() {
  const [rows, setRows] = useState<Notice[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    apiGet<Notice[]>("/api/public/notices").then((r) => { if (r.ok && r.data) setRows(r.data); });
  }, []);

  useEffect(() => {
    if (rows.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % rows.length), 3200);
    return () => clearInterval(t);
  }, [rows.length]);

  const n = rows[idx];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="live-dot absolute inline-flex h-2.5 w-2.5 rounded-full bg-gold-400" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-400" />
      </span>
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-gold-300">공지</span>
      <div key={idx} className="min-w-0 flex-1 animate-float-up">
        {n ? (
          <p className="truncate text-sm text-white">
            {n.targetLabel && <span className="mr-1.5 font-semibold text-gold-200">[{n.targetLabel}]</span>}
            {n.title}
          </p>
        ) : (
          <p className="truncate text-sm text-forest-200/70">등록된 공지사항이 없습니다.</p>
        )}
      </div>
      {n && <span className="shrink-0 text-xs text-forest-200/70">{ago(n.createdAt)}</span>}
    </div>
  );
}
