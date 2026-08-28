"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearToken, goToLogin } from "@/lib/auth";
import Icon from "@/components/Icon";
import AlarmBell from "@/components/AlarmBell";
import AdminHomeLink from "@/components/AdminHomeLink";

type NavItem = { href: string; label: string; children?: { href: string; label: string }[] };

const NAV: NavItem[] = [
  { href: "/partner/dashboard", label: "대시보드" },
  { href: "/partner", label: "정산/수당 현황", children: [
    { href: "/partner", label: "정산 현황" },
    { href: "/partner/ledger", label: "정산 원장" },
  ] },
  { href: "/partner/products", label: "상품 관리" },
  { href: "/partner/pipeline", label: "영업 현황" },
  { href: "/partner/voc", label: "민원 센터" },
];

export default function PartnerTopbar() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/partner" ? pathname === "/partner" : pathname.startsWith(href));
  const childActive = (child: string, parent: string) =>
    child === parent ? pathname === child : pathname === child || pathname.startsWith(child + "/");
  const idleCls = "text-slate-500 hover:bg-slate-100 hover:text-slate-800";
  const activeCls = "bg-sky-50 text-sky-700";

  // 소매뉴: hover 대신 클릭 토글(사라짐 방지). 외부 클릭·라우트 변경 시 닫힘
  const [openKey, setOpenKey] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => { setOpenKey(null); }, [pathname]);
  useEffect(() => {
    function onDoc(e: MouseEvent) { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenKey(null); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/partner" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-sm">
            <Icon name="box" className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-black text-slate-900">친비즈 <span className="text-sky-600">PARTNER</span></p>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400">파트너 마스터 오피스</p>
          </div>
        </Link>

        <nav ref={navRef} className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => n.children ? (
            <div key={n.href} className="relative">
              <button
                type="button"
                onClick={() => setOpenKey(openKey === n.href ? null : n.href)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) || openKey === n.href ? activeCls : idleCls}`}>
                {n.label} <span className="text-[10px]">{openKey === n.href ? "▲" : "▼"}</span>
              </button>
              {openKey === n.href && (
                <div className="absolute left-0 top-full z-40 mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                  {n.children.map((c) => (
                    <Link key={c.href} href={c.href} onClick={() => setOpenKey(null)} className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${childActive(c.href, n.href) ? activeCls : idleCls}`}>{c.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={n.href} href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) ? activeCls : idleCls}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AdminHomeLink tone="light" />
          <AlarmBell tone="light" />
          {/* 업체명 클릭 → 내정보 수정 */}
          <Link href="/partner/profile"
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${pathname.startsWith("/partner/profile") ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-100"}`}>
            삼화정공사 담당자님
          </Link>
          <button onClick={() => { clearToken(); goToLogin(); }} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="로그아웃">
            <Icon name="logout" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
        {NAV.flatMap((n) => n.children ?? [n]).map((n) => (
          <Link key={n.href} href={n.href} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${active(n.href) ? "bg-sky-50 text-sky-700" : "text-slate-500"}`}>{n.label}</Link>
        ))}
      </nav>
    </header>
  );
}
