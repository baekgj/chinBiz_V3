"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Field from "@/components/auth/Field";
import { apiPost } from "@/lib/api";

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20";

export default function FindPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [f, setF] = useState({ userId: "", email: "", phone: "" });
  const [pw, setPw] = useState({ newPassword: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function verify(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!f.userId || !f.email) { setNotice("아이디와 이메일을 입력해 주세요."); return; }
    setSubmitting(true);
    const res = await apiPost<{ verified: boolean }>("/api/auth/verify-account", f);
    setSubmitting(false);
    if (res.ok && res.data?.verified) { setStep(2); setNotice(null); }
    else setNotice("일치하는 계정 정보가 없습니다. 아이디·이메일·휴대폰을 확인해 주세요.");
  }

  async function reset(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (pw.newPassword.length < 4) { setNotice("새 비밀번호는 4자 이상 입력해 주세요."); return; }
    if (pw.newPassword !== pw.confirm) { setNotice("비밀번호 확인이 일치하지 않습니다."); return; }
    setSubmitting(true);
    const res = await apiPost<{ message: string }>("/api/auth/reset-password", { ...f, newPassword: pw.newPassword });
    setSubmitting(false);
    if (res.ok) setStep(3);
    else setNotice(res.message ?? "비밀번호 재설정에 실패했습니다.");
  }

  return (
    <AuthLayout
      eyebrow="RESET PASSWORD"
      title="비밀번호 찾기"
      subtitle={step === 3 ? "비밀번호가 재설정되었습니다." : "가입 시 등록한 정보로 본인 확인 후 새 비밀번호를 설정합니다."}
    >
      {/* 단계 표시 */}
      {step !== 3 && (
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold">
          <span className={step === 1 ? "text-forest-600" : "text-muted"}>① 본인 확인</span>
          <span className="text-line">›</span>
          <span className={step === 2 ? "text-forest-600" : "text-muted"}>② 새 비밀번호</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={verify} className="space-y-5" noValidate>
          <Field label="아이디" name="userId" value={f.userId} onChange={set("userId")} placeholder="아이디 입력" required />
          <Field label="이메일" name="email" value={f.email} onChange={set("email")} placeholder="가입 시 이메일" required />
          <Field label="휴대폰번호 (선택)" name="phone" value={f.phone} onChange={set("phone")} placeholder="010-1234-5678" hint="가입 시 휴대폰을 등록했다면 함께 확인합니다." />
          {notice && <div className="rounded-xl border border-danger/40 bg-red-50 px-4 py-3 text-sm text-danger">{notice}</div>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-forest-600 px-6 py-3 font-bold text-white hover:bg-forest-700 disabled:opacity-60">
            {submitting ? "확인 중…" : "본인 확인"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={reset} className="space-y-5" noValidate>
          <div className="rounded-xl border border-forest-300/50 bg-forest-50 px-4 py-3 text-sm text-forest-700">
            <b>{f.userId}</b> 님, 본인 확인이 완료되었습니다. 새 비밀번호를 입력해 주세요.
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">새 비밀번호</span>
            <input type="password" className={inputCls} value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} placeholder="새 비밀번호 (4자 이상)" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-ink-soft">새 비밀번호 확인</span>
            <input type="password" className={inputCls} value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="새 비밀번호 다시 입력" />
          </label>
          {notice && <div className="rounded-xl border border-danger/40 bg-red-50 px-4 py-3 text-sm text-danger">{notice}</div>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-forest-600 px-6 py-3 font-bold text-white hover:bg-forest-700 disabled:opacity-60">
            {submitting ? "재설정 중…" : "비밀번호 재설정"}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-forest-300/50 bg-forest-50 px-4 py-4 text-center text-sm text-forest-700">
            ✓ 비밀번호가 재설정되었습니다.<br />새 비밀번호로 로그인해 주세요.
          </div>
          <button onClick={() => router.push("/login")} className="w-full rounded-xl bg-forest-600 px-6 py-3 font-bold text-white hover:bg-forest-700">
            로그인하러 가기
          </button>
        </div>
      )}

      {step !== 3 && (
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-bold text-forest-600 hover:underline">← 로그인으로 돌아가기</Link>
        </p>
      )}
    </AuthLayout>
  );
}
