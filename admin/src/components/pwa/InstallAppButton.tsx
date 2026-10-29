"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getToken } from "@/lib/auth";

// beforeinstallprompt (표준 미포함 타입)
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type BIPWindow = Window & { __chinbizBIP?: BIPEvent | null };

/** layout 인라인 스크립트가 하이드레이션 전에 잡아둔 설치 프롬프트 */
function capturedPrompt(): BIPEvent | null {
  return typeof window === "undefined" ? null : (window as BIPWindow).__chinbizBIP ?? null;
}

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
function isSamsungBrowser(): boolean {
  return typeof navigator !== "undefined" && /samsungbrowser/i.test(navigator.userAgent);
}

/** 노출 화면 — 버즈/매니저 admin 대시보드(docs/32). 그 외 페이지에선 숨김 */
const SHOW_PATH = "/buzz";

/**
 * PWA 설치(홈 화면 추가) — 버즈 admin 대시보드(/buzz) 하단에 [앱설치하기] 고정 버튼(docs/32).
 *  - 이미 설치(standalone 실행)되어 있어도 계속 노출. 다른 페이지에서는 노출하지 않음.
 *  - 클릭 시 네이티브 설치 프롬프트로 바로 설치. 프롬프트가 아직 도착 전이면 잠시 대기 후 이어서 실행.
 *  - iOS Safari: 프롬프트 API 미지원 → 공유 → '홈 화면에 추가' 안내.
 *  - 설치 불가(이미 설치됨·HTTPS 아님 등) 시 짧은 안내.
 * 루트 레이아웃에 상시 마운트(설치 프롬프트 이벤트를 놓치지 않기 위해), 경로로 노출 여부만 판단.
 */
export default function InstallAppButton() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // 설치 프롬프트 이벤트는 마운트 즉시 캡처(페이지 로드 초기에 1회만 발생)
  useEffect(() => {
    const onBIP = (e: Event) => { e.preventDefault(); (window as BIPWindow).__chinbizBIP = e as BIPEvent; setDeferred(e as BIPEvent); };
    const onCaptured = () => setDeferred(capturedPrompt());
    const onInstalled = () => { (window as BIPWindow).__chinbizBIP = null; setDeferred(null); };
    setDeferred(capturedPrompt());                // 하이드레이션 전에 이미 발생한 이벤트 이어받기
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("chinbiz:bip", onCaptured);
    window.addEventListener("appinstalled", onInstalled);
    setIos(isIOS());
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("chinbiz:bip", onCaptured);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // 페이지 이동 시 안내 닫기 + 로그인 여부 재평가
  useEffect(() => { setHelp(false); setNotice(null); setLoggedIn(!!getToken()); }, [pathname]);

  if (pathname !== SHOW_PATH || !loggedIn) return null;

  async function runPrompt(ev: BIPEvent) {
    (window as BIPWindow).__chinbizBIP = null;  // 프롬프트는 1회용
    setDeferred(null);
    await ev.prompt();
    try { await ev.userChoice; } catch { /* noop */ }
  }

  /** 프롬프트가 아직 도착 전이면 최대 ms 동안 대기 */
  function waitForPrompt(ms: number): Promise<BIPEvent | null> {
    return new Promise((resolve) => {
      const done = () => { window.removeEventListener("chinbiz:bip", done); clearTimeout(t); resolve(capturedPrompt()); };
      const t = setTimeout(done, ms);
      window.addEventListener("chinbiz:bip", done);
    });
  }

  async function install() {
    setNotice(null);
    const ev = deferred ?? capturedPrompt();
    if (ev) { await runPrompt(ev); return; }
    if (isStandalone()) { setNotice("이미 친비즈 앱으로 실행 중입니다. 홈 화면의 친비즈 아이콘으로 언제든 접속할 수 있어요."); return; }
    if (ios) { setHelp((v) => !v); return; }  // iOS Safari 는 설치 API 자체가 없어 '홈 화면에 추가'만 가능
    setWaiting(true);
    const late = await waitForPrompt(4000);
    setWaiting(false);
    if (late) { await runPrompt(late); return; }
    setNotice(`${isSamsungBrowser() ? "삼성 인터넷" : "현재 브라우저"}에서 바로 설치를 시작할 수 없습니다. `
      + "이미 설치되어 있거나 보안(HTTPS) 접속이 아닌 경우일 수 있어요. Chrome에서 https:// 주소로 접속해 다시 시도해 주세요.");
  }

  // iOS 전용 안내(설치 API 미지원) / 그 외 설치 불가·이미 설치 시 짧은 알림
  const guide = (help && ios) ? (
    <div className="mx-auto mb-2 max-w-2xl rounded-2xl border border-white/10 bg-navy-900/95 p-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-white">iPhone / iPad 설치 방법</p>
        <button onClick={() => setHelp(false)} aria-label="안내 닫기" className="text-slate-400 hover:text-white">✕</button>
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-300">
        <li>Safari 하단(또는 상단)의 <b>공유</b> 버튼 <span className="font-mono">⬆︎</span> 을 누릅니다.</li>
        <li>메뉴에서 <b>‘홈 화면에 추가’</b> 를 선택합니다.</li>
        <li><b>추가</b> 를 누르면 홈 화면에 친비즈 앱 아이콘이 생성됩니다.</li>
      </ol>
    </div>
  ) : notice ? (
    <div className="mx-auto mb-2 flex max-w-2xl items-start justify-between gap-2 rounded-2xl border border-white/10 bg-navy-900/95 p-3 text-xs text-slate-300 shadow-2xl backdrop-blur">
      <p>{notice}</p>
      <button onClick={() => setNotice(null)} aria-label="알림 닫기" className="shrink-0 text-slate-400 hover:text-white">✕</button>
    </div>
  ) : null;

  // 좌측 하단 고정 버튼 (우측 하단 '알림 켜기'와 겹치지 않게)
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pointer-events-none">
      <div className="pointer-events-auto">{guide}</div>
      <button onClick={install} disabled={waiting}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:opacity-90">
        <span>📲</span> {waiting ? "설치 준비 중…" : "앱설치하기"}
      </button>
    </div>
  );
}
