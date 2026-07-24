"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

/** 버즈/매니저 워크스페이스 테마 토큰 (버즈=그린/골드 라이트, 매니저=블랙/차콜+골드 다크) */
export type BuzzTheme = {
  page: string;
  // topbar
  header: string; logoBox: string; brand: string; accent: string;
  navActive: string; navIdle: string; iconBtn: string; acctActive: string; acctIdle: string; mobileBorder: string;
  // card / typography
  card: string; cardHead: string; cardSub: string; h1: string; h1Sub: string;
  // stat
  statCard: string; statTone: Record<string, string>;
  // buttons / badge
  primaryBtn: string; goldBadge: string; outlineBtn: string; cancelBtn: string;
  // table
  tableWrap: string; thead: string; rowHover: string; divide: string; cellMain: string; cellSub: string;
  // status badges
  stageOn: string; stageDone: string;
  // wallet cards
  cpCard: string; cpLabel: string; mpCard: string; mpBtn: string;
  // inputs (profile)
  input: string; roBox: string; fieldLabel: string;
  // misc
  chipBox: string; codeBox: string; note: string;
};

const LIGHT: BuzzTheme = {
  page: "bg-emerald-50/40 text-slate-900",
  header: "border-emerald-100 bg-white/90",
  logoBox: "bg-gradient-to-br from-emerald-700 to-emerald-900 text-amber-300",
  brand: "text-emerald-900", accent: "text-amber-500",
  navActive: "bg-emerald-50 text-emerald-800", navIdle: "text-slate-500 hover:bg-emerald-50/60 hover:text-emerald-800",
  iconBtn: "text-slate-500 hover:bg-emerald-50", acctActive: "bg-emerald-50 text-emerald-800", acctIdle: "text-slate-600 hover:bg-emerald-50",
  mobileBorder: "border-emerald-50",
  card: "rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm",
  cardHead: "text-emerald-900", cardSub: "text-slate-500", h1: "text-emerald-900", h1Sub: "text-slate-500",
  statCard: "rounded-xl border border-emerald-100 bg-white p-4",
  statTone: { green: "text-emerald-800", gold: "text-amber-600", slate: "text-slate-800", red: "text-red-600" },
  primaryBtn: "bg-emerald-700 text-white hover:bg-emerald-800",
  goldBadge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  outlineBtn: "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
  cancelBtn: "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200",
  tableWrap: "border-emerald-100", thead: "bg-emerald-50/60 text-slate-500", rowHover: "hover:bg-emerald-50/40",
  divide: "divide-emerald-50", cellMain: "text-slate-800", cellSub: "text-slate-500",
  stageOn: "bg-emerald-100 text-emerald-700", stageDone: "bg-amber-100 text-amber-700",
  cpCard: "border border-emerald-100 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white",
  cpLabel: "text-emerald-200",
  mpCard: "border border-amber-200 bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950",
  mpBtn: "bg-amber-950/90 text-amber-100 hover:bg-amber-950",
  input: "border-emerald-200 bg-white text-slate-900 focus:border-emerald-500",
  roBox: "border-emerald-100 bg-emerald-50/50 text-slate-700",
  fieldLabel: "text-slate-500",
  chipBox: "border-emerald-100 bg-emerald-50/50 text-emerald-900",
  codeBox: "border-emerald-100 bg-emerald-50/60 text-emerald-900",
  note: "text-slate-400",
};

const DARK: BuzzTheme = {
  page: "bg-neutral-950 text-neutral-100",
  header: "border-neutral-800 bg-neutral-900/90",
  logoBox: "bg-gradient-to-br from-neutral-700 to-black text-amber-400 ring-1 ring-amber-500/30",
  brand: "text-white", accent: "text-amber-400",
  navActive: "bg-neutral-800 text-amber-300", navIdle: "text-neutral-400 hover:bg-neutral-800 hover:text-amber-200",
  iconBtn: "text-neutral-400 hover:bg-neutral-800", acctActive: "bg-neutral-800 text-amber-300", acctIdle: "text-neutral-300 hover:bg-neutral-800",
  mobileBorder: "border-neutral-800",
  card: "rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-sm",
  cardHead: "text-white", cardSub: "text-neutral-400", h1: "text-white", h1Sub: "text-neutral-400",
  statCard: "rounded-xl border border-neutral-800 bg-neutral-900 p-4",
  statTone: { green: "text-emerald-400", gold: "text-amber-400", slate: "text-neutral-100", red: "text-red-400" },
  primaryBtn: "bg-amber-500 text-neutral-950 hover:bg-amber-400",
  goldBadge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  outlineBtn: "border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
  cancelBtn: "border border-neutral-600 bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
  tableWrap: "border-neutral-800", thead: "bg-neutral-800/60 text-neutral-400", rowHover: "hover:bg-neutral-800/40",
  divide: "divide-neutral-800", cellMain: "text-neutral-100", cellSub: "text-neutral-400",
  stageOn: "bg-emerald-500/15 text-emerald-300", stageDone: "bg-amber-500/15 text-amber-300",
  cpCard: "border border-neutral-800 bg-gradient-to-br from-neutral-800 to-black text-white",
  cpLabel: "text-neutral-400",
  mpCard: "border border-amber-500/40 bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950",
  mpBtn: "bg-neutral-950 text-amber-300 hover:bg-black",
  input: "border-neutral-700 bg-neutral-950 text-neutral-100 focus:border-amber-500",
  roBox: "border-neutral-800 bg-neutral-800/50 text-neutral-300",
  fieldLabel: "text-neutral-400",
  chipBox: "border-neutral-800 bg-neutral-800/50 text-neutral-100",
  codeBox: "border-neutral-800 bg-neutral-800/60 text-amber-200",
  note: "text-neutral-500",
};

export type BuzzView = "buzz" | "manager";
// isManager = "현재 매니저 뷰로 보는 중"(테마·메뉴·수당표시 결정). role=MANAGER만 뷰 토글 가능.
type Ctx = { theme: BuzzTheme; isManager: boolean; role: string; canToggle: boolean; view: BuzzView; setView: (v: BuzzView) => void; name: string; loaded: boolean };
const BuzzCtx = createContext<Ctx>({ theme: LIGHT, isManager: false, role: "BUZZ", canToggle: false, view: "buzz", setView: () => {}, name: "", loaded: false });
export const useBuzz = () => useContext(BuzzCtx);

const VIEW_KEY = "buzz_view_mode";

export function BuzzProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setViewState] = useState<BuzzView>("buzz");

  useEffect(() => {
    apiGet<{ name: string; role: string }>("/api/auth/me").then((r) => { if (r.data) setMe(r.data); setLoaded(true); });
    // 매니저의 이전 뷰 선택 복원 (페이지 이동 간 유지)
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(VIEW_KEY) as BuzzView | null;
      if (saved === "manager" || saved === "buzz") setViewState(saved);
    }
  }, []);

  const role = me?.role ?? "BUZZ";
  const canToggle = role === "MANAGER";               // MANAGER만 버즈↔매니저 뷰 전환 가능
  const effectiveView: BuzzView = canToggle ? view : "buzz"; // BUZZ 등은 항상 버즈 뷰
  const isManager = effectiveView === "manager";
  const theme = isManager ? DARK : LIGHT;

  const setView = (v: BuzzView) => {
    setViewState(v);
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_KEY, v);
  };

  return <BuzzCtx.Provider value={{ theme, isManager, role, canToggle, view: effectiveView, setView, name: me?.name ?? "", loaded }}>{children}</BuzzCtx.Provider>;
}
