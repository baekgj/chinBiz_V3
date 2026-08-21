"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import Icon from "@/components/Icon";
import { apiGet, apiPut, apiPost } from "@/lib/api";
import { formatPhone } from "@/lib/format";
import { RBAC_AREAS, type NavArea } from "@/components/nav";

type ScopeRow = { userId: string; name: string; areas: string[]; status: string };

const emptyForm = { userId: "", password: "", name: "", email: "", phone: "", areas: [] as string[] };

/**
 * 역할 기반 접근 제어(RBAC) — 담당자 지정 (docs/20 Task4).
 * MASTER_ADMIN 사용자별로 담당영역(A~D)을 지정/변경/삭제. 영역 미지정 = 슈퍼(전체 접근).
 */
export default function RbacManager() {
  const [rows, setRows] = useState<ScopeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // 담당자 등록 폼
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [idCheck, setIdCheck] = useState<{ status: "ok" | "taken" | "error"; msg: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiGet<{ content: ScopeRow[] }>("/api/rbac/admin-scopes");
    setRows(r.ok && r.data ? r.data.content : []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openForm() { setForm(emptyForm); setFormErr(null); setIdCheck(null); setShowForm(true); }
  const setF = (k: keyof typeof emptyForm, v: string) => setForm((p) => ({ ...p, [k]: v }));
  // 아이디 변경 시 중복확인 결과 무효화
  const setUserId = (v: string) => { setForm((p) => ({ ...p, userId: v })); setIdCheck(null); };
  const toggleFormArea = (code: string) =>
    setForm((p) => ({ ...p, areas: p.areas.includes(code) ? p.areas.filter((a) => a !== code) : [...p.areas, code].sort() }));

  async function checkId() {
    if (!/^[A-Za-z0-9]{4,20}$/.test(form.userId)) {
      setIdCheck({ status: "error", msg: "아이디는 영문/숫자만 4~20자로 입력해 주세요." });
      return;
    }
    setChecking(true);
    const r = await apiGet<{ available: boolean }>(`/api/rbac/admin-scopes/check-id?userId=${encodeURIComponent(form.userId)}`);
    setChecking(false);
    if (!r.ok) { setIdCheck({ status: "error", msg: r.message || "확인 실패" }); return; }
    setIdCheck(r.data?.available
      ? { status: "ok", msg: "사용 가능한 아이디입니다." }
      : { status: "taken", msg: "이미 사용 중인 아이디입니다." });
  }

  async function submitRegister(ev: React.FormEvent) {
    ev.preventDefault();
    setFormErr(null);
    if (!/^[A-Za-z0-9]{4,20}$/.test(form.userId)) { setFormErr("아이디는 영문/숫자만 4~20자로 입력해 주세요."); return; }
    if (idCheck?.status !== "ok") { setFormErr("아이디 중복확인을 해주세요."); return; }
    if (form.password.length < 10) { setFormErr("비밀번호는 10자 이상 입력해 주세요."); return; }
    if (!form.name.trim()) { setFormErr("담당자 이름을 입력해 주세요."); return; }
    setSaving(true);
    const r = await apiPost<{ message: string }>("/api/rbac/admin-scopes/register", form);
    setSaving(false);
    if (r.ok) {
      setShowForm(false);
      setMsg(`담당자 ${form.name}(${form.userId}) 등록 완료.`);
      await load();
    } else {
      setFormErr(r.message || "등록에 실패했습니다.");
    }
  }

  async function toggle(row: ScopeRow, area: NavArea) {
    const has = row.areas.includes(area);
    const next = has ? row.areas.filter((a) => a !== area) : [...row.areas, area].sort();
    setBusy(row.userId); setMsg(null);
    const r = await apiPut<{ areas: string[] }>(`/api/rbac/admin-scopes/${row.userId}`, { areas: next });
    setBusy(null);
    if (r.ok) {
      setRows((prev) => prev.map((x) => (x.userId === row.userId ? { ...x, areas: r.data?.areas ?? next } : x)));
      setMsg(`${row.name}(${row.userId}) 담당영역이 저장되었습니다.`);
    } else {
      setMsg(r.message || "저장 실패");
    }
  }

  async function toggleStatus(row: ScopeRow) {
    const next = row.status === "STOP" ? "ACTIVE" : "STOP";
    if (next === "STOP" && !confirm(`${row.name}(${row.userId}) 담당자를 중지할까요? 중지 시 로그인이 차단됩니다.`)) return;
    setBusy(row.userId); setMsg(null);
    const r = await apiPut<{ status: string; message: string }>(`/api/rbac/admin-scopes/${row.userId}/status`, { status: next });
    setBusy(null);
    if (r.ok) {
      setRows((prev) => prev.map((x) => (x.userId === row.userId ? { ...x, status: r.data?.status ?? next } : x)));
      setMsg(r.data?.message ?? "상태가 변경되었습니다.");
    } else setMsg(r.message || "상태 변경 실패");
  }

  async function clearAll(row: ScopeRow) {
    setBusy(row.userId); setMsg(null);
    const r = await apiPut<{ areas: string[] }>(`/api/rbac/admin-scopes/${row.userId}`, { areas: [] });
    setBusy(null);
    if (r.ok) {
      setRows((prev) => prev.map((x) => (x.userId === row.userId ? { ...x, areas: [] } : x)));
      setMsg(`${row.name}(${row.userId}) → 슈퍼(전체 접근)로 변경되었습니다.`);
    } else setMsg(r.message || "저장 실패");
  }

  return (
    <Card className="lg:col-span-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <SectionTitle title="역할 기반 접근 제어 (RBAC) · 담당자 지정" sub="MASTER_ADMIN 계정별로 접근 가능한 메뉴 영역을 지정합니다. 영역 미지정 시 전체 메뉴(슈퍼) 접근." />
        <button onClick={openForm}
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500">
          + 담당자 등록
        </button>
      </div>

      {/* 영역 범례 */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {RBAC_AREAS.map((a) => (
          <div key={a.code} className="rounded-xl bg-navy-800 p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-600/30 text-xs font-black text-brand-300">{a.code}</span>
              <span className="text-sm font-bold text-white">{a.label}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{a.menus}</p>
          </div>
        ))}
      </div>

      {msg && <p className="mb-3 text-sm font-semibold text-brand-300">{msg}</p>}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-navy-800 text-xs text-slate-400">
              <th className="px-4 py-3 text-left font-semibold">계정(ID)</th>
              <th className="px-4 py-3 text-left font-semibold">이름</th>
              {RBAC_AREAS.map((a) => (
                <th key={a.code} className="px-3 py-3 text-center font-semibold">{a.code}</th>
              ))}
              <th className="px-4 py-3 text-center font-semibold">현재 권한</th>
              <th className="px-4 py-3 text-center font-semibold">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">불러오는 중…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">MASTER_ADMIN 계정이 없습니다.</td></tr>
            ) : rows.map((row) => {
              const isSuper = row.areas.length === 0;
              return (
                <tr key={row.userId} className="hover:bg-navy-800/50">
                  <td className="px-4 py-3 font-mono text-slate-300">{row.userId}</td>
                  <td className="px-4 py-3 font-bold text-white">{row.name}</td>
                  {RBAC_AREAS.map((a) => {
                    const on = row.areas.includes(a.code);
                    return (
                      <td key={a.code} className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggle(row, a.code)}
                          disabled={busy === row.userId}
                          aria-pressed={on}
                          className={`grid h-7 w-7 mx-auto place-items-center rounded-lg text-xs font-black transition-colors disabled:opacity-50 ${
                            on ? "bg-brand-500 text-white" : "bg-navy-700 text-slate-500 hover:bg-navy-600"
                          }`}
                        >
                          {on ? <Icon name="check" className="h-4 w-4" /> : a.code}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    {isSuper ? (
                      <Badge tone="pos">슈퍼(전체)</Badge>
                    ) : (
                      <button onClick={() => clearAll(row)} disabled={busy === row.userId}
                        className="rounded-lg border border-line px-3 py-1 text-xs font-bold text-slate-300 hover:bg-navy-700 disabled:opacity-50">
                        {row.areas.join("·")} · 전체해제
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${row.status === "STOP" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                        {row.status === "STOP" ? "중지" : "운영중"}
                      </span>
                      {/* 슈퍼(전체) 계정은 중지/운영 버튼 숨김 */}
                      {!isSuper && (
                        <button onClick={() => toggleStatus(row)} disabled={busy === row.userId}
                          className={`rounded-lg px-3 py-1 text-xs font-bold disabled:opacity-50 ${
                            row.status === "STOP"
                              ? "bg-emerald-600 text-white hover:bg-emerald-500"
                              : "border border-red-500/50 text-red-400 hover:bg-red-500/10"
                          }`}>
                          {row.status === "STOP" ? "운영" : "중지"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">* 담당영역을 하나 이상 지정하면 해당 계정은 지정된 메뉴만 접근합니다. 전체 해제(권한 없음) = 슈퍼 관리자(전체 메뉴 + 시스템 설정). 한 계정에 여러 영역 지정 가능.</p>

      {/* 담당자 등록 모달 (role=MASTER_ADMIN 회원가입) */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-line bg-navy-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">담당자 등록</h3>
              <button onClick={() => !saving && setShowForm(false)} className="text-slate-400 hover:text-white" aria-label="닫기">✕</button>
            </div>
            <p className="mb-4 text-xs text-slate-400">MASTER_ADMIN 권한의 담당자 계정을 생성합니다. 등록 후 담당영역을 지정하면 해당 메뉴만 접근합니다.</p>
            <form onSubmit={submitRegister} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-300">아이디 *</span>
                  <div className="flex gap-2">
                    <input value={form.userId} onChange={(e) => setUserId(e.target.value)} placeholder="영문/숫자 4~20자"
                      className="w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500" />
                    <button type="button" onClick={checkId} disabled={checking || !form.userId}
                      className="shrink-0 rounded-lg border border-brand-500/60 px-3 py-2 text-xs font-bold text-brand-300 hover:bg-brand-600/20 disabled:opacity-50">
                      {checking ? "확인 중…" : "아이디 중복체크"}
                    </button>
                  </div>
                  {idCheck && (
                    <span className={`mt-1 block text-xs font-semibold ${idCheck.status === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                      {idCheck.msg}
                    </span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-300">비밀번호 *</span>
                  <input type="password" value={form.password} onChange={(e) => setF("password", e.target.value)} placeholder="10자 이상"
                    className="w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-300">이름 *</span>
                  <input value={form.name} onChange={(e) => setF("name", e.target.value)}
                    className="w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-300">휴대폰</span>
                  <input value={form.phone} inputMode="numeric" onChange={(e) => setF("phone", formatPhone(e.target.value))} placeholder="010-0000-0000"
                    className="w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-300">이메일</span>
                  <input type="email" value={form.email} onChange={(e) => setF("email", e.target.value)}
                    className="w-full rounded-lg border border-line bg-navy-950 px-3 py-2 text-sm text-white outline-none focus:border-brand-500" />
                </label>
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-300">담당영역 <span className="font-normal text-slate-500">(미선택 시 슈퍼=전체 접근)</span></span>
                <div className="flex flex-wrap gap-2">
                  {RBAC_AREAS.map((a) => {
                    const on = form.areas.includes(a.code);
                    return (
                      <button type="button" key={a.code} onClick={() => toggleFormArea(a.code)}
                        className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${on ? "bg-brand-500 text-white" : "bg-navy-800 text-slate-400 hover:bg-navy-700"}`}>
                        {a.code} · {a.menus}
                      </button>
                    );
                  })}
                </div>
              </div>
              {formErr && <div className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/30">{formErr}</div>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} disabled={saving}
                  className="rounded-xl border border-line px-5 py-2 text-sm font-bold text-slate-300 hover:bg-navy-800 disabled:opacity-50">취소</button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-brand-600 px-6 py-2 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
                  {saving ? "등록 중…" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
