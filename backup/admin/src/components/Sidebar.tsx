"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, DASHBOARD_HREF } from "./nav";
import Icon from "./Icon";

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === DASHBOARD_HREF ? pathname === DASHBOARD_HREF : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-navy-900">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-lg shadow-brand-600/20">
          <Icon name="shield" className="h-5 w-5 text-white" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-black text-white">
            친비즈 <span className="text-brand-400">HQ</span>
          </p>
          <p className="text-[10px] font-semibold tracking-widest text-slate-500">MASTER ADMIN</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((n) => {
          const active = isActive(n.href);
          const sectionOpen = n.children && pathname.startsWith(n.href);
          const childActive = (href: string) =>
            href === n.href
              ? pathname === href || new RegExp(`^${href}/\\d`).test(pathname)
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <div key={n.href}>
              <Link
                href={n.href}
                className={`group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-gradient-to-r from-brand-600/25 to-cyan-500/10 text-white ring-1 ring-brand-500/40"
                    : "text-slate-400 hover:bg-navy-800 hover:text-slate-100"
                }`}
              >
                <Icon
                  name={n.icon}
                  className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"}`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{n.label}</span>
                  <span className="block truncate text-[11px] text-slate-500">{n.desc}</span>
                </span>
              </Link>
              {sectionOpen && n.children && (
                <div className="ml-6 mt-1 space-y-0.5 border-l border-line pl-3">
                  {n.children.map((c) => (
                    <Link
                      key={c.label}
                      href={c.href}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        childActive(c.href) ? "font-bold text-brand-400" : "text-slate-400 hover:text-slate-100"
                      }`}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer user */}
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl bg-navy-800 px-3 py-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-sm font-black text-white">
            운
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold text-white">최고운영자</p>
            <p className="text-[11px] text-slate-500">HQ Master · MASTER_ADMIN</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
