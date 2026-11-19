import { PageHead } from "@/components/division/DivisionUI";
import CenterRegisterForm from "@/components/division/CenterRegisterForm";

/** 센터관리 › 센터등록 (docs/37) */
export default function DivisionCenterRegisterPage() {
  return (
    <div>
      <PageHead title="센터등록" sub="광역본부·센터를 선택하고 센터 계정을 등록합니다. 현재 본부가 추천본부로 기록됩니다." />
      <CenterRegisterForm />
    </div>
  );
}
