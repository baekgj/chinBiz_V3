"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { formatPhone } from "@/lib/format";

type Me = {
  partnerId: string; companyName: string; businessNumber?: string; ceoName?: string;
  managerName?: string; managerPhone?: string; email?: string;
  bankName?: string; accountNumber?: string; accountHolder?: string;
};

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 placeholder:text-slate-400";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </label>
  );
}

/** 파트너 내 정보 수정 (전화번호·이메일·담당자명·계좌·비밀번호) */
export default function ProfileForm() {
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [f, setF] = useState({ managerName: "", phone: "", email: "", bankName: "", accountNumber: "", accountHolder: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    apiGet<Me>("/api/partner/me").then((r) => {
      if (r.ok && r.data) {
        setMe(r.data);
        setF({
          managerName: r.data.managerName ?? "", phone: r.data.managerPhone ?? "", email: r.data.email ?? "",
          bankName: r.data.bankName ?? "", accountNumber: r.data.accountNumber ?? "", accountHolder: r.data.accountHolder ?? "", password: "",
        });
        setStatus("ok");
      } else setStatus("error");
    });
  }, []);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (f.password && f.password.length < 8) { setNotice({ type: "err", msg: "비밀번호는 8자 이상이어야 합니다." }); return; }
    setSaving(true);
    const res = await apiPut<Me>("/api/partner/me", f);
    setSaving(false);
    if (res.ok) { setNotice({ type: "ok", msg: "내 정보가 저장되었습니다." }); setF((p) => ({ ...p, password: "" })); }
    else setNotice({ type: "err", msg: res.message ?? "저장에 실패했습니다." });
  }

  if (status === "loading") return <p className="text-sm text-slate-500">불러오는 중…</p>;
  if (status === "error") return <p className="text-sm text-red-600">내 정보를 불러오지 못했습니다.</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 회사 기본 (읽기 전용) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-slate-900">회사 정보 <span className="text-xs font-medium text-slate-400">(변경 불가)</span></h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="상호명"><div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{me?.companyName}</div></Field>
          <Field label="아이디"><div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{me?.partnerId}</div></Field>
        </div>
      </section>

      {/* 담당자/연락 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-slate-900">담당자 · 연락처</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="담당자명"><input className={inputCls} value={f.managerName} onChange={(e) => set("managerName")(e.target.value)} placeholder="담당자명" /></Field>
          <Field label="전화번호"><input className={inputCls} value={f.phone} inputMode="numeric" onChange={(e) => set("phone")(formatPhone(e.target.value))} placeholder="010-1234-5678" /></Field>
          <Field label="이메일"><input className={inputCls} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="mail@corp.com" /></Field>
        </div>
      </section>

      {/* 계좌 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-slate-900">정산 계좌</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="은행명"><input className={inputCls} value={f.bankName} onChange={(e) => set("bankName")(e.target.value)} placeholder="은행" /></Field>
          <Field label="계좌번호"><input className={inputCls} value={f.accountNumber} onChange={(e) => set("accountNumber")(e.target.value)} placeholder="계좌번호" /></Field>
          <Field label="예금주"><input className={inputCls} value={f.accountHolder} onChange={(e) => set("accountHolder")(e.target.value)} placeholder="예금주" /></Field>
        </div>
      </section>

      {/* 비밀번호 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-black text-slate-900">비밀번호 변경</h3>
        <Field label="새 비밀번호" hint="변경 시에만 입력 (8자 이상)">
          <input type="password" name="new-password" autoComplete="new-password" className={`${inputCls} sm:max-w-xs`} value={f.password} onChange={(e) => set("password")(e.target.value)} placeholder="새 비밀번호" />
        </Field>
      </section>

      {notice && (
        <div className={`rounded-lg px-4 py-3 text-sm ${notice.type === "ok" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"}`}>{notice.msg}</div>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60">
          {saving ? "저장 중…" : "변경 저장"}
        </button>
      </div>
    </form>
  );
}
