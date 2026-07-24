"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, goToLogin } from "@/lib/auth";
import Icon from "@/components/Icon";
import { useBuzz } from "@/components/buzz/theme";

type NavItem = { href: string; label: string; children?: { href: string; label: string }[] };

const NAV: NavItem[] = [
  { href: "/buzz", label: "수당 현황" },
  { href: "/buzz/pipeline", label: "영업 파이프라인" },
  { href: "/buzz/market", label: "상품 마켓" },
  { href: "/buzz/network", label: "버즈 네트워크" },
  { href: "/buzz/notices", label: "공지사항" },
];
const NAV_MANAGER: NavItem[] = [
  { href: "/buzz", label: "정산·자산 현황" },
  { href: "/buzz/intake", label: "영업관리", children: [
    { href: "/buzz/intake", label: "버즈1차접수현황" },
    { href: "/buzz/managed", label: "2차영업관리" },
  ] },
  { href: "/buzz/market", label: "관리마켓" },
  { href: "/buzz/education", label: "교육 관리" },
  { href: "/buzz/notices", label: "공지사항" },
];

export default function BuzzTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, isManager, canToggle, setView, name } = useBuzz();
  const nav = isManager ? NAV_MANAGER : NAV;
  // 뷰 전환 시 대시보드(/buzz)로 이동
  const toggleView = () => { setView(isManager ? "buzz" : "manager"); router.push("/buzz"); };
  const active = (href: string) => (href === "/buzz" ? pathname === "/buzz" : pathname.startsWith(href));

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${theme.header}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/buzz" className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 place-items-center rounded-xl shadow-sm ${theme.logoBox}`}>
            <Icon name="box" className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className={`text-sm font-black ${theme.brand}`}>친비즈 <span className={theme.accent}>{isManager ? "MANAGER" : "BUZZ"}</span></p>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400">{isManager ? "관리매니저 워크스페이스" : "버즈 워크스페이스"}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => n.children ? (
            <div key={n.href} className="group relative">
              <button className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${n.children.some((c) => active(c.href)) ? theme.navActive : theme.navIdle}`}>
                {n.label} ▾
              </button>
              <div className={`absolute left-0 top-full z-40 mt-1 hidden min-w-[180px] rounded-lg border p-1 shadow-xl group-hover:block ${theme.header}`}>
                {n.children.map((c) => (
                  <Link key={c.href} href={c.href}
                    className={`block rounded-md px-3 py-2 text-sm font-semibold ${active(c.href) ? theme.navActive : theme.navIdle}`}>
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link key={n.href} href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active(n.href) ? theme.navActive : theme.navIdle}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* MANAGER 전용: 버즈↔매니저 admin 뷰 전환 */}
          {canToggle && (
            <button
              onClick={toggleView}
              className={`hidden shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold sm:block ${theme.outlineBtn}`}
              title={isManager ? "버즈회원 화면으로 전환" : "관리매니저 화면으로 전환"}>
              {isManager ? "버즈admin 보기" : "매니저admin 보기"}
            </button>
          )}
          <button className={`relative grid h-9 w-9 place-items-center rounded-lg ${theme.iconBtn}`} aria-label="알림">
            <Icon name="bell" className="h-5 w-5" />
          </button>
          {/* 계정명 클릭 → 내정보 수정 */}
          <Link href="/buzz/profile"
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${pathname.startsWith("/buzz/profile") ? theme.acctActive : theme.acctIdle}`}>
            {name ? `${name}님` : "내 정보"}
          </Link>
          <button onClick={() => { clearToken(); goToLogin(); }} className={`grid h-9 w-9 place-items-center rounded-lg ${theme.iconBtn}`} aria-label="로그아웃">
            <Icon name="logout" className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <nav className={`flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden ${theme.mobileBorder}`}>
        {nav.flatMap((n) => n.children ?? [n]).map((n) => (
          <Link key={n.href} href={n.href} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${active(n.href) ? theme.navActive : theme.navIdle}`}>{n.label}</Link>
        ))}
      </nav>
    </header>
  );
}
