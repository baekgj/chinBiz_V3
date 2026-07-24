"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

const NAV = [
  { label: "친비즈 소개", href: "#service" },
  { label: "상품 둘러보기", href: "#market" },
  { label: "업무 프로세스", href: "#process" },
  { label: "공지사항", href: "#partner" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-ink transition-colors hover:text-forest-700"
          >
            로그인
          </Link>
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
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-line px-4 py-2.5 text-center text-sm font-semibold text-ink"
              >
                로그인
              </Link>
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
