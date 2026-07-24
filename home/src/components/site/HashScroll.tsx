"use client";

import { useEffect } from "react";

/**
 * 인페이지 해시 앵커(#service, #inquiry 등) 클릭 시 부드러운 스크롤 보정.
 * Next.js App Router에서 `<a href="#...">` 클릭이 해시만 바꾸고 스크롤되지 않는
 * 동작을 보완한다. scrollIntoView가 html의 scroll-padding-top(스티키 헤더 80px)을
 * 존중하므로 섹션이 헤더 아래에 정확히 안착한다.
 */
export default function HashScroll() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!el) return;
      const hash = el.getAttribute("href") || "";
      if (hash.length < 2) return; // "#" 단독은 무시
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", hash);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
