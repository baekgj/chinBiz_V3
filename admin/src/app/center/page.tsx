import { PageHead } from "@/components/center/CenterUI";
import WalletSection from "@/components/center/sections/WalletSection";

export default function CenterSummaryPage() {
  return (
    <div>
      <PageHead title="센터 실시간 정산 및 자산 현황판" sub="하부 조직(버즈 + 매니저) 전체 활동 결과로 센터 계정에 누적되는 정산 자산" />
      <WalletSection />
    </div>
  );
}
