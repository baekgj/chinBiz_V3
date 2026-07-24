"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, goToLogin } from "@/lib/auth";
import Icon from "@/components/Icon";
import { apiGet } from "@/lib/api";
import { dv } from "@/components/division/DivisionUI";

type NavItem = { href: string; label: string; children?: { href: string; label: string }[] };

const NAV: NavItem[] = [
  { href: "/division", label: "본부 자산" },
  { href: "/division/centers", label: "산하 센터 모니터링" },
  { href: "/division/pipeline", label: "센터 영업관리" },
  { href: "/division/settlement", label: "정산현황", children: [
    { href: "/division/settlement/payouts", label: "수당지급현황" },
    { href: "/division/settlement", label: "정산원장" },
  ] },
  { href: "/division/notices", label: "공지사항" },
];

export default function DivisionTopbar() {
  const pathname = usePathname();
  const [name, setName] = useState("");
  useEffect(() => { apiGet<{ name: string }>("/api/user/me").then((r) => { if (r.data) setName(r.data.name); }); }, []);
  const active = (href: string) => (href === "/division" ? pathname === "/division" : pathname.startsWith(href));
  const childActive = (child: string, parent: string) =>
    child === parent ? pathname === child : pathname === child || pathname.startsWith(child + "/");

  return (
    <header className={dv.header}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/division" className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 place-items-center rounded-xl shadow-sm ${dv.logoBox}`}><Icon name="box" className="h-5 w-5" /></span>
          <div className="leading-tight">
            <p className={`text-sm font-black ${dv.brand}`}>친비즈 <span className={dv.accent}>DIVISION</span></p>
            <p className="text-[10px] font-semibold tracking-wider text-violet-400/60">총괄본부 마스터 오피스</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => n.children ? (
            <div key={n.href} className="group relative flex h-16 items-center">
              <button className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) ? dv.navActive : dv.navIdle}`}>{n.label} ▾</button>
              <div className="invisible absolute left-0 top-full z-40 min-w-[180px] rounded-lg border border-violet-900/40 bg-[#1a1428] p-1 opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100">
                {n.children.map((c) => (
                  <Link key={c.href} href={c.href} className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${childActive(c.href, n.href) ? dv.navActive : dv.navIdle}`}>{c.label}</Link>
                ))}
              </div>
            </div>
          ) : (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) ? dv.navActive : dv.navIdle}`}>{n.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button className={`relative grid h-9 w-9 place-items-center rounded-lg ${dv.iconBtn}`} aria-label="알림"><Icon name="bell" className="h-5 w-5" /></button>
          <Link href="/division/profile" className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${pathname.startsWith("/division/profile") ? dv.acctActive : dv.acctIdle}`}>
            {name ? `${name}님` : "내 정보"}
          </Link>
          <button onClick={() => { clearToken(); goToLogin(); }} className={`grid h-9 w-9 place-items-center rounded-lg ${dv.iconBtn}`} aria-label="로그아웃"><Icon name="logout" className="h-5 w-5" /></button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-violet-900/40 px-3 py-2 lg:hidden">
        {NAV.flatMap((n) => n.children ?? [n]).map((n) => (
          <Link key={n.href} href={n.href} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${active(n.href) ? dv.navActive : dv.navIdle}`}>{n.label}</Link>
        ))}
      </nav>
    </header>
  );
}
