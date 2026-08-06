"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ct } from "@/components/center/CenterUI";

const TABS = [
  { href: "/center/managers/applications", label: "매니저신청" },
  { href: "/center/managers", label: "매니저관리" },
];

/** 소속 매니저 관리 소메뉴 탭 */
export default function ManagerTabs() {
  const pathname = usePathname();
  return (
    <div className={`mb-4 flex gap-1 rounded-xl border p-1 ${ct.tableWrap}`}>
      {TABS.map((t) => (
        <Link key={t.href} href={t.href}
          className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-bold ${pathname === t.href ? ct.primaryBtn : ct.cellSub}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
