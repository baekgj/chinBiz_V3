import { PageHead } from "@/components/buzz/BuzzUI";
import EducationSection from "@/components/buzz/sections/EducationSection";

export default function BuzzEducationPage() {
  return (
    <div>
      <PageHead title="교육 관리" sub="파트너사 상품 교육 이수 및 승인 현황" />
      <EducationSection />
    </div>
  );
}
