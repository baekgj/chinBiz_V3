import { PageHead } from "@/components/buzz/BuzzUI";
import ManagerApplyForm from "@/components/buzz/ManagerApplyForm";

export default function BuzzManagerApplyPage() {
  return (
    <div>
      <PageHead title="매니저 신청하기" sub="지역본부·센터 선택 후 관리매니저 승급 신청" />
      <ManagerApplyForm />
    </div>
  );
}
