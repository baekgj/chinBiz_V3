import { Suspense } from "react";
import { PageHead } from "@/components/buzz/BuzzUI";
import PipelineSection from "@/components/buzz/sections/PipelineSection";

export default function BuzzPipelinePage() {
  return (
    <div className="animate-float-up">
      <PageHead title="영업 파이프라인" sub="나의 1차 영업 진행 현황 (접수 ~ 구매확정)"
        note="영업 파이프라인은 가망고객이 계약까지 가면서 거치는 거래의 상태와 진행 단계를 보여 줍니다." />
      <Suspense fallback={null}><PipelineSection /></Suspense>
    </div>
  );
}
