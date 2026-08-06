import { PageHead } from "@/components/buzz/BuzzUI";
import MemberForm from "@/components/buzz/MemberForm";

export default function BuzzMemberNewPage() {
  return (
    <div>
      <PageHead title="회원 등록" sub="내 네트워크 회원 등록 · 역할 버즈 고정, 추천인 자동 저장" />
      <MemberForm mode="new" />
    </div>
  );
}
