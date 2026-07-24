import { PageHead } from "@/components/division/DivisionUI";
import PipelineSection from "@/components/division/sections/PipelineSection";

export default function DivisionPipelinePage() {
  return (
    <div>
      <PageHead title="센터 영업관리" sub="본부 관할 산하 센터의 1·2차 영업 인프라 가동 현황" />
      <PipelineSection />
    </div>
  );
}
