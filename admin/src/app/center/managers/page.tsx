import { PageHead } from "@/components/center/CenterUI";
import ManagerApprovedSection from "@/components/center/sections/ManagerApprovedSection";

export default function CenterManagersPage() {
  return (
    <div>
      <PageHead title="소속 매니저 관리" sub="매니저 신청 승인 및 소속 관리매니저 현황" />
      <ManagerApprovedSection />
    </div>
  );
}
