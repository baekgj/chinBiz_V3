import { PageHead } from "@/components/buzz/BuzzUI";
import ManagerSalesSection from "@/components/buzz/sections/ManagerSalesSection";

export default function BuzzIntakePage() {
  return (
    <div>
      <PageHead title="영업관리" sub="버즈1차접수현황 · 내 관리센터 소속 버즈의 미배정 1차영업 배정받기" />
      <ManagerSalesSection mode="intake" />
    </div>
  );
}
