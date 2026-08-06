"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { TOKEN_KEY, ROLE_PATH } from "@/lib/auth";

type LoginResponse = { token: string; name: string; role: string };

/**
 * admin 자체 로그인 (PWA 전용 진입점).
 * home(chinbiz.kr) 로그인과 동일한 /api/auth/login 을 호출하되, 토큰을 admin 오리진의
 * localStorage + 쿠키(chinbiz_token)에 저장하고 같은 오리진의 역할 워크스페이스로 이동한다.
 * → 앱 전체가 admin 오리진 하나로 완결되어 PWA standalone 스코프가 유지된다.
 */
export default function AdminLoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"error" | "success">("error");

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!userId || !password) {
      setNoticeType("error");
      setNotice("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost<LoginResponse>("/api/auth/login", { userId, password });
      if (res.ok && res.data?.token) {
        const token = res.data.token;
        // 쿠키(AuthGuard가 우선 조회) + localStorage 저장
        document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax${remember ? "; max-age=86400" : ""}`;
        (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
        setNoticeType("success");
        setNotice(`${res.data.name}님 환영합니다. 워크스페이스로 이동합니다…`);
        const path = ROLE_PATH[res.data.role] ?? "/";
        setTimeout(() => {
          window.location.href = path;
        }, 700);
      } else if (res.status === 401) {
        setNoticeType("error");
        setNotice(res.message ?? "아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setNoticeType("error");
        setNotice(res.message ?? "로그인에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-navy-950 px-5 py-10 text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-500 text-2xl font-black text-amber-300 shadow-lg">
            친
          </div>
          <h1 className="text-xl font-black tracking-tight">친비즈 워크스페이스</h1>
          <p className="mt-1 text-sm text-slate-400">계정으로 로그인하세요</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">아이디</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
              placeholder="아이디 입력"
              className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-navy-900 accent-cyan-500"
            />
            로그인 상태 유지
          </label>

          {notice && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                noticeType === "success"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-400/30 bg-red-500/10 text-red-300"
              }`}
            >
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          친비즈 ChinBiz · 모바일 워크스페이스
        </p>
      </div>
    </main>
  );
}
