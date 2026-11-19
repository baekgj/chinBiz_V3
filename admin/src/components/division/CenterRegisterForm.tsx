"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, dv } from "@/components/division/DivisionUI";
import { apiGet, apiPost } from "@/lib/api";
import { formatPhone } from "@/lib/format";

/**
 * 본부 [센터관리]-[센터등록] (docs/37)
 * 광역본부 → 센터 선택(센터장 지정 안 함 — 본사 [본부ᆞ센터 리스트]에서 지정) + 아이디(중복확인)/비밀번호/이름/전화번호/이메일.
 * 저장 시 BE 가 referral_code = 로그인 본부장 ID(추천본부)로 기록.
 * BE: /api/division/center-mgmt/{divisions,centers,check-id}, POST /api/division/center-mgmt/centers
 */
type Code = { idx: number; name: string };

const ID_RE = /^[a-zA-Z0-9]{4,20}$/;
const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-violet-400/40 ${dv.input}`;

function Field({ label, required, children, hint, error }: { label: string; required?: boolean; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block">
      <span className={`text-xs font-semibold ${dv.fieldLabel}`}>{label}{required && <span className="ml-0.5 text-rose-400">*</span>}</span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : hint ? <p className={`mt-1 text-xs ${dv.note}`}>{hint}</p> : null}
    </label>
  );
}

export default function CenterRegisterForm() {
  const router = useRouter();
  const [divisions, setDivisions] = useState<Code[]>([]);
  const [centers, setCenters] = useState<Code[]>([]);
  const [selDivision, setSelDivision] = useState<number | "">("");
  const [centerIdx, setCenterIdx] = useState<number | "">("");
  const [f, setF] = useState({ userId: "", password: "", name: "", phone: "", email: "" });
  const [idStatus, setIdStatus] = useState<"idle" | "checking" | "ok" | "dup">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    apiGet<Code[]>("/api/division/center-mgmt/divisions").then((r) => { if (r.data) setDivisions(r.data); });
  }, []);

  useEffect(() => {
    setCenterIdx("");
    if (selDivision === "") { setCenters([]); return; }
    apiGet<Code[]>(`/api/division/center-mgmt/centers?divisionIdx=${selDivision}`).then((r) => setCenters(r.data ?? []));
  }, [selDivision]);

  async function checkId() {
    if (!ID_RE.test(f.userId)) { setErrors((e) => ({ ...e, userId: "아이디는 영문/숫자 4~20자" })); return; }
    setErrors((e) => ({ ...e, userId: "" }));
    setIdStatus("checking");
    const r = await apiGet<{ available: boolean }>(`/api/division/center-mgmt/check-id?loginId=${encodeURIComponent(f.userId)}`);
    setIdStatus(r.data?.available ? "ok" : "dup");
  }

  function validate() {
    const e: Record<string, string> = {};
    if (selDivision === "") e.division = "광역본부를 선택해 주세요.";
    if (centerIdx === "") e.center = "센터를 선택해 주세요.";
    if (!ID_RE.test(f.userId)) e.userId = "아이디는 영문/숫자 4~20자";
    else if (idStatus !== "ok") e.userId = "아이디 중복확인을 해주세요.";
    if (f.password.length < 10) e.password = "비밀번호는 10자 이상";
    if (!f.name.trim()) e.name = "이름을 입력해 주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!validate()) return;
    setSaving(true);
    const r = await apiPost("/api/division/center-mgmt/centers", {
      centerIdx: Number(centerIdx), userId: f.userId, password: f.password, name: f.name, phone: f.phone, email: f.email,
    });
    setSaving(false);
    if (r.ok) { router.push("/division/center-mgmt"); return; }
    if (r.status === 409 && (r.message ?? "").includes("아이디")) setIdStatus("dup");
    setNotice(r.message ?? "등록에 실패했습니다.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title="소속 센터 선택" sub="센터장 지정은 하지 않습니다. 센터장은 본사에서 별도로 지정합니다">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="광역본부" required error={errors.division}>
            <select className={inputCls} value={selDivision} onChange={(e) => setSelDivision(e.target.value ? Number(e.target.value) : "")}>
              <option value="">광역본부 선택</option>
              {divisions.map((d) => <option key={d.idx} value={d.idx}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="센터" required error={errors.center}>
            <select className={inputCls} value={centerIdx} disabled={centers.length === 0} onChange={(e) => setCenterIdx(e.target.value ? Number(e.target.value) : "")}>
              <option value="">{selDivision === "" ? "광역본부 먼저 선택" : centers.length ? "센터 선택" : "등록 가능한 센터 없음"}</option>
              {centers.map((c) => <option key={c.idx} value={c.idx}>{c.name}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="센터 계정 정보" sub="등록 시 추천본부로 현재 본부가 자동 기록됩니다">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="아이디" required error={errors.userId} hint="영문/숫자 4~20자">
            <div className="flex gap-2">
              <input className={inputCls} value={f.userId} onChange={(e) => { set("userId")(e.target.value); setIdStatus("idle"); }} placeholder="login_id" />
              <button type="button" onClick={checkId} disabled={idStatus === "checking"} className={`shrink-0 rounded-lg px-3 text-xs font-bold disabled:opacity-60 ${dv.outlineBtn}`}>
                {idStatus === "checking" ? "확인중" : "아이디중복확인"}
              </button>
            </div>
            {idStatus === "ok" && <p className="mt-1 text-xs text-emerald-300">사용 가능한 아이디입니다.</p>}
            {idStatus === "dup" && <p className="mt-1 text-xs text-rose-400">이미 사용 중인 아이디입니다.</p>}
          </Field>
          <Field label="비밀번호" required error={errors.password} hint="10자 이상">
            <input type="password" className={inputCls} value={f.password} onChange={(e) => set("password")(e.target.value)} placeholder="비밀번호" />
          </Field>
          <Field label="이름" required error={errors.name}>
            <input className={inputCls} value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="이름" />
          </Field>
          <Field label="전화번호">
            <input className={inputCls} value={f.phone} inputMode="numeric" onChange={(e) => set("phone")(formatPhone(e.target.value))} placeholder="010-1234-5678" />
          </Field>
          <Field label="이메일">
            <input className={inputCls} value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="mail@chinbiz.com" />
          </Field>
        </div>
      </Card>

      {notice && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{notice}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/division/center-mgmt")} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${dv.outlineBtn}`}>취소</button>
        <button type="submit" disabled={saving} className={`rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60 ${dv.primaryBtn}`}>{saving ? "저장 중…" : "센터 등록"}</button>
      </div>
    </form>
  );
}
