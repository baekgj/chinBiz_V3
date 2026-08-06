import { PageHead } from "@/components/buzz/BuzzUI";
import NetworkSection from "@/components/buzz/sections/NetworkSection";

export default function BuzzNetworkPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="버즈 네트워크" sub="친구 추천(친쿠) · 하위 버즈 수익 10% 평생 적립" />
      <NetworkSection />
    </div>
  );
}
