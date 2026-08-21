"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { API_BASE, resolveAdminUrl } from "@/lib/api";

const NAV = [
  { label: "친비즈 소개", href: "/about" },
  { label: "상품 둘러보기", href: "/products" },
  { label: "업무 프로세스", href: "/process" },
  { label: "공지사항", href: "/#partner" },
];

const ROLE_PATH: Record<string, string> = {
  MASTER_ADMIN: "/master", PARTNER: "/partner", BUZZ: "/buzz", MANAGER: "/buzz",
  DIVISION_ADMIN: "/division", CENTER_ADMIN: "/center",
};

// 로그인 여부는 오리진 간 공유되는 쿠키(로그아웃 시 삭제됨)로만 판단.
// (localStorage 는 오리진별로 남아 로그아웃 후에도 잔존 → admin바로가기 오노출 원인이므로 사용하지 않음)
function readToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )chinbiz_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [adminUrl, setAdminUrl] = useState<string | null>(null); // 로그인 상태면 ADMIN 바로가기 URL

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 로그인 상태 확인 → [로그인] ↔ [ADMIN 바로가기] 전환 (docs/24)
  useEffect(() => {
    const token = readToken();
    if (!token) { setAdminUrl(null); return; }
    let alive = true;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => { if (alive && me?.role) setAdminUrl(`${resolveAdminUrl()}${ROLE_PATH[me.role] ?? "/master"}`); else if (alive) setAdminUrl(null); })
      .catch(() => { if (alive) setAdminUrl(null); });
    return () => { alive = false; };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "border-line shadow-sm" : "border-line/70"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Logo variant="dark" />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-3 hover:text-forest-700"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {adminUrl ? (
            <a
              href={adminUrl}
              className="rounded-lg border border-forest-600/40 px-4 py-2 text-sm font-bold text-forest-700 transition-colors hover:bg-forest-50"
            >
              ADMIN 바로가기
            </a>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-ink transition-colors hover:text-forest-700"
            >
              로그인
            </Link>
          )}
          <Link
            href="/signup"
            className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-forest-900 shadow-sm transition-all hover:bg-gold-300 hover:shadow"
          >
            버즈회원 가입
          </Link>
          <a
            href="#inquiry"
            className="rounded-lg border border-forest-600/40 px-4 py-2 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-50"
          >
            파트너사 입점문의
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink md:hidden"
          aria-label="메뉴 열기"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface-3"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {adminUrl ? (
                <a
                  href={adminUrl}
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-forest-600/40 px-4 py-2.5 text-center text-sm font-bold text-forest-700"
                >
                  ADMIN 바로가기
                </a>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-line px-4 py-2.5 text-center text-sm font-semibold text-ink"
                >
                  로그인
                </Link>
              )}
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-gold-400 px-4 py-2.5 text-center text-sm font-bold text-forest-900"
              >
                회원가입
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
