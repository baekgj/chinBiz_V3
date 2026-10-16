"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getToken } from "@/lib/auth";

// beforeinstallprompt (표준 미포함 타입)
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "chinbiz_install_dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS(데스크톱 UA)
}
/** 모바일 판정 — UA 우선, '데스크톱 사이트' 모드 대비 터치 + 좁은 화면 폴백 */
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  if (isIOS() || /android|mobile/i.test(navigator.userAgent)) return true;
  return !!window.matchMedia?.("(pointer: coarse)").matches && window.innerWidth <= 1024;
}
function isSamsungBrowser(): boolean {
  return typeof navigator !== "undefined" && /samsungbrowser/i.test(navigator.userAgent);
}
/** JWT payload 의 role 클레임 (서명 검증은 BE 가 담당 — 여기선 노출 여부 판단용) */
function tokenRole(token: string): string | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return (JSON.parse(atob(b64)) as { role?: string }).role ?? null;
  } catch { return null; }
}

/**
 * PWA 설치(홈 화면 추가) — 로그인 후, 아직 설치 전일 때만 노출.
 *  - 모바일 + 버즈회원(BUZZ/MANAGER): 하단 배너 + [앱설치하기] (docs/28).
 *      배너 ✕ → 좌측 하단 [앱설치하기] 플로팅 버튼으로 축소(언제든 설치 가능).
 *      클릭 시 네이티브 설치 프롬프트(가능할 때) → 불가하면 브라우저별 '홈 화면에 추가' 안내.
 *  - 그 외 역할: beforeinstallprompt 발생 시에만 배너 노출(닫으면 세션 내 숨김).
 *  - iOS Safari: 프롬프트 API 미지원 → 공유 → '홈 화면에 추가' 안내.
 * 루트 레이아웃에 상시 마운트. 페이지 이동마다 노출 조건 재평가. 설치완료/앱 실행(standalone) 시 숨김.
 */
export default function InstallAppButton() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "banner" | "pill">("hidden");
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  // 설치 프롬프트 이벤트는 로그인 여부와 무관하게 마운트 즉시 캡처(페이지 로드 초기에 1회만 발생)
  useEffect(() => {
    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => { setMode("hidden"); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    setIos(isIOS());
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // 노출 조건 평가 — 페이지 이동 / 프롬프트 수신 시마다
  useEffect(() => {
    if (isStandalone()) { setMode("hidden"); return; } // 이미 설치(앱 실행) 상태
    const token = getToken();
    if (!token) { setMode("hidden"); return; }         // 로그인 후에만 노출
    const role = tokenRole(token);
    const buzzMobile = isMobile() && (role === "BUZZ" || role === "MANAGER");
    if (!buzzMobile && !deferred && !isIOS()) { setMode("hidden"); return; }
    let dismissed = false;
    try { dismissed = !!sessionStorage.getItem(DISMISS_KEY); } catch { /* noop */ }
    if (dismissed) setMode(buzzMobile ? "pill" : "hidden");
    else setMode((prev) => (prev === "pill" ? "pill" : "banner"));
  }, [pathname, deferred]);

  if (mode === "hidden") return null;

  function close() {
    setMode("pill");
    setHelp(false);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* noop */ }
  }

  async function install() {
    if (deferred) {
      await deferred.prompt();
      try { await deferred.userChoice; } catch { /* noop */ }
      setDeferred(null);
      return;
    }
    setHelp((v) => !v);                        // 프롬프트 불가(iOS·미지원 브라우저·HTTP) → 수동 추가 안내
  }

  // 수동 설치 안내 (네이티브 프롬프트 미지원 시)
  const guide = help && (
    <div className="mx-auto mb-2 max-w-2xl rounded-2xl border border-white/10 bg-navy-900/95 p-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-white">
          {ios ? "iPhone / iPad 설치 방법" : isSamsungBrowser() ? "삼성 인터넷 설치 방법" : "Android(Chrome) 설치 방법"}
        </p>
        <button onClick={() => setHelp(false)} aria-label="안내 닫기" className="text-slate-400 hover:text-white">✕</button>
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-300">
        {ios ? (
          <>
            <li>Safari 하단(또는 상단)의 <b>공유</b> 버튼 <span className="font-mono">⬆︎</span> 을 누릅니다.</li>
            <li>메뉴에서 <b>‘홈 화면에 추가’</b> 를 선택합니다.</li>
            <li><b>추가</b> 를 누르면 홈 화면에 친비즈 앱 아이콘이 생성됩니다.</li>
          </>
        ) : isSamsungBrowser() ? (
          <>
            <li>하단의 <b>메뉴(≡)</b> 버튼을 누릅니다.</li>
            <li><b>‘현재 페이지 추가’ → ‘홈 화면’</b> 을 선택합니다.</li>
            <li><b>추가</b> 를 누르면 바탕화면에 친비즈 바로가기가 생성됩니다.</li>
          </>
        ) : (
          <>
            <li>우측 상단의 <b>메뉴(⋮)</b> 버튼을 누릅니다.</li>
            <li><b>‘홈 화면에 추가’</b> 또는 <b>‘앱 설치’</b> 를 선택합니다.</li>
            <li><b>추가/설치</b> 를 누르면 바탕화면에 친비즈 앱 아이콘이 생성됩니다.</li>
          </>
        )}
      </ol>
    </div>
  );

  // 축소 모드: 좌측 하단 플로팅 버튼 (우측 하단 '알림 켜기'와 겹치지 않게)
  if (mode === "pill") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pointer-events-none">
        <div className="pointer-events-auto">{guide}</div>
        <button onClick={install}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:opacity-90">
          <span>📲</span> 앱설치하기
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      {guide}
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-navy-900/95 p-3 shadow-2xl backdrop-blur">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-xl">📲</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">친비즈 앱 설치</p>
          <p className="truncate text-xs text-slate-300">홈 화면에 추가하면 앱처럼 바로 실행할 수 있어요.</p>
        </div>
        <button onClick={install}
          className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90">
          앱설치하기
        </button>
        <button onClick={close} aria-label="닫기"
          className="shrink-0 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">✕</button>
      </div>
    </div>
  );
}
