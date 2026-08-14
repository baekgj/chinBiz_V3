"use client";

import { PageHead } from "@/components/buzz/BuzzUI";
import { useBuzz } from "@/components/buzz/theme";
import DashboardSection from "@/components/buzz/sections/DashboardSection";
import ManagerDashboardSection from "@/components/buzz/sections/ManagerDashboardSection";

export default function BuzzHomePage() {
  const { isManager } = useBuzz();
  return (
    <div className="animate-float-up">
      <PageHead title="대시보드" sub={isManager ? "관할 지역 · 배정 · 2차 영업 요약" : "나의 성과 · 영업 · 네트워크 요약"} />
      {isManager ? <ManagerDashboardSection /> : <DashboardSection />}
    </div>
  );
}
