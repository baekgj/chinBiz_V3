import { PageHead } from "@/components/division/DivisionUI";
import DivisionSettlementSection from "@/components/division/sections/DivisionSettlementSection";

export default function DivisionSettlementPayoutsPage() {
  return (
    <div>
      <PageHead title="수당지급현황" sub="구매확정(MP) 완료된 본부 확정수당 지급 원장" />
      <DivisionSettlementSection scope="payouts" />
    </div>
  );
}
