import type { Metadata } from "next";
import "./globals.css";
import HashScroll from "@/components/site/HashScroll";

export const metadata: Metadata = {
  title: "친비즈(ChinBiz) · 영업대행 ERP 플랫폼",
  description:
    "계약부터 정산까지, 영업의 모든 흐름을 한 곳에서. 친비즈는 영업 파트너와 기업을 연결하고 실시간 성과·수당 정산을 자동화하는 영업대행 ERP입니다.",
};

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
