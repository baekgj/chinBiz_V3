import { PageHead } from "@/components/center/CenterUI";
import ManagerApplicationsSection from "@/components/center/sections/ManagerApplicationsSection";

export default function CenterManagerApplicationsPage() {
  return (
    <div>
      <PageHead title="소속 매니저 관리" sub="매니저 신청 승인 및 소속 관리매니저 현황" />
      <ManagerApplicationsSection />
    </div>
  );
}
