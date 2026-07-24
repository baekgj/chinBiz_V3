import { PageHead } from "@/components/center/CenterUI";
import BuzzMembersSection from "@/components/center/sections/BuzzMembersSection";

export default function CenterBuzzMembersPage() {
  return (
    <div>
      <PageHead title="소속버즈회원" sub="센터 소속 버즈회원 명단 · 영업/완료 현황" />
      <BuzzMembersSection />
    </div>
  );
}
