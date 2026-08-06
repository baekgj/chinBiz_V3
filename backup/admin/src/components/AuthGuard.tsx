"use client";

import { useEffect, useState } from "react";
import { fetchMe, getToken, goToLogin, persistToken, ROLE_PATH, type Me } from "@/lib/auth";
import Icon from "./Icon";

type Status = "checking" | "ok" | "denied";

export default function AuthGuard({
  allow,
  children,
}: {
  allow: string[]; // 허용 역할
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const token = getToken();
      if (!token) {
        goToLogin();
        return;
      }
      const info = await fetchMe(token);
      if (!alive) return;
      if (!info) {
        goToLogin();
        return;
      }
      persistToken(token);
      if (allow.includes(info.role)) {
        setMe(info);
        setStatus("ok");
      } else {
        // 권한 불일치 → 본인 역할 워크스페이스로 이동
        setMe(info);
        setStatus("denied");
        const path = ROLE_PATH[info.role] ?? "/";
        setTimeout(() => {
          window.location.href = path;
        }, 1600);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white">
            <Icon name="shield" className="h-6 w-6" />
          </span>
          <p className="text-sm">인증 확인 중…</p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-danger/30 bg-navy-900 p-8 text-center">
          <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl bg-danger/15 text-danger">
            <Icon name="shield" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-black text-white">접근 권한이 없습니다</h1>
          <p className="mt-2 text-sm text-slate-400">
            현재 계정 역할(<b className="text-slate-200">{me?.role}</b>)로는 이 워크스페이스에 접근할 수 없습니다.
            본인 워크스페이스로 이동합니다…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
