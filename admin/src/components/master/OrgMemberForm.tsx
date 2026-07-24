"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";

const ID_RE = /^[a-zA-Z0-9]{4,20}$/;
const inputCls = "w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 placeholder:text-slate-600";

type Code = { idx: number; name: string; headName?: string; centerName?: string };
type Division = { id: number; name: string; salesCenterId: number | null; centerName: string | null };
export type OrgMember = {
  id?: number; userId?: string; name?: string; role?: string; phone?: string; email?: string;
  bankName?: string; accountNumber?: string; accountHolder?: string; salesCenterId?: number | null; centerName?: string | null;
};

function Field({ label, required, children, hint, error }: { label: string; required?: boolean; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400">{label}{required && <span className="ml-0.5 text-danger">*</span>}</span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}

export default function OrgMemberForm({ mode, initial }: { mode: "new" | "edit"; initial?: OrgMember }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [role, setRole] = useState<"DIVISION_ADMIN" | "CENTER_ADMIN">((initial?.role as "DIVISION_ADMIN" | "CENTER_ADMIN") ?? "DIVISION_ADMIN");
  const [f, setF] = useState({
    userId: initial?.userId ?? "", password: "", name: initial?.name ?? "",
    phone: initial?.phone ?? "", email: initial?.email ?? "",
    bankName: initial?.bankName ?? "", accountNumber: initial?.accountNumber ?? "", accountHolder: initial?.accountHolder ?? "",
  });
  const [salesCenterId, setSalesCenterId] = useState<number | "">(initial?.salesCenterId ?? "");
  const [idStatus, setIdStatus] = useState<"idle" | "checking" | "ok" | "dup">(isEdit ? "ok" : "idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 본부/센터 선택용 데이터
  const [divisionCodes, setDivisionCodes] = useState<Code[]>([]); // 본부 후보(center_code null)
  const [divisions, setDivisions] = useState<Division[]>([]);     // 본부 계정(user)
  const [selDivision, setSelDivision] = useState<number | "">(""); // 선택한 본부 user id
  const [centerCodes, setCenterCodes] = useState<Code[]>([]);      // 센터 후보

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isEdit) return; // 수정 모드는 소속(center) 재선택 없이 기본정보만
    apiGet<Code[]>("/api/org/center-codes/divisions").then((r) => { if (r.data) setDivisionCodes(r.data); });
    apiGet<Division[]>("/api/org/divisions").then((r) => { if (r.data) setDivisions(r.data); });
  }, [isEdit]);

  // 센터 모드: 본부 선택 시 산하 센터 후보 로드
  useEffect(() => {
    if (isEdit || role !== "CENTER_ADMIN" || selDivision === "") { return; }
    const div = divisions.find((d) => d.id === selDivision);
    if (!div?.salesCenterId) { setCenterCodes([]); return; }
    apiGet<Code[]>(`/api/org/center-codes/centers?divisionIdx=${div.salesCenterId}`).then((r) => {
      setCenterCodes(r.data ?? []);
      setSalesCenterId("");
    });
  }, [selDivision, role, divisions, isEdit]);

  function onRole(r: "DIVISION_ADMIN" | "CENTER_ADMIN") {
    setRole(r); setSalesCenterId(""); setSelDivision(""); setCenterCodes([]);
  }

  async function checkId() {
    if (!ID_RE.test(f.userId)) { setErrors((e) => ({ ...e, userId: "아이디는 영문/숫자 4~20자" })); return; }
    setErrors((e) => ({ ...e, userId: "" }));
    setIdStatus("checking");
    const res = await apiGet<{ available: boolean }>(`/api/org/check-id?loginId=${encodeURIComponent(f.userId)}`);
    setIdStatus(res.data?.available ? "ok" : "dup");
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!isEdit) {
      if (!ID_RE.test(f.userId)) e.userId = "아이디는 영문/숫자 4~20자";
      else if (idStatus !== "ok") e.userId = "아이디 중복확인을 해주세요.";
      if (f.password.length < 10) e.password = "비밀번호는 10자 이상";
      if (salesCenterId === "") e.salesCenterId = role === "DIVISION_ADMIN" ? "본부를 선택해 주세요." : "센터를 선택해 주세요.";
    } else if (f.password && f.password.length < 10) {
      e.password = "비밀번호는 10자 이상";
    }
    if (!f.name.trim()) e.name = "이름을 입력해 주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!validate()) return;
    setSaving(true);
    const payload = {
      role, userId: f.userId, password: f.password, name: f.name, phone: f.phone, email: f.email,
      bankName: f.bankName, accountNumber: f.accountNumber, accountHolder: f.accountHolder,
      salesCenterId: salesCenterId === "" ? null : Number(salesCenterId),
    };
    const res = isEdit ? await apiPut(`/api/org/members/${initial?.id}`, payload) : await apiPost(`/api/org/members`, payload);
    setSaving(false);
    if (res.ok) router.push("/master/organization/members");
    else if (res.status === 409) { setIdStatus("dup"); setNotice(res.message ?? "이미 사용 중인 아이디입니다."); }
    else setNotice(res.message ?? "저장에 실패했습니다.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 역할 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-black text-white">역할 및 소속</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="역할" required>
            {isEdit ? (
              <div className="rounded-lg border border-line bg-navy-800 px-3 py-2 text-sm text-slate-300">
                {role === "DIVISION_ADMIN" ? "본부 (DIVISION_ADMIN)" : "센터 (CENTER_ADMIN)"}
              </div>
            ) : (
              <div className="flex gap-2">
                {([["DIVISION_ADMIN", "본부"], ["CENTER_ADMIN", "센터"]] as const).map(([v, l]) => (
                  <button type="button" key={v} onClick={() => onRole(v)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${role === v ? "border-brand-500 bg-brand-600/20 text-white" : "border-line text-slate-400 hover:bg-navy-800"}`}>{l}</button>
                ))}
              </div>
            )}
          </Field>

          {isEdit ? (
            <Field label="소속">
              <div className="rounded-lg border border-line bg-navy-800 px-3 py-2 text-sm text-slate-300">{initial?.centerName ?? "-"}</div>
            </Field>
          ) : role === "DIVISION_ADMIN" ? (
            <Field label="본부 선택" required error={errors.salesCenterId} hint="center_code 미지정(본부) 목록">
              <select className={inputCls} value={salesCenterId} onChange={(e) => setSalesCenterId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">본부 선택</option>
                {divisionCodes.map((c) => <option key={c.idx} value={c.idx}>{c.name}</option>)}
              </select>
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:col-span-1">
              <Field label="광역 본부" required hint="등록된 본부 계정">
                <select className={inputCls} value={selDivision} onChange={(e) => setSelDivision(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">본부 선택</option>
                  {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}{d.centerName ? ` (${d.centerName})` : ""}</option>)}
                </select>
              </Field>
              <Field label="센터 선택" required error={errors.salesCenterId}>
                <select className={inputCls} value={salesCenterId} disabled={centerCodes.length === 0} onChange={(e) => setSalesCenterId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">{centerCodes.length ? "센터 선택" : "본부 먼저 선택"}</option>
                  {centerCodes.map((c) => <option key={c.idx} value={c.idx}>{c.name}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>
      </section>

      {/* 계정 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-black text-white">계정 정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="아이디" required error={errors.userId} hint={isEdit ? "수정 불가" : "영문/숫자 4~20자"}>
            <div className="flex gap-2">
              <input className={inputCls} value={f.userId} disabled={isEdit} onChange={(e) => { set("userId")(e.target.value); setIdStatus("idle"); }} placeholder="login_id" />
              {!isEdit && <button type="button" onClick={checkId} disabled={idStatus === "checking"} className="shrink-0 rounded-lg border border-brand-500 px-3 text-xs font-bold text-brand-400 hover:bg-brand-600/15 disabled:opacity-60">{idStatus === "checking" ? "확인중" : "중복확인"}</button>}
            </div>
            {!isEdit && idStatus === "ok" && <p className="mt-1 text-xs text-pos">사용 가능한 아이디입니다.</p>}
            {!isEdit && idStatus === "dup" && <p className="mt-1 text-xs text-danger">이미 사용 중인 아이디입니다.</p>}
          </Field>
          <Field label="비밀번호" required={!isEdit} error={errors.password} hint={isEdit ? "변경 시에만 입력 (8자 이상)" : "8자 이상"}>
            <input type="password" className={inputCls} value={f.password} onChange={(e) => set("password")(e.target.value)} placeholder={isEdit ? "변경 시 입력" : "비밀번호"} />
          </Field>
          <Field label="이름" required error={errors.name}><input className={inputCls} value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="이름" /></Field>
          <Field label="전화번호"><input className={inputCls} value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="010-1234-5678" /></Field>
          <Field label="이메일"><input className={inputCls} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="mail@chinbiz.com" /></Field>
        </div>
      </section>

      {/* 정산 계좌 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-black text-white">정산 계좌</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="은행명"><input className={inputCls} value={f.bankName} onChange={(e) => set("bankName")(e.target.value)} placeholder="은행" /></Field>
          <Field label="계좌번호"><input className={inputCls} value={f.accountNumber} onChange={(e) => set("accountNumber")(e.target.value)} placeholder="계좌번호" /></Field>
          <Field label="예금주"><input className={inputCls} value={f.accountHolder} onChange={(e) => set("accountHolder")(e.target.value)} placeholder="예금주" /></Field>
        </div>
      </section>

      {notice && <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{notice}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/master/organization/members")} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-navy-800">취소</button>
        <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">{saving ? "저장 중…" : isEdit ? "변경 저장" : "등록"}</button>
      </div>
    </form>
  );
}
