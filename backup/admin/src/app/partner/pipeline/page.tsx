import { PageHead } from "@/components/partner/PartnerUI";
import SalesSection from "@/components/partner/sections/SalesSection";

export default function PartnerPipelinePage() {
  return (
    <div className="animate-float-up">
      <PageHead title="영업 현황" sub="실시간 상품 영업 및 고객정보 현황" />
      <SalesSection />
    </div>
  );
}
