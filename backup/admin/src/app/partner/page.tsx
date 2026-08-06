import { PageHead } from "@/components/partner/PartnerUI";
import BillingSection from "@/components/partner/sections/BillingSection";

export default function PartnerBillingPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="정산 / 수당 현황" sub="친비즈 본사 지급 수당 및 예치금(B2B Billing Hub)" />
      <BillingSection />
    </div>
  );
}
