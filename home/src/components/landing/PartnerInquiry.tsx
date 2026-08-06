"use client";

import Link from "next/link";
import { useState } from "react";

/* STRATEGIC INQUIRY — 단계 카드 클릭 시 파트너사 입점문의(/partner-apply)로 이동 (선택 단계 전달) */
const STAGES = [
  { key: "research", label: "아직 리서치 단계입니다", desc: "버즈마케팅이 우리 상품에 맞는지 알아보는 중" },
  { key: "planning", label: "구체적인 계획을 세우고 있습니다", desc: "판로 확대 방안을 검토·설계 중" },
  { key: "ready", label: "즉시 시작할 수 있습니다", desc: "상품·물량 준비 완료, 바로 영업망 필요" },
  { key: "active", label: "이미 영업 활동 중입니다", desc: "기존 영업을 버즈 네트워크로 확장하고 싶음" },
];

export default function PartnerInquiry() {
  const [sel, setSel] = useState<string | null>(null);

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
          <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-relaxed text-forest-100/75 sm:whitespace-nowrap">
            현재 단계를 선택하시면 상황에 맞는 입점 프로세스를 전담 컨설턴트가 1:1로 안내해 드립니다.
          </p>

          {/* 단계 선택 → 파트너사 입점문의 화면으로 이동 (선택 상태 표시) */}
          <div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-2">
            {STAGES.map((s) => {
              const on = sel === s.key;
              return (
                <Link
                  key={s.key}
                  href={`/partner-apply?stage=${s.key}`}
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
                </Link>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs text-forest-100/50">단계를 선택하시면 입점 제안 신청서로 이동합니다.</p>
        </div>
      </div>
    </section>
  );
}
