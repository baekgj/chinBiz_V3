"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearToken, goToLogin } from "@/lib/auth";
import Icon from "@/components/Icon";
import AlarmBell from "@/components/AlarmBell";
import { apiGet } from "@/lib/api";
import { ct } from "@/components/center/CenterUI";

type NavItem = { href: string; label: string; children?: { href: string; label: string }[] };

const NAV: NavItem[] = [
  { href: "/center", label: "센터 요약" },
  { href: "/center/buzz", label: "소속버즈", children: [
    { href: "/center/buzz", label: "소속버즈회원" },
    { href: "/center/buzz/sales", label: "1차영업관리" },
  ] },
  { href: "/center/managers", label: "소속매니저", children: [
    { href: "/center/managers/applications", label: "매니저신청" },
    { href: "/center/managers", label: "매니저관리" },
    { href: "/center/managers/sales", label: "2차영업관리" },
  ] },
  { href: "/center/education", label: "교육 관리" },
  { href: "/center/settlement", label: "정산 원장", children: [
    { href: "/center/settlement", label: "버즈회원 영업 정산현황" },
    { href: "/center/settlement/manager", label: "관리매니저 영업 정산현황" },
    { href: "/center/settlement/payouts", label: "수당지급 현황" },
  ] },
  { href: "/center/notices", label: "공지사항" },
];

export default function CenterTopbar() {
  const pathname = usePathname();
  const [name, setName] = useState("");
  useEffect(() => { apiGet<{ name: string }>("/api/user/me").then((r) => { if (r.data) setName(r.data.name); }); }, []);
  const active = (href: string) => (href === "/center" ? pathname === "/center" : pathname.startsWith(href));
  // 부모와 href가 같은 인덱스 자식은 정확일치로만 활성화 (하위 경로에서 오활성 방지)
  const childActive = (child: string, parent: string) =>
    child === parent ? pathname === child : pathname === child || pathname.startsWith(child + "/");

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
    <header className={ct.header}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/center" className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 place-items-center rounded-xl shadow-sm ${ct.logoBox}`}><Icon name="box" className="h-5 w-5" /></span>
          <div className="leading-tight">
            <p className={`text-sm font-black ${ct.brand}`}>친비즈 <span className={ct.accent}>CENTER</span></p>
            <p className="text-[10px] font-semibold tracking-wider text-amber-200/40">센추럴 마스터 오피스</p>
          </div>
        </Link>

        <nav ref={navRef} className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => n.children ? (
            <div key={n.href} className="relative">
              <button
                type="button"
                onClick={() => setOpenKey(openKey === n.href ? null : n.href)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) || openKey === n.href ? ct.navActive : ct.navIdle}`}>
                {n.label} <span className="text-[10px]">{openKey === n.href ? "▲" : "▼"}</span>
              </button>
              {openKey === n.href && (
                <div className="absolute left-0 top-full z-40 mt-1 min-w-[200px] rounded-lg border border-amber-900/40 bg-[#141009] p-1 shadow-xl">
                  {n.children.map((c) => (
                    <Link key={c.href} href={c.href} onClick={() => setOpenKey(null)} className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${childActive(c.href, n.href) ? ct.navActive : ct.navIdle}`}>{c.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) ? ct.navActive : ct.navIdle}`}>{n.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <AlarmBell tone="dark" />
          <Link href="/center/profile" className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${pathname.startsWith("/center/profile") ? ct.acctActive : ct.acctIdle}`}>
            {name ? `${name}님` : "내 정보"}
          </Link>
          <button onClick={() => { clearToken(); goToLogin(); }} className={`grid h-9 w-9 place-items-center rounded-lg ${ct.iconBtn}`} aria-label="로그아웃"><Icon name="logout" className="h-5 w-5" /></button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-amber-900/40 px-3 py-2 lg:hidden">
        {NAV.flatMap((n) => n.children ?? [n]).map((n) => (
          <Link key={n.href} href={n.href} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${active(n.href) ? ct.navActive : ct.navIdle}`}>{n.label}</Link>
        ))}
      </nav>
    </header>
  );
}
