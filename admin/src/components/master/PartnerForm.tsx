"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { formatBiz, formatPhone } from "@/lib/format";

const ID_RE = /^[a-zA-Z0-9]{4,20}$/;

export type PartnerData = {
  id?: number;
  partnerId?: string;
  companyName?: string;
  businessNumber?: string;
  ceoName?: string;
  companyPhone?: string;
  zipcode?: string;
  address?: string;
  addressDetail?: string;
  managerName?: string;
  managerPhone?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
};

type Form = Required<Omit<PartnerData, "id">> & { password: string };

function loadDaumPostcode(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as { daum?: { Postcode: unknown } };
    if (w.daum?.Postcode) return resolve();
    const id = "daum-postcode-script";
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.body.appendChild(s);
  });
}

const inputCls =
  "w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-brand-500";

function Field({ label, children, required, error, hint }: {
  label: string; children: React.ReactNode; required?: boolean; error?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400">
        {label}{required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p>
        : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function PartnerForm({ mode, initial }: { mode: "new" | "edit"; initial?: PartnerData }) {
  const router = useRouter();
  const [f, setF] = useState<Form>({
    partnerId: initial?.partnerId ?? "",
    password: "",
    companyName: initial?.companyName ?? "",
    businessNumber: initial?.businessNumber ?? "",
    ceoName: initial?.ceoName ?? "",
    companyPhone: initial?.companyPhone ?? "",
    zipcode: initial?.zipcode ?? "",
    address: initial?.address ?? "",
    addressDetail: initial?.addressDetail ?? "",
    managerName: initial?.managerName ?? "",
    managerPhone: initial?.managerPhone ?? "",
    email: initial?.email ?? "",
    bankName: initial?.bankName ?? "",
    accountNumber: initial?.accountNumber ?? "",
    accountHolder: initial?.accountHolder ?? "",
  });
  const [idStatus, setIdStatus] = useState<"idle" | "checking" | "ok" | "dup">(mode === "edit" ? "ok" : "idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof Form) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    if (k === "partnerId") setIdStatus("idle");
  };

  async function checkId() {
    if (!ID_RE.test(f.partnerId)) {
      setErrors((e) => ({ ...e, partnerId: "아이디는 영문/숫자 4~20자" }));
      return;
    }
    setErrors((e) => ({ ...e, partnerId: "" }));
    setIdStatus("checking");
    const res = await apiGet<{ available: boolean }>(`/api/partners/check-id?loginId=${encodeURIComponent(f.partnerId)}`);
    setIdStatus(res.data?.available ? "ok" : "dup");
  }

  async function openPostcode() {
    try { await loadDaumPostcode(); } catch { setNotice("우편번호 서비스를 불러오지 못했습니다."); return; }
    const w = window as unknown as {
      daum: { Postcode: new (o: { oncomplete: (d: { zonecode: string; roadAddress: string; jibunAddress: string }) => void }) => { open: () => void } };
    };
    new w.daum.Postcode({
      oncomplete: (d) => setF((p) => ({ ...p, zipcode: d.zonecode, address: d.roadAddress || d.jibunAddress })),
    }).open();
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!ID_RE.test(f.partnerId)) e.partnerId = "아이디는 영문/숫자 4~20자";
    else if (mode === "new" && idStatus !== "ok") e.partnerId = "아이디 중복확인을 해주세요.";
    if (mode === "new") {
      if (f.password.length < 10) e.password = "비밀번호는 10자 이상";
    } else if (f.password && f.password.length < 10) {
      e.password = "비밀번호는 10자 이상";
    }
    if (!f.companyName.trim()) e.companyName = "상호명을 입력해 주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!validate()) return;
    setSubmitting(true);
    const payload = { ...f };
    const res = mode === "new"
      ? await apiPost(`/api/partners`, payload)
      : await apiPut(`/api/partners/${initial?.id}`, payload);
    setSubmitting(false);
    if (res.ok) {
      router.push("/master/partners");
    } else if (res.status === 409) {
      setIdStatus("dup");
      setNotice(res.message ?? "이미 사용 중인 아이디입니다.");
    } else {
      setNotice(res.message ?? "저장에 실패했습니다.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 계정 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-black text-white">계정 정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="파트너사 아이디" required error={errors.partnerId}
            hint={mode === "new" ? "영문/숫자 4~20자, 중복확인 필요" : "수정 불가"}>
            <div className="flex gap-2">
              <input className={inputCls} value={f.partnerId} disabled={mode === "edit"}
                onChange={(e) => set("partnerId")(e.target.value)} placeholder="partner_login_id" />
              {mode === "new" && (
                <button type="button" onClick={checkId} disabled={idStatus === "checking"}
                  className="shrink-0 rounded-lg border border-brand-500 px-3 text-xs font-bold text-brand-400 hover:bg-brand-600/15 disabled:opacity-60">
                  {idStatus === "checking" ? "확인중" : "중복확인"}
                </button>
              )}
            </div>
            {mode === "new" && idStatus === "ok" && <p className="mt-1 text-xs text-pos">사용 가능한 아이디입니다.</p>}
            {mode === "new" && idStatus === "dup" && <p className="mt-1 text-xs text-danger">이미 사용 중인 아이디입니다.</p>}
          </Field>
          <Field label="비밀번호" required={mode === "new"} error={errors.password}
            hint={mode === "edit" ? "변경 시에만 입력 (10자 이상)" : "10자 이상"}>
            <input type="password" className={inputCls} value={f.password}
              onChange={(e) => set("password")(e.target.value)} placeholder={mode === "edit" ? "변경 시 입력" : "비밀번호"} />
          </Field>
        </div>
      </section>

      {/* 회사 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-black text-white">회사 정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="상호명" required error={errors.companyName}>
            <input className={inputCls} value={f.companyName} onChange={(e) => set("companyName")(e.target.value)} placeholder="(주)삼화정공사" />
          </Field>
          <Field label="사업자등록번호">
            <input className={inputCls} value={f.businessNumber} inputMode="numeric" onChange={(e) => set("businessNumber")(formatBiz(e.target.value))} placeholder="123-45-67890" />
          </Field>
          <Field label="대표자명">
            <input className={inputCls} value={f.ceoName} onChange={(e) => set("ceoName")(e.target.value)} placeholder="대표자" />
          </Field>
          <Field label="회사 전화번호">
            <input className={inputCls} value={f.companyPhone} inputMode="numeric" onChange={(e) => set("companyPhone")(formatPhone(e.target.value))} placeholder="02-1234-5678" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="사업자 주소">
              <div className="flex gap-2">
                <input className={`${inputCls} w-32`} value={f.zipcode} readOnly placeholder="우편번호" />
                <button type="button" onClick={openPostcode}
                  className="shrink-0 rounded-lg border border-brand-500 px-3 text-xs font-bold text-brand-400 hover:bg-brand-600/15">우편번호 검색</button>
              </div>
              <input className={`${inputCls} mt-2`} value={f.address} readOnly placeholder="기본주소" />
              <input className={`${inputCls} mt-2`} value={f.addressDetail} onChange={(e) => set("addressDetail")(e.target.value)} placeholder="상세주소" />
            </Field>
          </div>
        </div>
      </section>

      {/* 담당자 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-black text-white">담당자 정보</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="담당자명"><input className={inputCls} value={f.managerName} onChange={(e) => set("managerName")(e.target.value)} placeholder="담당자" /></Field>
          <Field label="담당자 연락처"><input className={inputCls} value={f.managerPhone} inputMode="numeric" onChange={(e) => set("managerPhone")(formatPhone(e.target.value))} placeholder="010-1234-5678" /></Field>
          <Field label="이메일"><input className={inputCls} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="contact@corp.com" /></Field>
        </div>
      </section>

      {/* 정산 계좌 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-black text-white">정산 계좌</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="은행명"><input className={inputCls} value={f.bankName} onChange={(e) => set("bankName")(e.target.value)} placeholder="신한은행" /></Field>
          <Field label="계좌번호"><input className={inputCls} value={f.accountNumber} onChange={(e) => set("accountNumber")(e.target.value)} placeholder="110-123-456789" /></Field>
          <Field label="예금주"><input className={inputCls} value={f.accountHolder} onChange={(e) => set("accountHolder")(e.target.value)} placeholder="예금주" /></Field>
        </div>
      </section>

      {notice && <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{notice}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/master/partners")}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-navy-800">취소</button>
        <button type="submit" disabled={submitting}
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
          {submitting ? "저장 중…" : mode === "new" ? "파트너사 등록" : "변경 저장"}
        </button>
      </div>
    </form>
  );
}
