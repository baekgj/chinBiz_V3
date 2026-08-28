import { PageHead } from "@/components/partner/PartnerUI";
import BillingSection from "@/components/partner/sections/BillingSection";

export default function PartnerBillingPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="친비즈 본사 지급 수당 및 예치금 현황" sub="파트너사가 친비즈 플랫폼 전체에 최종 지급해야 하는 수당 총액 및 정산 예치금 관리" />
      <BillingSection />
    </div>
  );
}
