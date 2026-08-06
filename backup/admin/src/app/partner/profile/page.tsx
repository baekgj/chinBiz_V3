import { PageHead } from "@/components/partner/PartnerUI";
import ProfileForm from "@/components/partner/ProfileForm";

export default function PartnerProfilePage() {
  return (
    <div className="animate-float-up">
      <PageHead title="내 정보 수정" sub="담당자·연락처·계좌·비밀번호 변경" />
      <ProfileForm />
    </div>
  );
}
