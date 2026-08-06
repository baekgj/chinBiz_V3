"use client";

import TermView from "@/components/site/TermView";

/** 약관 보기 모달 — 회원가입/입점신청의 [보기]/[동의서 보기]에서 사용 */
export default function TermModal({ code, title, onClose, onAgree }: { code: string; title?: string; onClose: () => void; onAgree?: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-base font-black text-ink">{title || "약관 보기"}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="닫기">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <TermView code={code} variant="modal" />
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-2">닫기</button>
          {onAgree && <button onClick={onAgree} className="rounded-xl bg-forest-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-forest-700">동의</button>}
        </div>
      </div>
    </div>
  );
}
