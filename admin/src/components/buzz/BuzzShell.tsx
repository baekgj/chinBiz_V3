"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBuzz } from "@/components/buzz/theme";
import BuzzTopbar from "@/components/buzz/BuzzTopbar";

// 뷰 전용 라우트 (대시보드·마켓·공지사항·내정보는 공용) — 네트워크는 버즈 전용
const BUZZ_ONLY = ["/buzz/pipeline", "/buzz/network"];
const MANAGER_ONLY = ["/buzz/intake", "/buzz/managed", "/buzz/education", "/buzz/payment"];

export default function BuzzShell({ children }: { children: React.ReactNode }) {
  const { theme, isManager, canToggle, setView, loaded } = useBuzz();
  const pathname = usePathname();
  const router = useRouter();

  // 현재 뷰에서 접근 불가한 상대 뷰 전용 화면이면 대시보드로 리다이렉트
  useEffect(() => {
    if (!loaded) return;
    // 영업 상세(/buzz/pipeline/<숫자>)는 매니저도 열람 가능(버즈1차접수/2차관리에서 고객명 클릭 진입)
    const isPipelineDetail = /^\/buzz\/pipeline\/\d+$/.test(pathname);
    const inBuzzOnly = BUZZ_ONLY.some((p) => pathname.startsWith(p)) && !isPipelineDetail;
    const inManagerOnly = MANAGER_ONLY.some((p) => pathname.startsWith(p));
    // 결제 페이지는 회비 만기 시 PaymentGate 가 강제 이동시키는 곳 — 매니저가 [B] 뷰여도 대시보드로 되돌리면
    // Gate(/buzz/payment) ↔ Shell(/buzz) 무한 리다이렉트가 생기므로, 매니저 뷰로 전환해 그대로 보여준다.
    const isPayment = pathname === "/buzz/payment" || pathname.startsWith("/buzz/payment/");
    if (isManager && inBuzzOnly) router.replace("/buzz");
    else if (!isManager && inManagerOnly) {
      if (isPayment && canToggle) setView("manager");
      else router.replace("/buzz");
    }
  }, [pathname, isManager, canToggle, setView, loaded, router]);

  return (
    <div className={`min-h-screen ${theme.page}`}>
      <BuzzTopbar />
      {/* 대시보드는 하단 고정 [앱설치하기] 버튼에 가리지 않도록 여백 확보(docs/32) */}
      <main className={`mx-auto max-w-6xl px-4 py-6 sm:px-5 ${pathname === "/buzz" ? "pb-24" : ""}`}>{children}</main>
    </div>
  );
}
