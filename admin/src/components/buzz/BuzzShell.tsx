"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBuzz } from "@/components/buzz/theme";
import BuzzTopbar from "@/components/buzz/BuzzTopbar";

// 뷰 전용 라우트 (대시보드·마켓·공지사항·내정보는 공용) — 네트워크는 버즈 전용
const BUZZ_ONLY = ["/buzz/pipeline", "/buzz/network"];
const MANAGER_ONLY = ["/buzz/intake", "/buzz/managed", "/buzz/education"];

export default function BuzzShell({ children }: { children: React.ReactNode }) {
  const { theme, isManager, loaded } = useBuzz();
  const pathname = usePathname();
  const router = useRouter();

  // 현재 뷰에서 접근 불가한 상대 뷰 전용 화면이면 대시보드로 리다이렉트
  useEffect(() => {
    if (!loaded) return;
    // 영업 상세(/buzz/pipeline/<숫자>)는 매니저도 열람 가능(버즈1차접수/2차관리에서 고객명 클릭 진입)
    const isPipelineDetail = /^\/buzz\/pipeline\/\d+$/.test(pathname);
    const inBuzzOnly = BUZZ_ONLY.some((p) => pathname.startsWith(p)) && !isPipelineDetail;
    const inManagerOnly = MANAGER_ONLY.some((p) => pathname.startsWith(p));
    if (isManager && inBuzzOnly) router.replace("/buzz");
    else if (!isManager && inManagerOnly) router.replace("/buzz");
  }, [pathname, isManager, loaded, router]);

  return (
    <div className={`min-h-screen ${theme.page}`}>
      <BuzzTopbar />
      <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
    </div>
  );
}
