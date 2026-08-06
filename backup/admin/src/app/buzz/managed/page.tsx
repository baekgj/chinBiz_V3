import { PageHead } from "@/components/buzz/BuzzUI";
import ManagerSalesSection from "@/components/buzz/sections/ManagerSalesSection";

export default function BuzzManagedPage() {
  return (
    <div>
      <PageHead title="영업관리" sub="2차영업관리 · 내가 배정받은 관리영업 진행" />
      <ManagerSalesSection mode="managed" />
    </div>
  );
}
