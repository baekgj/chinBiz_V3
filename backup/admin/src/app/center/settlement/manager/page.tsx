import { PageHead } from "@/components/center/CenterUI";
import CenterSettlementSection from "@/components/center/sections/CenterSettlementSection";

export default function CenterSettlementManagerPage() {
  return (
    <div>
      <PageHead title="관리매니저 영업 정산현황" sub="소속 매니저 2차 영업 기반 센터 관리수당 원장" />
      <CenterSettlementSection scope="manager" />
    </div>
  );
}
