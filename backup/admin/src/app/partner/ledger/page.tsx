import { PageHead } from "@/components/partner/PartnerUI";
import LedgerSection from "@/components/partner/sections/LedgerSection";

export default function PartnerLedgerPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="정산 원장" sub="내 상품의 구매확정 판매건별 총수당(위탁비) 내역" />
      <LedgerSection />
    </div>
  );
}
