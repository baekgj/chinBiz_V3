"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { openDaumPostcode } from "@/lib/postcode";
import { useBuzz } from "@/components/buzz/theme";

type Member = Record<string, unknown> & { id?: number };

// ★ 모듈 스코프 컴포넌트 (렌더마다 재생성 X → 입력 포커스 유지)
function Field({ label, labelCls, children }: { label: string; labelCls: string; children: React.ReactNode }) {
  return <label className="block"><span className={`text-xs font-semibold ${labelCls}`}>{label}</span><div className="mt-1">{children}</div></label>;
}

/** 버즈 네트워크 회원 등록/수정 (역할 BUZZ 고정, 추천인 자동 저장) */
export default function MemberForm({ mode, initial }: { mode: "new" | "edit"; initial?: Member }) {
  const router = useRouter();
  const { theme } = useBuzz();
  const g = (k: string) => (initial?.[k] != null ? String(initial[k]) : "");

  const [f, setF] = useState({
    userId: g("userId"), password: "", name: g("name"), phone: g("phone"), email: g("email"),
    zipcode: g("zipcode"), address: g("address"), addressDetail: g("addressDetail"),
    bankName: g("bankName"), accountNumber: g("accountNumber"), accountHolder: g("accountHolder"),
  });
  const [idChecked, setIdChecked] = useState<null | boolean>(mode === "edit" ? true : null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    if (k === "userId") setIdChecked(null);
  };

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-slate-400 ${theme.input}`;
  const lc = theme.fieldLabel;

  async function checkId() {
    if (!f.userId.trim()) { setNotice("아이디를 입력해 주세요."); return; }
    if (!/^[A-Za-z0-9]{4,20}$/.test(f.userId.trim())) {
      setIdChecked(false);
      setNotice("아이디는 영문/숫자만 4~20자로 입력해 주세요.");
      return;
    }
    const r = await apiGet<{ available: boolean }>(`/api/buzz/members/check-id?userId=${encodeURIComponent(f.userId.trim())}`);
    if (r.data) { setIdChecked(r.data.available); setNotice(r.data.available ? null : "이미 사용 중인 아이디입니다."); }
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!f.name.trim()) { setNotice("이름을 입력해 주세요."); return; }
    if (mode === "new" && !/^[A-Za-z0-9]{4,20}$/.test(f.userId.trim())) { setNotice("아이디는 영문/숫자만 4~20자로 입력해 주세요."); return; }
    if (mode === "new") {
      if (!f.password || f.password.length < 10) { setNotice("비밀번호는 10자 이상 입력해 주세요."); return; }
      if (idChecked !== true) { setNotice("아이디 중복확인을 해주세요."); return; }
    } else if (f.password && f.password.length < 10) { setNotice("비밀번호는 10자 이상이어야 합니다."); return; }

    setSaving(true);
    const res = mode === "new"
      ? await apiPost("/api/buzz/members", f)
      : await apiPut(`/api/buzz/members/${initial?.id}`, f);
    setSaving(false);
    if (res.ok) router.push("/buzz/network");
    else setNotice(res.message ?? "저장에 실패했습니다.");
  }

  const card = theme.card;

  return (
    <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
      <section className={card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>계정</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={`text-xs font-semibold ${theme.fieldLabel}`}>아이디 *</span>
            <div className="mt-1 flex gap-2">
              <input className={inputCls} value={f.userId} readOnly={mode === "edit"} autoComplete="off" onChange={(e) => set("userId")(e.target.value)} placeholder="아이디" />
              {mode === "new" && (
                <button type="button" onClick={checkId} className={`shrink-0 rounded-lg px-3 text-xs font-bold ${theme.outlineBtn}`}>중복확인</button>
              )}
            </div>
            {idChecked === true && mode === "new" && <p className="mt-1 text-xs text-emerald-500">사용 가능한 아이디입니다.</p>}
          </label>
          <Field label={mode === "new" ? "비밀번호 *" : "비밀번호 (변경 시에만)"} labelCls={lc}>
            <input type="password" name="new-password" autoComplete="new-password" className={inputCls} value={f.password} onChange={(e) => set("password")(e.target.value)} placeholder="비밀번호" />
          </Field>
        </div>
        <p className={`mt-2 text-xs ${theme.note}`}>※ 역할은 <b>버즈회원</b>으로 고정되며, 추천인은 현재 로그인 계정으로 자동 저장됩니다.</p>
      </section>

      <section className={card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>기본 정보 · 연락처</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="이름 *" labelCls={lc}><input className={inputCls} value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="이름" /></Field>
          <Field label="핸드폰번호" labelCls={lc}><input className={inputCls} value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="010-1234-5678" /></Field>
          <Field label="이메일" labelCls={lc}><input className={inputCls} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="mail@example.com" /></Field>
        </div>
        <div className="mt-4">
          <span className={`text-xs font-semibold ${theme.fieldLabel}`}>주소</span>
          <div className="mt-1 flex gap-2">
            <input className={`${inputCls} w-32`} value={f.zipcode} readOnly placeholder="우편번호" />
            <button type="button" onClick={() => openDaumPostcode((r) => setF((p) => ({ ...p, zipcode: r.zipcode, address: r.address })))}
              className={`shrink-0 rounded-lg px-3 text-xs font-bold ${theme.outlineBtn}`}>우편번호 검색</button>
          </div>
          <input className={`${inputCls} mt-2`} value={f.address} readOnly placeholder="기본주소" />
          <input className={`${inputCls} mt-2`} value={f.addressDetail} onChange={(e) => set("addressDetail")(e.target.value)} placeholder="상세주소" />
        </div>
      </section>

      <section className={card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>정산 계좌</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="은행명" labelCls={lc}><input className={inputCls} value={f.bankName} onChange={(e) => set("bankName")(e.target.value)} placeholder="은행" /></Field>
          <Field label="계좌번호" labelCls={lc}><input className={inputCls} value={f.accountNumber} onChange={(e) => set("accountNumber")(e.target.value)} placeholder="계좌번호" /></Field>
          <Field label="예금주명" labelCls={lc}><input className={inputCls} value={f.accountHolder} onChange={(e) => set("accountHolder")(e.target.value)} placeholder="예금주" /></Field>
        </div>
      </section>

      {notice && <div className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-500 ring-1 ring-red-500/30">{notice}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/buzz/network")} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${theme.cancelBtn}`}>취소</button>
        <button type="submit" disabled={saving} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${theme.primaryBtn}`}>
          {saving ? "저장 중…" : mode === "new" ? "회원 등록" : "변경 저장"}
        </button>
      </div>
    </form>
  );
}
