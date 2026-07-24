import { PageHead } from "@/components/buzz/BuzzUI";
import ProfileForm from "@/components/buzz/ProfileForm";

export default function BuzzProfilePage() {
  return (
    <div className="animate-float-up">
      <PageHead title="내 정보 수정" sub="이름·연락처·주소·계좌·비밀번호 변경" />
      <ProfileForm />
    </div>
  );
}
