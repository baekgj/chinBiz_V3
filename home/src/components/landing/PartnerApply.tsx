"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Cat = { id: number; name: string };

const inputCls = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-forest-400 placeholder:text-muted";
const labelCls = "text-xs font-semibold text-ink-soft";

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}{req && <span className="ml-0.5 text-red-500">*</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default function PartnerApply() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [f, setF] = useState({
    companyName: "", bizNo: "", ceoName: "", contactName: "", phone: "", email: "", website: "",
    category: "", productName: "", target: "", priceRate: "", features: "",
  });
  const [fileName, setFileName] = useState("");
  const [agree, setAgree] = useState(false);
  const [showAgree, setShowAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { apiGet<Cat[]>("/api/public/categories").then((r) => { if (r.data) setCats(r.data); }); }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit() {
    setErr(null);
    if (!f.companyName.trim() || !f.bizNo.trim() || !f.ceoName.trim() || !f.contactName.trim() || !f.phone.trim() || !f.email.trim()) {
      setErr("1번 항목의 필수 정보를 모두 입력해 주세요."); return;
    }
    if (!f.category || !f.productName.trim() || !f.target.trim() || !f.features.trim()) {
      setErr("2번 항목의 필수 정보를 모두 입력해 주세요."); return;
    }
    if (!agree) { setErr("개인정보 수집·이용에 동의해 주세요."); return; }

    setSending(true);
    const message =
      `[제안상품/서비스] ${f.productName}\n` +
      `[제안 카테고리] ${f.category}\n` +
      `[주요 타겟 고객] ${f.target}\n` +
      `[희망 공급가/수당률] ${f.priceRate || "-"}\n` +
      `[사업자등록번호] ${f.bizNo} · 대표 ${f.ceoName}\n` +
      `[회사/상품 웹사이트] ${f.website || "-"}\n` +
      `[첨부파일] ${fileName || "미첨부"}\n\n` +
      `[상품 주요 특징]\n${f.features}`;
    const r = await apiPost("/api/public/partner-inquiry", {
      companyName: f.companyName, contactName: f.contactName, phone: f.phone, email: f.email, stage: f.category, message,
    });
    setSending(false);
    if (r.ok) setDone(true);
    else setErr(r.message || "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-forest-200 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-black text-forest-700">입점 제안이 정상 접수되었습니다 ✓</p>
        <p className="mt-2 text-sm text-muted">담당 MD가 검토 후 <b className="text-ink">영업일 기준 3~5일</b> 이내 연락드립니다. 감사합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. 기업 및 담당자 기본 정보 */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-black text-ink"><span className="text-gold-500">🏢</span> 1. 기업 및 담당자 기본 정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="회사명 (상호)" req><input className={inputCls} value={f.companyName} onChange={set("companyName")} placeholder="회사명" /></Field>
          <Field label="사업자등록번호" req><input className={inputCls} value={f.bizNo} onChange={set("bizNo")} placeholder="000-00-00000" /></Field>
          <Field label="대표자명" req><input className={inputCls} value={f.ceoName} onChange={set("ceoName")} placeholder="대표자명" /></Field>
          <Field label="담당자 성명/직급" req><input className={inputCls} value={f.contactName} onChange={set("contactName")} placeholder="예: 김철수 팀장" /></Field>
          <Field label="담당자 연락처" req><input className={inputCls} value={f.phone} onChange={set("phone")} placeholder="010-0000-0000" /></Field>
          <Field label="담당자 이메일" req><input className={inputCls} value={f.email} onChange={set("email")} placeholder="partner@company.com" /></Field>
          <div className="sm:col-span-2"><Field label="회사/상품 웹사이트"><input className={inputCls} value={f.website} onChange={set("website")} placeholder="https://" /></Field></div>
        </div>
      </section>

      {/* 2. 제안 상품 정보 */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-black text-ink"><span className="text-gold-500">📦</span> 2. 제안 상품 정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="제안 카테고리" req>
            <select className={inputCls} value={f.category} onChange={set("category")}>
              <option value="">선택하세요</option>
              {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="제안 상품/서비스명" req><input className={inputCls} value={f.productName} onChange={set("productName")} placeholder="예: B2B 약사 맞춤 소분건기식 기업구독" /></Field>
          <Field label="주요 타겟 고객" req><input className={inputCls} value={f.target} onChange={set("target")} placeholder="예: 50인 이상 일반 기업체 HR/복지팀" /></Field>
          <Field label="희망 공급가/수당률"><input className={inputCls} value={f.priceRate} onChange={set("priceRate")} placeholder="예: 소비자가 대비 30% 영업 수당 배정" /></Field>
          <div className="sm:col-span-2"><Field label="상품 주요 특징" req><textarea className={`${inputCls} min-h-[110px] resize-y`} value={f.features} onChange={set("features")} placeholder="간단한 제품 특장점 및 셀링 포인트 작성" /></Field></div>
          <div className="sm:col-span-2">
            <span className={labelCls}>파일 첨부 (회사소개서 및 상품 제안서)</span>
            <button type="button" onClick={() => fileRef.current?.click()} className="mt-1.5 flex w-full items-center gap-3 rounded-xl border border-dashed border-line bg-surface-2 px-4 py-4 text-left hover:border-forest-300">
              <span className="text-forest-500">⬆</span>
              <span>
                <span className="block text-sm font-bold text-ink">{fileName || "파일을 선택하세요"}</span>
                <span className="block text-xs text-muted">최대 20MB / pdf, zip, pptx 가능</span>
              </span>
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.zip,.pptx" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          </div>
        </div>
      </section>

      {/* 동의 + 제출 */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <label className="flex items-start gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-forest-700" />
          <span>[필수] 개인정보 수집·이용에 동의합니다.
            <button type="button" onClick={() => setShowAgree(true)} className="ml-1 font-bold text-forest-600 underline">동의서 보기</button>
          </span>
        </label>
        {err && <p className="mt-3 text-sm font-semibold text-red-500">{err}</p>}
        <button type="button" onClick={submit} disabled={sending} className="mt-4 w-full rounded-xl bg-forest-800 px-6 py-3.5 text-sm font-bold text-white hover:bg-forest-700 disabled:opacity-60">
          {sending ? "접수 중…" : "입점 제안 접수하기"}
        </button>
      </div>

      {/* 개인정보 동의서 모달 */}
      {showAgree && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowAgree(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-ink">개인정보 수집·이용 동의서 (입점 제안용)</h3>
                <p className="mt-1 text-xs text-muted">친비즈 파트너 입점 제안 접수를 위한 개인정보 수집 및 이용 안내</p>
              </div>
              <button onClick={() => setShowAgree(false)} className="text-muted hover:text-ink">✕</button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["수집 목적", "파트너 입점 제안 검토, 상담 연락, 서비스 제공을 위한 계약 체결 및 파트너 관리"],
                ["수집 항목", "회사명, 사업자등록번호, 대표자명, 담당자 성명/직급/연락처/이메일, 제안 상품 정보, 첨부 제안서 내 개인정보"],
                ["보유 및 이용 기간", "입점 제안 검토 완료 후 1년 간 보관 후 파기 (단, 계약 체결 시 계약 종료 시까지 보관)"],
                ["동의 거부 권리", "귀하는 동의를 거부할 권리가 있으나, 필수 항목 미동의 시 입점 제안 접수 및 상담이 제한될 수 있습니다."],
              ].map(([t, d]) => (
                <div key={t}><p className="font-bold text-ink">{t}</p><p className="mt-0.5 text-ink-soft">{d}</p></div>
              ))}
            </div>
            <button onClick={() => { setAgree(true); setShowAgree(false); }} className="mt-5 w-full rounded-xl bg-forest-800 px-6 py-3 text-sm font-bold text-white hover:bg-forest-700">확인 (동의)</button>
          </div>
        </div>
      )}
    </div>
  );
}
