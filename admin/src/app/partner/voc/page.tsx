import { PageHead } from "@/components/partner/PartnerUI";
import VocSection from "@/components/partner/sections/VocSection";

export default function PartnerVocPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="민원 센터" sub="VOC · 고객 민원 접수 현황" />
      <VocSection />
    </div>
  );
}
