import { PageHead } from "@/components/center/CenterUI";
import ProfileForm from "@/components/center/ProfileForm";

export default function CenterProfilePage() {
  return (
    <div>
      <PageHead title="내 정보 수정" sub="담당자·연락처·계좌·비밀번호 변경" />
      <ProfileForm />
    </div>
  );
}
