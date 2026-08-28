import { PageHead } from "@/components/partner/PartnerUI";
import CommissionProductsSection from "@/components/partner/sections/CommissionProductsSection";
import LiveSalesSection from "@/components/partner/sections/LiveSalesSection";

/** 파트너 대시보드 — 위탁 상품/총수당 관리 + 실시간 영업/고객정보 현황 (partner.docx p.2~3) */
export default function PartnerDashboardPage() {
  return (
    <div className="animate-float-up space-y-8">
      <PageHead title="대시보드" sub="위탁 영업대행 상품·총수당 및 실시간 영업/고객 현황 종합 관제" />
      <CommissionProductsSection />
      <LiveSalesSection />
    </div>
  );
}
