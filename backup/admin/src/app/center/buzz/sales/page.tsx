import { PageHead } from "@/components/center/CenterUI";
import SalesAggSection from "@/components/center/sections/SalesAggSection";
import SalesListSection from "@/components/center/sections/SalesListSection";

export default function CenterBuzzSalesPage() {
  return (
    <div className="space-y-5">
      <PageHead title="1차영업관리" sub="소속 버즈회원의 1차 영업 상품별 합산 + 개별 신청 내역" />
      <SalesAggSection scope="buzz" />
      <SalesListSection scope="buzz" />
    </div>
  );
}
