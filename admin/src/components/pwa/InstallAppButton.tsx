"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

// beforeinstallprompt (표준 미포함 타입)
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

/**
 * PWA 설치(홈 화면 추가) 배너 — 로그인 후, 아직 설치 전일 때만 노출.
 *  - Android/Chrome: beforeinstallprompt 캡처 → [설치] 버튼으로 네이티브 설치 프롬프트 실행.
 *  - iOS Safari: 프롬프트 API 미지원 → 공유 → '홈 화면에 추가' 안내 표시.
 * 루트 레이아웃에 상시 마운트(모든 역할 공용). 세션 내 닫기(✕)·설치완료 시 숨김.
 */
export default function InstallAppButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;               // 이미 설치(앱 실행) 상태 → 배너 불필요
    if (!getToken()) return;                   // 로그인 후에만 노출

    const onBIP = (e: Event) => {
      e.preventDefault();                      // 브라우저 기본 미니 인포바 억제 → 커스텀 버튼으로 유도
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    const onInstalled = () => { setVisible(false); setDeferred(null); };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari 는 beforeinstallprompt 가 없으므로 안내 모드로 노출
    if (isIOS()) { setIos(true); setVisible(true); }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  async function install() {
    if (ios) { setIosHelp((v) => !v); return; }
    if (!deferred) return;
    await deferred.prompt();
    try { await deferred.userChoice; } catch { /* noop */ }
    setDeferred(null);
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-navy-900/95 p-3 shadow-2xl backdrop-blur">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-xl">📲</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">친비즈 앱 설치</p>
          <p className="truncate text-xs text-slate-300">홈 화면에 추가하면 앱처럼 바로 실행할 수 있어요.</p>
        </div>
        <button onClick={install}
          className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90">
          {ios ? "설치 방법" : "설치하기"}
        </button>
        <button onClick={() => setVisible(false)} aria-label="닫기"
          className="shrink-0 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">✕</button>
      </div>

      {/* iOS 안내 */}
      {ios && iosHelp && (
        <div className="mx-auto mt-2 max-w-2xl rounded-2xl border border-white/10 bg-navy-900/95 p-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
          <p className="font-bold text-white">iPhone / iPad 설치 방법</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-300">
            <li>Safari 하단(또는 상단)의 <b>공유</b> 버튼 <span className="font-mono">⬆︎</span> 을 누릅니다.</li>
            <li>메뉴에서 <b>‘홈 화면에 추가’</b> 를 선택합니다.</li>
            <li><b>추가</b> 를 누르면 홈 화면에 친비즈 앱 아이콘이 생성됩니다.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
