import { PageHead } from "@/components/center/CenterUI";
import CenterDashboard from "@/components/center/sections/CenterDashboard";

export default function CenterSummaryPage() {
  return (
    <div>
      <PageHead title="센터 상품 관제 & 리드 배정 대시보드" sub="관할 구역 상품 관제 · 매니저 가동 · 센터 오버라이딩 수수료" />
      <CenterDashboard />
    </div>
  );
}
