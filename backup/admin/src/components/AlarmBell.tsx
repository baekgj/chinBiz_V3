"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPost } from "@/lib/api";

type Item = { id: number; processCode: string; message: string; read: boolean; createdAt: string | null };

function relTime(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return "방금 전";
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)}일 전`;
  return iso.slice(0, 10);
}

/**
 * admin 우측 상단 알람 벨 — 미확인 수 배지 + 팝다운 목록. (docs/17)
 * 팝다운을 열면 미확인 알람을 확인완료(read) 처리하고 배지를 0으로 만든다.
 * tone: 아이콘 색상 (dark=밝은 회색 / light=진회색). 팝다운 카드는 공통 화이트.
 */
export default function AlarmBell({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const load = useCallback(() => {
    apiGet<{ unread: number; items: Item[] }>("/api/my/alarms").then((r) => {
      if (r.ok && r.data) { setUnread(r.data.unread); setItems(r.data.items); }
    }).catch(() => { /* BE 미연결 등 네트워크 실패는 무시(폴링 다음 회차 재시도) */ });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // 1분마다 갱신
    return () => clearInterval(t);
  }, [load]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try { await apiPost("/api/my/alarms/read", {}); } catch { /* 네트워크 실패 무시 */ }
      setUnread(0);
      setItems((arr) => arr.map((a) => ({ ...a, read: true })));
    }
  }

  const iconColor = tone === "light"
    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    : "text-slate-300 hover:bg-white/10 hover:text-white";

  return (
    <div className="relative">
      <button onClick={toggle} className={`relative grid h-9 w-9 place-items-center rounded-lg ${iconColor}`} aria-label="알림">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          {/* body 포탈 → 뷰포트 기준. 모바일: 화면 가운데(좌우 여백 균등) / 데스크톱: 우측 상단(벨 아래) */}
          <div className="fixed left-3 right-3 top-16 z-[61] mx-auto max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-4 sm:mx-0 sm:w-80 sm:max-w-none">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-black text-slate-900">알림</span>
              <span className="text-xs text-slate-400">{items.length}건</span>
            </div>
            <ul className="max-h-[70vh] overflow-y-auto sm:max-h-96">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-slate-400">알림이 없습니다.</li>
              ) : (
                items.map((a) => (
                  <li key={a.id} className={`border-b border-slate-50 px-4 py-3 ${a.read ? "" : "bg-amber-50/60"}`}>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{a.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{relTime(a.createdAt)}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
