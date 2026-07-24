"use client";

import { usePathname } from "next/navigation";
import { titleForPath } from "./nav";
import { clearToken, goToLogin } from "@/lib/auth";
import Icon from "./Icon";

export default function Topbar() {
  const pathname = usePathname();
  const item = titleForPath(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-navy-950/80 px-6 backdrop-blur-md">
      <div>
        <h1 className="text-lg font-black text-white">{item.label}</h1>
        <p className="text-xs text-slate-500">{item.desc}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-pos/30 bg-pos/10 px-3 py-1.5 text-xs font-semibold text-pos sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-pos" /> 실시간 정산 연동
        </span>
        <button className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-navy-800 hover:text-slate-100" aria-label="알림">
          <Icon name="bell" className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-danger text-[9px] font-bold text-white">3</span>
        </button>
        <button
          onClick={() => { clearToken(); goToLogin(); }}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-navy-800 hover:text-slate-100"
          aria-label="로그아웃"
        >
          <Icon name="logout" className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
