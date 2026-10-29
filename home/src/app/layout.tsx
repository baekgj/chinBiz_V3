import type { Metadata } from "next";
import "./globals.css";
import HashScroll from "@/components/site/HashScroll";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, absoluteMedia, getSeo, siteUrl, splitKeywords } from "@/lib/seo";

/** 공통 메타데이터 — 본사 [환경설정] 검색엔진 메타태그(app_setting seo_*)를 적용(docs/32). 미등록 시 기본값 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  const base = siteUrl(seo);
  const title = seo.seo_title || DEFAULT_TITLE;
  const description = seo.seo_description || DEFAULT_DESCRIPTION;
  const ogImage = absoluteMedia(base, seo.seo_og_image);
  return {
    metadataBase: new URL(base),
    title,
    description,
    keywords: splitKeywords(seo.seo_keywords),
    authors: seo.seo_author ? [{ name: seo.seo_author }] : undefined,
    openGraph: {
      type: "website", locale: "ko_KR", siteName: "친비즈(ChinBiz)", title, description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: { card: ogImage ? "summary_large_image" : "summary", title, description, images: ogImage ? [ogImage] : undefined },
    robots: { index: true, follow: true },
    verification: {
      google: seo.seo_google_verification || undefined,
      other: seo.seo_naver_verification ? { "naver-site-verification": seo.seo_naver_verification } : undefined,
    },
    // 홈 화면 추가/바로가기 시에도 친비즈 로고(친)가 아이콘으로 쓰이도록 매니페스트·아이콘 지정
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "친비즈" },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-surface text-ink">
        {/* Noto Sans KR — 런타임 로드(빌드시 Google Fonts 미접속). 미접속 시 시스템 폰트로 graceful fallback */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" />
        <HashScroll />
        {children}
      </body>
    </html>
  );
}
