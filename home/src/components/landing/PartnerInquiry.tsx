"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";

/* 참조: chinbiz.base44.app — STRATEGIC INQUIRY + DEDICATED CONSULTANT */
const STAGES = [
  { key: "research", label: "아직 리서치 단계입니다", desc: "버즈마케팅이 우리 상품에 맞는지 알아보는 중" },
  { key: "planning", label: "구체적인 계획을 세우고 있습니다", desc: "판로 확대 방안을 검토·설계 중" },
  { key: "ready", label: "즉시 시작할 수 있습니다", desc: "상품·물량 준비 완료, 바로 영업망 필요" },
  { key: "active", label: "이미 영업 활동 중입니다", desc: "기존 영업을 버즈 네트워크로 확장하고 싶음" },
];

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-forest-100/40 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/40";

export default function PartnerInquiry() {
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState({ companyName: "", contactName: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setErr(null);
    if (!form.companyName.trim() || !form.contactName.trim() || !form.phone.trim()) {
      setErr("회사명·담당자·연락처는 필수 입력입니다.");
      return;
    }
    setSending(true);
    const stageLabel = STAGES.find((s) => s.key === sel)?.label ?? "";
    const r = await apiPost("/api/public/partner-inquiry", { ...form, stage: stageLabel });
    setSending(false);
    if (r.ok) setDone(true);
    else setErr(r.message || "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  return (
    <section id="inquiry" className="mx-auto max-w-6xl px-5 pb-20 sm:pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-forest-950 px-6 py-12 sm:px-14 sm:py-16">
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="animate-blob absolute -left-16 top-0 h-64 w-64 rounded-full bg-forest-500/20 blur-3xl" />

        <div className="relative">
          <p className="text-center text-xs font-bold tracking-widest text-gold-300">STRATEGIC INQUIRY</p>
          <h2 className="mt-3 text-center text-2xl font-black leading-snug text-white sm:text-3xl">
            당신의 비즈니스는<br className="sm:hidden" /> 어떤 단계에 있습니까?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-forest-100/75">
            현재 단계를 선택하시면 상황에 맞는 입점 프로세스를 전담 컨설턴트가 1:1로 안내해 드립니다.
          </p>

          {/* 단계 선택 */}
          <div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-2">
            {STAGES.map((s) => {
              const on = sel === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSel(s.key)}
                  aria-pressed={on}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                    on
                      ? "border-gold-400 bg-gold-400/15 ring-1 ring-gold-400/40"
                      : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-black ${
                      on ? "border-gold-400 bg-gold-400 text-forest-900" : "border-white/30 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span>
                    <span className={`block font-bold ${on ? "text-white" : "text-forest-50"}`}>{s.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-forest-100/60">{s.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* DEDICATED CONSULTANT — 단계 선택 시 노출 */}
          <div
            className={`mx-auto mt-6 max-w-3xl overflow-hidden transition-all duration-500 ${
              sel ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="rounded-2xl border border-gold-400/30 bg-gradient-to-br from-forest-800 to-forest-900 p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-400 text-forest-900">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                    <path d="M12 13a4 4 0 100-8 4 4 0 000 8zM5 21a7 7 0 0114 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-bold tracking-widest text-gold-300">DEDICATED CONSULTANT</p>
                  <h3 className="mt-1 text-lg font-black text-white">전담 컨설턴트가 1:1로 안내합니다</h3>
                  <p className="mt-1 text-sm text-forest-100/75">문의 접수 후 <b className="text-gold-200">24시간 이내</b> 연락드립니다.</p>
                </div>
              </div>

              {done ? (
                <div className="mt-6 rounded-xl border border-gold-400/40 bg-gold-400/10 px-5 py-8 text-center">
                  <p className="text-lg font-black text-gold-200">입점 상담 신청이 접수되었습니다 ✓</p>
                  <p className="mt-2 text-sm text-forest-100/75">담당 컨설턴트가 24시간 이내 연락드리겠습니다. 감사합니다.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className={inputCls} placeholder="회사명 *" value={form.companyName} onChange={set("companyName")} />
                    <input className={inputCls} placeholder="담당자명 *" value={form.contactName} onChange={set("contactName")} />
                    <input className={inputCls} placeholder="연락처 *" value={form.phone} onChange={set("phone")} />
                    <input className={inputCls} placeholder="이메일" value={form.email} onChange={set("email")} />
                  </div>
                  <textarea
                    className={`${inputCls} min-h-[88px] resize-y`}
                    placeholder="상품/제안 내용을 간단히 남겨주세요."
                    value={form.message}
                    onChange={set("message")}
                  />
                  {err && <p className="text-sm font-semibold text-red-300">{err}</p>}
                  <button
                    type="button"
                    onClick={submit}
                    disabled={sending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 py-3 font-bold text-forest-900 transition-colors hover:bg-gold-300 disabled:opacity-60"
                  >
                    {sending ? "접수 중…" : "파트너사 입점 및 제안하기"} <span aria-hidden>→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
