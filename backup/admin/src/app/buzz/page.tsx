import { PageHead } from "@/components/buzz/BuzzUI";
import WalletSection from "@/components/buzz/sections/WalletSection";

export default function BuzzHomePage() {
  return (
    <div className="animate-float-up">
      <PageHead title="실시간 수당 현황" sub="CP 예정수당 / MP 확정수당 · 직접영업 + 추천 네트워크" />
      <WalletSection />
    </div>
  );
}
