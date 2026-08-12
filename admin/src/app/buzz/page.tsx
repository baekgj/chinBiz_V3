"use client";

import { PageHead } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import DashboardSection from "@/components/buzz/sections/DashboardSection";
import WalletSection from "@/components/buzz/sections/WalletSection";

export default function BuzzHomePage() {
  const { isManager } = useBuzz();
  return (
    <div className="animate-float-up">
      <PageHead title="대시보드" sub={isManager ? "실시간 수당 현황" : "나의 성과 · 영업 · 네트워크 요약"} />
      {isManager ? <WalletSection /> : <DashboardSection />}
    </div>
  );
}
