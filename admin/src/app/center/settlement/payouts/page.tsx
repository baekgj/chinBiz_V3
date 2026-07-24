import { PageHead } from "@/components/center/CenterUI";
import CenterSettlementSection from "@/components/center/sections/CenterSettlementSection";

export default function CenterSettlementPayoutsPage() {
  return (
    <div>
      <PageHead title="수당지급 현황" sub="구매확정(MP) 완료된 센터 확정수당 지급 원장" />
      <CenterSettlementSection scope="payouts" />
    </div>
  );
}
