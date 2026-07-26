import { PageHead } from "@/components/buzz/BuzzUI";
import PaymentsSection from "@/components/buzz/sections/PaymentsSection";

export default function BuzzPaymentsPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="정산현황" sub="수당/정산현황 · 정산(지급) 원장" />
      <PaymentsSection />
    </div>
  );
}
