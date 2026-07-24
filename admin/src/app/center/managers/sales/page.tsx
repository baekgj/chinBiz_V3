import { PageHead } from "@/components/center/CenterUI";
import SalesAggSection from "@/components/center/sections/SalesAggSection";
import SalesListSection from "@/components/center/sections/SalesListSection";

export default function CenterManagerSalesPage() {
  return (
    <div className="space-y-5">
      <PageHead title="2차영업관리" sub="소속 관리매니저의 2차 영업 상품별 합산 + 개별 진행 내역" />
      <SalesAggSection scope="manager" />
      <SalesListSection scope="manager" />
    </div>
  );
}
