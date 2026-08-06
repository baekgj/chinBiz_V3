import { PageHead } from "@/components/division/DivisionUI";
import ProfileForm from "@/components/division/ProfileForm";

export default function DivisionProfilePage() {
  return (
    <div>
      <PageHead title="내 정보 수정" sub="담당자·연락처·계좌·비밀번호 변경" />
      <ProfileForm />
    </div>
  );
}
