import { PageHead } from "@/components/division/DivisionUI";
import ReferredCentersList from "@/components/division/ReferredCentersList";

/** 센터관리 › 추천등록센터List (docs/37) */
export default function DivisionReferredCentersPage() {
  return (
    <div>
      <PageHead title="추천등록센터 List" sub="본부에서 직접 등록(추천)한 센터 목록" />
      <ReferredCentersList />
    </div>
  );
}
