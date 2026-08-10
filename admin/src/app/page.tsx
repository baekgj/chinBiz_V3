"use client";

import { useEffect } from "react";
import { getToken, fetchMe, goToLogin, ROLE_PATH } from "@/lib/auth";
import Icon from "@/components/Icon";

/**
 * PWA/모바일 진입점(start_url "/"). 런처 화면을 노출하지 않고 세션에 따라 자동 이동:
 *  - 세션(토큰) 유효 → 해당 회원 역할(role) 대시보드로 이동
 *  - 세션 없음/무효 → 로그인 화면(/login)
 */
export default function AdminEntry() {
  useEffect(() => {
    let alive = true;
    (async () => {
      const token = getToken();
      if (!token) { goToLogin(); return; }
      const me = await fetchMe(token);
      if (!alive) return;
      if (!me) { goToLogin(); return; }        // 토큰 만료·무효 → 로그인
      window.location.href = ROLE_PATH[me.role] ?? "/login";
    })();
    return () => { alive = false; };
  }, []);

  // 이동 전 짧은 로딩 표시 (런처/스플래시 미노출)
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <span className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white">
          <Icon name="shield" className="h-6 w-6" />
        </span>
        <p className="text-sm">이동 중…</p>
      </div>
    </div>
  );
}
