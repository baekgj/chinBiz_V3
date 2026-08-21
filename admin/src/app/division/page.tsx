import { PageHead } from "@/components/division/DivisionUI";
import DivisionDashboard from "@/components/division/sections/DivisionDashboard";

export default function DivisionAssetPage() {
  return (
    <div>
      <PageHead title="본부 상품 통합 관제 대시보드" sub="광역 오버라이딩 수수료 · 산하 센터별 실적 비교 · 광역 프로모션" />
      <DivisionDashboard />
    </div>
  );
}
