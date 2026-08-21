"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { openDaumPostcode } from "@/lib/postcode";
import { formatPhone, formatRRN } from "@/lib/format";
import { useBuzz } from "@/components/buzz/theme";

type Me = {
  userId: string; name?: string; email?: string; phone?: string;
  zipcode?: string; address?: string; addressDetail?: string;
  bankName?: string; accountNumber?: string; accountHolder?: string; residentNumber?: string;
  role?: string; referralCode?: string;
  salesCenterName?: string | null; referrerLabel?: string | null;
  managerCenters?: { centerName: string; status: string }[];
};

// ★ 모듈 스코프 컴포넌트: 렌더마다 재생성되지 않아 입력 포커스가 유지된다.
function Field({ label, hint, labelCls, noteCls, children }: { label: string; hint?: string; labelCls: string; noteCls: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={`text-xs font-semibold ${labelCls}`}>{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className={`mt-1 text-xs ${noteCls}`}>{hint}</p>}
    </label>
  );
}

/** 버즈/매니저 내 정보 수정 (이름·전화·이메일·주소·계좌·비밀번호) — /api/user/me */
export default function ProfileForm() {
  const { theme } = useBuzz();
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [f, setF] = useState({ name: "", phone: "", email: "", zipcode: "", address: "", addressDetail: "", bankName: "", accountNumber: "", accountHolder: "", residentNumber: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-slate-400 ${theme.input}`;
  const lc = theme.fieldLabel, nc = theme.note;

  useEffect(() => {
    apiGet<Me>("/api/user/me").then((r) => {
      if (r.ok && r.data) {
        setMe(r.data);
        setF({
          name: r.data.name ?? "", phone: r.data.phone ?? "", email: r.data.email ?? "",
          zipcode: r.data.zipcode ?? "", address: r.data.address ?? "", addressDetail: r.data.addressDetail ?? "",
          bankName: r.data.bankName ?? "", accountNumber: r.data.accountNumber ?? "", accountHolder: r.data.accountHolder ?? "", residentNumber: r.data.residentNumber ?? "", password: "",
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
    if (f.residentNumber && f.residentNumber.replace(/\D/g, "").length !== 13) { setNotice({ type: "err", msg: "주민등록번호 13자리를 정확히 입력해 주세요." }); return; }
    setSaving(true);
    const res = await apiPut<Me>("/api/user/me", f);
    setSaving(false);
    if (res.ok) { setNotice({ type: "ok", msg: "내 정보가 저장되었습니다." }); setF((p) => ({ ...p, password: "" })); }
    else setNotice({ type: "err", msg: res.message ?? "저장에 실패했습니다." });
  }

  if (status === "loading") return <p className={`text-sm ${theme.cardSub}`}>불러오는 중…</p>;
  if (status === "error") return <p className="text-sm text-red-500">내 정보를 불러오지 못했습니다.</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className={theme.card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>계정 <span className={`text-xs font-medium ${theme.note}`}>(변경 불가)</span></h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="아이디" labelCls={lc} noteCls={nc}><div className={`rounded-lg border px-3 py-2 text-sm ${theme.roBox}`}>{me?.userId}</div></Field>
          <Field label="역할" labelCls={lc} noteCls={nc}><div className={`rounded-lg border px-3 py-2 text-sm ${theme.roBox}`}>{me?.role === "MANAGER" ? "관리매니저" : "버즈회원"}</div></Field>
          <Field label="소속센터" labelCls={lc} noteCls={nc}><div className={`rounded-lg border px-3 py-2 text-sm ${theme.roBox}`}>{me?.salesCenterName ?? "-"}</div></Field>
          <Field label="추천회원" labelCls={lc} noteCls={nc}><div className={`rounded-lg border px-3 py-2 text-sm ${theme.roBox}`}>{me?.referrerLabel ?? "-"}</div></Field>
        </div>
        {me?.managerCenters && me.managerCenters.length > 0 && (
          <div className="mt-4">
            <span className={`text-xs font-semibold ${lc}`}>매니저 활동신청 지역</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {me.managerCenters.map((c, i) => (
                <span key={i} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${theme.roBox}`}>
                  {c.centerName}
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${c.status === "Y" ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}`}>
                    {c.status === "Y" ? "승인" : "심사중"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className={theme.card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>기본 정보 · 연락처</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="이름" labelCls={lc} noteCls={nc}><input className={inputCls} value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="이름" /></Field>
          <Field label="전화번호" labelCls={lc} noteCls={nc}><input className={inputCls} value={f.phone} inputMode="numeric" onChange={(e) => set("phone")(formatPhone(e.target.value))} placeholder="010-1234-5678" /></Field>
          <Field label="이메일" labelCls={lc} noteCls={nc}><input className={inputCls} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="mail@example.com" /></Field>
        </div>
        <div className="mt-4">
          <span className={`text-xs font-semibold ${lc}`}>주소</span>
          <div className="mt-1 flex gap-2">
            <input className={`${inputCls} w-32`} value={f.zipcode} readOnly placeholder="우편번호" />
            <button type="button" onClick={() => openDaumPostcode((r) => setF((p) => ({ ...p, zipcode: r.zipcode, address: r.address })))}
              className={`shrink-0 rounded-lg px-3 text-xs font-bold ${theme.outlineBtn}`}>우편번호 검색</button>
          </div>
          <input className={`${inputCls} mt-2`} value={f.address} readOnly placeholder="기본주소" />
          <input className={`${inputCls} mt-2`} value={f.addressDetail} onChange={(e) => set("addressDetail")(e.target.value)} placeholder="상세주소" />
        </div>
      </section>

      <section className={theme.card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>정산 계좌</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="은행명" labelCls={lc} noteCls={nc}><input className={inputCls} value={f.bankName} onChange={(e) => set("bankName")(e.target.value)} placeholder="은행" /></Field>
          <Field label="계좌번호" labelCls={lc} noteCls={nc}><input className={inputCls} value={f.accountNumber} onChange={(e) => set("accountNumber")(e.target.value)} placeholder="계좌번호" /></Field>
          <Field label="예금주" labelCls={lc} noteCls={nc}><input className={inputCls} value={f.accountHolder} onChange={(e) => set("accountHolder")(e.target.value)} placeholder="예금주" /></Field>
          <Field label="주민등록번호 (세금신고용)" hint="활동수당 지급 세금신고에 사용됩니다." labelCls={lc} noteCls={nc}>
            <input className={inputCls} value={f.residentNumber} onChange={(e) => set("residentNumber")(formatRRN(e.target.value))} placeholder="000000-0000000" inputMode="numeric" />
          </Field>
        </div>
      </section>

      <section className={theme.card}>
        <h3 className={`mb-3 text-sm font-black ${theme.cardHead}`}>비밀번호 변경</h3>
        <Field label="새 비밀번호" hint="변경 시에만 입력 (8자 이상)" labelCls={lc} noteCls={nc}>
          <input type="password" name="new-password" autoComplete="new-password" className={`${inputCls} sm:max-w-xs`} value={f.password} onChange={(e) => set("password")(e.target.value)} placeholder="새 비밀번호" />
        </Field>
      </section>

      {notice && (
        <div className={`rounded-lg px-4 py-3 text-sm ${notice.type === "ok" ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30" : "bg-red-500/15 text-red-500 ring-1 ring-red-500/30"}`}>{notice.msg}</div>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${theme.primaryBtn}`}>
          {saving ? "저장 중…" : "변경 저장"}
        </button>
      </div>
    </form>
  );
}
