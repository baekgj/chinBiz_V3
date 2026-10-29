"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, mediaUrl } from "@/lib/api";

type AdImage = { imageUrl: string; mobileUrl?: string | null; linkUrl?: string | null; altText?: string | null; width?: number | null; height?: number | null };
type Ad = { id: number; areaId: string; adType: "SLIDE" | "BANNER" | "LAYER_POPUP"; title?: string | null; images: AdImage[] };

const POPUP_HIDE_KEY = (id: number) => `chinbiz_ad_popup_hide_${id}`;
const today = () => new Date().toISOString().slice(0, 10);

/** PC/모바일 이미지 분기 — 모바일(767px 이하)은 리사이징된 모바일본 사용 */
function AdPicture({ img, className, eager }: { img: AdImage; className: string; eager?: boolean }) {
  return (
    <picture>
      {img.mobileUrl && <source media="(max-width: 767px)" srcSet={mediaUrl(img.mobileUrl)} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(img.imageUrl)} alt={img.altText || "친비즈 광고"} className={className}
        width={img.width ?? undefined} height={img.height ?? undefined}
        loading={eager ? "eager" : "lazy"} draggable={false} />
    </picture>
  );
}

function AdLink({ img, children }: { img: AdImage; children: React.ReactNode }) {
  if (!img.linkUrl) return <>{children}</>;
  const external = /^https?:\/\//i.test(img.linkUrl);
  return (
    <a href={img.linkUrl} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block">
      {children}
    </a>
  );
}

/** 슬라이드형 — 자동 넘김(5초) · 좌우 화살표 · 인디케이터 · 터치 스와이프 · 마우스 오버 시 일시정지 */
function AdSlider({ ad }: { ad: Ad }) {
  const n = ad.images.length;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const go = useCallback((i: number) => setIdx(((i % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n, paused]);

  // 첫 이미지 비율로 영역 높이 고정(레이아웃 흔들림 방지). 비율 정보 없으면 3:1
  const first = ad.images[0];
  const ratio = first?.width && first?.height ? `${first.width} / ${first.height}` : "3 / 1";

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-forest-50 shadow-sm"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const start = touchX.current; touchX.current = null; setPaused(false);
        if (start == null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      }}
      role="region" aria-roledescription="carousel" aria-label={ad.title || "광고"}>
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {ad.images.map((img, i) => (
          <div key={i} className="w-full shrink-0" style={{ aspectRatio: ratio }} aria-hidden={i !== idx}>
            <AdLink img={img}><AdPicture img={img} eager={i === 0} className="h-full w-full object-cover" /></AdLink>
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(idx - 1)} aria-label="이전 광고"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-xl text-white opacity-0 transition hover:bg-black/55 group-hover:opacity-100 sm:grid">‹</button>
          <button type="button" onClick={() => go(idx + 1)} aria-label="다음 광고"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-xl text-white opacity-0 transition hover:bg-black/55 group-hover:opacity-100 sm:grid">›</button>
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5 sm:bottom-3.5">
            {ad.images.map((_, i) => (
              <button key={i} type="button" onClick={() => go(i)} aria-label={`${i + 1}번째 광고`}
                className={`h-1.5 rounded-full transition-all sm:h-2 ${i === idx ? "w-5 bg-white sm:w-6" : "w-1.5 bg-white/55 sm:w-2"}`} />
            ))}
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white sm:hidden">{idx + 1} / {n}</span>
        </>
      )}
    </div>
  );
}

/** 배너형 — 이미지를 세로로 나열 */
function AdBanner({ ad }: { ad: Ad }) {
  return (
    <div className="space-y-3">
      {ad.images.map((img, i) => (
        <div key={i} className="overflow-hidden rounded-2xl shadow-sm">
          <AdLink img={img}><AdPicture img={img} className="h-auto w-full" /></AdLink>
        </div>
      ))}
    </div>
  );
}

/** 레이어팝업형 — 메인 진입 시 노출, [오늘 하루 보지 않기] · [닫기] (여러 이미지는 좌우 넘김) */
function AdPopup({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const n = ad.images.length;
  const img = ad.images[idx];
  function hideToday() {
    try { localStorage.setItem(POPUP_HIDE_KEY(ad.id), today()); } catch { /* noop */ }
    onClose();
  }
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/55 p-4" onClick={onClose}>
      <div className="w-full max-w-[min(92vw,420px)] overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-[480px]" onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={ad.title || "광고"}>
        <div className="relative max-h-[72vh] overflow-y-auto">
          <AdLink img={img}><AdPicture img={img} eager className="h-auto w-full" /></AdLink>
          {n > 1 && (
            <>
              <button type="button" onClick={() => setIdx((idx - 1 + n) % n)} aria-label="이전" className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white">‹</button>
              <button type="button" onClick={() => setIdx((idx + 1) % n)} aria-label="다음" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white">›</button>
              <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white">{idx + 1} / {n}</span>
            </>
          )}
        </div>
        <div className="flex border-t border-line text-sm">
          <button type="button" onClick={hideToday} className="flex-1 py-3 text-muted hover:bg-surface">오늘 하루 보지 않기</button>
          <button type="button" onClick={onClose} className="flex-1 border-l border-line py-3 font-bold text-ink hover:bg-surface">닫기</button>
        </div>
      </div>
    </div>
  );
}

/**
 * HOME 메인 광고 영역 (docs/32) — 본사 [광고관리] 게시 광고(광고위치=메인화면).
 * 슬라이드형·배너형은 히어로 아래 컨텐츠 폭(1152px)으로, 레이어팝업형은 진입 시 팝업으로 노출.
 * 이미지는 BE 업로드 시 PC 1200px / 모바일 750px 로 리사이징되어 화면 폭에 맞춰 선택된다.
 */
export default function MainAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [popups, setPopups] = useState<Ad[]>([]);

  useEffect(() => {
    apiGet<Ad[]>("/api/public/ads?position=MAIN").then((r) => {
      if (!r.ok || !r.data) return;
      setAds(r.data.filter((a) => a.adType !== "LAYER_POPUP"));
      setPopups(r.data.filter((a) => {
        if (a.adType !== "LAYER_POPUP") return false;
        try { return localStorage.getItem(POPUP_HIDE_KEY(a.id)) !== today(); } catch { return true; }
      }));
    });
  }, []);

  return (
    <>
      {ads.length > 0 && (
        <section aria-label="광고" className="mx-auto w-full max-w-6xl space-y-4 px-4 pt-8 sm:px-5 sm:pt-12">
          {ads.map((a) => (a.adType === "SLIDE" ? <AdSlider key={a.id} ad={a} /> : <AdBanner key={a.id} ad={a} />))}
        </section>
      )}
      {popups[0] && <AdPopup key={popups[0].id} ad={popups[0]} onClose={() => setPopups((p) => p.slice(1))} />}
    </>
  );
}
