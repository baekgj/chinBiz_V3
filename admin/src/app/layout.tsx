import type { Metadata, Viewport } from "next";
import "./globals.css";
import PushManager from "@/components/pwa/PushManager";
import InstallAppButton from "@/components/pwa/InstallAppButton";

export const metadata: Metadata = {
  title: "친비즈 · ChinBiz 워크스페이스",
  description: "친비즈 ERP 워크스페이스 — 실시간 알림·정산·영업 파이프라인",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "친비즈" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
};

// beforeinstallprompt 는 페이지 로드 초기에 1회만 발생 → React 하이드레이션 전에 놓치지 않도록
// 인라인 스크립트로 먼저 잡아 window 에 보관(InstallAppButton 이 이어받아 바로 설치 프롬프트 실행).
const CAPTURE_INSTALL_PROMPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__chinbizBIP=e;window.dispatchEvent(new Event("chinbiz:bip"));});`;

export const viewport: Viewport = {
  themeColor: "#1b4332",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: CAPTURE_INSTALL_PROMPT }} />
      </head>
      <body className="min-h-full bg-navy-950 text-slate-100">
        {/* Noto Sans KR — 런타임 로드(빌드시 Google Fonts 미접속). 미접속 시 시스템 폰트로 graceful fallback */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" />
        {children}
        <PushManager />
        <InstallAppButton />
      </body>
    </html>
  );
}
