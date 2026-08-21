"use client";

import { HOME_URL } from "@/lib/auth";
import Icon from "./Icon";

/** 어드민 상단 홈 아이콘 — 클릭 시 친비즈 HOME 으로 이동 (docs/24). AlarmBell 옆 배치. */
export default function AdminHomeLink({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const cls = tone === "light"
    ? "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
    : "text-slate-300 hover:bg-white/10 hover:text-white";
  return (
    <a href={HOME_URL} title="친비즈 홈으로" aria-label="홈으로"
      className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${cls}`}>
      <Icon name="home" className="h-5 w-5" />
    </a>
  );
}
