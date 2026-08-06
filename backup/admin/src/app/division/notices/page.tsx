import { PageHead } from "@/components/division/DivisionUI";
import NoticesSection from "@/components/division/sections/NoticesSection";

export default function DivisionNoticesPage() {
  return (
    <div>
      <PageHead title="본사 공지 및 프로모션" sub="본사에서 전달하는 광역 본부 대상 공지·정책·프로모션" />
      <NoticesSection />
    </div>
  );
}
