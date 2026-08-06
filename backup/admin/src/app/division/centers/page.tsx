import { PageHead } from "@/components/division/DivisionUI";
import CentersSection from "@/components/division/sections/CentersSection";

export default function DivisionCentersPage() {
  return (
    <div>
      <PageHead title="산하 센터별 1차 영업(버즈) 모니터링" sub="산하 센터들의 마케팅/리쿠르팅 볼륨과 1차 영업 상품 집중도 분석" />
      <CentersSection />
    </div>
  );
}
