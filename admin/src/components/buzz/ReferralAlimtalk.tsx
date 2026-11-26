"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useBuzz } from "@/components/buzz/theme";

/** 핸드폰 자동 하이픈 010-0000-0000 */
function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length < 11) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/**
 * 추천링크 알림톡 발송 (docs/38) — 핸드폰번호 입력 → 내 추천링크를 카카오 알림톡으로 발송.
 * 문구는 본사 [시스템설정]-[알림톡설정] [추천링크 발송] 탭. BE: POST /api/buzz/referral/alimtalk
 */
export default function ReferralAlimtalk({ className = "" }: { className?: string }) {
  const { theme } = useBuzz();
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const d = phone.replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(d)) { setMsg({ ok: false, text: "핸드폰번호를 정확히 입력해 주세요." }); return; }
    setSending(true); setMsg(null);
    const r = await apiPost<{ message?: string }>("/api/buzz/referral/alimtalk", { phone: d });
    setSending(false);
    const text = r.data?.message ?? r.message ?? (r.ok ? "발송했습니다." : "발송에 실패했습니다.");
    setMsg({ ok: r.ok, text });
    if (r.ok) setPhone("");
  }

  return (
    <form onSubmit={send} className={className}>
      <p className={`mb-1 text-xs font-semibold ${theme.fieldLabel}`}>알림톡으로 추천링크 보내기</p>
      <div className="flex gap-2">
        <input value={phone} inputMode="numeric" onChange={(e) => { setPhone(fmtPhone(e.target.value)); setMsg(null); }}
          placeholder="받는 분 핸드폰번호 (010-0000-0000)"
          className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-slate-400 ${theme.input}`} />
        <button type="submit" disabled={sending}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-60 ${theme.primaryBtn}`}>
          {sending ? "발송 중…" : "💬 알림톡 발송"}
        </button>
      </div>
      {msg && <p className={`mt-1.5 text-xs font-semibold ${msg.ok ? theme.accent : "text-red-500"}`}>{msg.text}</p>}
    </form>
  );
}
