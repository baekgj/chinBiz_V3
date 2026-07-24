import { PageHead } from "@/components/center/CenterUI";
import CenterSettlementSection from "@/components/center/sections/CenterSettlementSection";

export default function CenterSettlementBuzzPage() {
  return (
    <div>
      <PageHead title="버즈회원 영업 정산현황" sub="소속 버즈 1차 영업 기반 센터 소속수당 원장" />
      <CenterSettlementSection scope="buzz" />
    </div>
  );
}
