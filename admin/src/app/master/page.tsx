import MasterKpi from "@/components/master/MasterKpi";
import MasterOverview from "@/components/master/MasterOverview";

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-float-up">
      {/* KPI 스코어카드 (DB 연동) */}
      <MasterKpi />

      {/* 플랫폼 가동 현황 + 처리 대기 + 실시간 피드 (DB 연동) */}
      <MasterOverview />
    </div>
  );
}
