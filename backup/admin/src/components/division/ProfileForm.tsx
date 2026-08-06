"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { openDaumPostcode } from "@/lib/postcode";
import { dv } from "@/components/division/DivisionUI";

type Me = { userId: string; name?: string; email?: string; phone?: string; zipcode?: string; address?: string; addressDetail?: string; bankName?: string; accountNumber?: string; accountHolder?: string; role?: string };

// ★ 모듈 스코프: 렌더마다 재생성되지 않아 입력 포커스 유지
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={`text-xs font-semibold ${dv.fieldLabel}`}>{label}</span><div className="mt-1">{children}</div></label>;
}

/** 본부 담당자 내 정보 수정 — /api/user/me */
export default function ProfileForm() {
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [f, setF] = useState({ name: "", phone: "", email: "", zipcode: "", address: "", addressDetail: "", bankName: "", accountNumber: "", accountHolder: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-violet-400/50 ${dv.input}`;

  useEffect(() => {
    apiGet<Me>("/api/user/me").then((r) => {
      if (r.ok && r.data) {
        setMe(r.data);
        setF({ name: r.data.name ?? "", phone: r.data.phone ?? "", email: r.data.email ?? "", zipcode: r.data.zipcode ?? "", address: r.data.address ?? "", addressDetail: r.data.addressDetail ?? "", bankName: r.data.bankName ?? "", accountNumber: r.data.accountNumber ?? "", accountHolder: r.data.accountHolder ?? "", password: "" });
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
    const res = await apiPut("/api/user/me", f);
    setSaving(false);
    if (res.ok) { setNotice({ type: "ok", msg: "내 정보가 저장되었습니다." }); setF((p) => ({ ...p, password: "" })); }
    else setNotice({ type: "err", msg: res.message ?? "저장에 실패했습니다." });
  }

  if (status === "loading") return <p className={`text-sm ${dv.cardSub}`}>불러오는 중…</p>;
  if (status === "error") return <p className="text-sm text-red-400">내 정보를 불러오지 못했습니다.</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className={dv.card}>
        <h3 className={`mb-3 text-sm font-black ${dv.cardHead}`}>계정 <span className={`text-xs font-medium ${dv.note}`}>(변경 불가)</span></h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="아이디"><div className={`rounded-lg border px-3 py-2 text-sm ${dv.roBox}`}>{me?.userId}</div></F>
          <F label="역할"><div className={`rounded-lg border px-3 py-2 text-sm ${dv.roBox}`}>총괄본부</div></F>
        </div>
      </section>

      <section className={dv.card}>
        <h3 className={`mb-3 text-sm font-black ${dv.cardHead}`}>기본 정보 · 연락처</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <F label="이름/담당자명"><input className={inputCls} value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="이름" /></F>
          <F label="전화번호"><input className={inputCls} value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="010-1234-5678" /></F>
          <F label="이메일"><input className={inputCls} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="mail@example.com" /></F>
        </div>
        <div className="mt-4">
          <span className={`text-xs font-semibold ${dv.fieldLabel}`}>주소</span>
          <div className="mt-1 flex gap-2">
            <input className={`${inputCls} w-32`} value={f.zipcode} readOnly placeholder="우편번호" />
            <button type="button" onClick={() => openDaumPostcode((r) => setF((p) => ({ ...p, zipcode: r.zipcode, address: r.address })))} className={`shrink-0 rounded-lg px-3 text-xs font-bold ${dv.outlineBtn}`}>우편번호 검색</button>
          </div>
          <input className={`${inputCls} mt-2`} value={f.address} readOnly placeholder="기본주소" />
          <input className={`${inputCls} mt-2`} value={f.addressDetail} onChange={(e) => set("addressDetail")(e.target.value)} placeholder="상세주소" />
        </div>
      </section>

      <section className={dv.card}>
        <h3 className={`mb-3 text-sm font-black ${dv.cardHead}`}>정산 계좌</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <F label="은행명"><input className={inputCls} value={f.bankName} onChange={(e) => set("bankName")(e.target.value)} placeholder="은행" /></F>
          <F label="계좌번호"><input className={inputCls} value={f.accountNumber} onChange={(e) => set("accountNumber")(e.target.value)} placeholder="계좌번호" /></F>
          <F label="예금주명"><input className={inputCls} value={f.accountHolder} onChange={(e) => set("accountHolder")(e.target.value)} placeholder="예금주" /></F>
        </div>
      </section>

      <section className={dv.card}>
        <h3 className={`mb-3 text-sm font-black ${dv.cardHead}`}>비밀번호 변경</h3>
        <F label="새 비밀번호 (변경 시에만, 8자 이상)"><input type="password" name="new-password" autoComplete="new-password" className={`${inputCls} sm:max-w-xs`} value={f.password} onChange={(e) => set("password")(e.target.value)} placeholder="새 비밀번호" /></F>
      </section>

      {notice && <div className={`rounded-lg px-4 py-3 text-sm ${notice.type === "ok" ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-red-500/15 text-red-300 ring-1 ring-red-500/30"}`}>{notice.msg}</div>}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${dv.primaryBtn}`}>{saving ? "저장 중…" : "변경 저장"}</button>
      </div>
    </form>
  );
}
