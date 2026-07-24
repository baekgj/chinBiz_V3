"use client";

import Link from "next/link";
import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Field from "@/components/auth/Field";
import { apiPost, TOKEN_KEY, resolveServiceUrl } from "@/lib/api";

type LoginResponse = { token: string; name: string; role: string };

// 로그인 후 role별 admin 워크스페이스 경로 (CLAUDE.md §2)
// env 미지정 시 접속 host + 포트 3100으로 런타임 자동 구성(로컬/서버 자동 대응).
const ADMIN_URL = resolveServiceUrl(process.env.NEXT_PUBLIC_ADMIN_URL, 3100, "http://175.125.94.198:3100");
const ROLE_PATH: Record<string, string> = {
  MASTER_ADMIN: "/master",
  PARTNER: "/partner",
  BUZZ: "/buzz",
  MANAGER: "/buzz",
  DIVISION_ADMIN: "/division",
  CENTER_ADMIN: "/center",
};

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ userId?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"error" | "success">("error");

  function validate() {
    const e: typeof errors = {};
    if (!userId) e.userId = "아이디를 입력해 주세요.";
    if (!password) e.password = "비밀번호를 입력해 주세요.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setNotice(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await apiPost<LoginResponse>("/api/auth/login", { userId, password });
      if (res.ok && res.data?.token) {
        const storage = remember ? window.localStorage : window.sessionStorage;
        storage.setItem(TOKEN_KEY, res.data.token);
        // 쿠키에도 저장 (localhost 포트 간 공유 → admin 3100에서 읽음)
        document.cookie = `${TOKEN_KEY}=${res.data.token}; path=/; SameSite=Lax${remember ? "; max-age=86400" : ""}`;
        setNoticeType("success");
        const path = ROLE_PATH[res.data.role] ?? "/master";
        setNotice(`${res.data.name}님 환영합니다! 워크스페이스로 이동합니다… (역할: ${res.data.role})`);
        setTimeout(() => {
          window.location.href = `${ADMIN_URL}${path}`;
        }, 900);
      } else if (res.status === 401) {
        setNoticeType("error");
        setNotice(res.message ?? "아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setNoticeType("error");
        setNotice(res.message ?? "로그인에 실패했습니다.");
      }
    } catch {
      setNoticeType("error");
      setNotice("서버 연결에 실패했습니다. 백엔드(9001) 실행 여부를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="로그인"
      subtitle="친비즈 계정으로 로그인하고 버즈 워크스페이스로 이동하세요."
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label="아이디"
          name="userId"
          value={userId}
          onChange={setUserId}
          placeholder="아이디 입력"
          autoComplete="username"
          error={errors.userId}
          required
        />
        <Field
          label="비밀번호"
          type="password"
          name="password"
          value={password}
          onChange={setPassword}
          placeholder="비밀번호 입력"
          autoComplete="current-password"
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-forest-600"
            />
            로그인 상태 유지
          </label>
          <Link href="/find-password" className="font-medium text-forest-600 hover:underline">
            비밀번호 찾기
          </Link>
        </div>

        {notice && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              noticeType === "success"
                ? "border-forest-300/50 bg-forest-50 text-forest-700"
                : "border-danger/40 bg-red-50 text-danger"
            }`}
          >
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-forest-600 px-6 py-3 font-bold text-white transition-colors hover:bg-forest-700 disabled:opacity-60"
        >
          {submitting ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-bold text-forest-600 hover:underline">
          버즈회원 무료가입
        </Link>
      </p>
    </AuthLayout>
  );
}
