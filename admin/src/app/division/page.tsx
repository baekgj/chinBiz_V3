import { PageHead } from "@/components/division/DivisionUI";
import WalletSection from "@/components/division/sections/WalletSection";

export default function DivisionAssetPage() {
  return (
    <div>
      <PageHead title="본부 실시간 정산 및 광역 자산 현황판" sub="산하 모든 센터·버즈·매니저 트래픽에서 본부 배정 요율(4%)로 누적되는 광역 수익 지표" />
      <WalletSection />
    </div>
  );
}
