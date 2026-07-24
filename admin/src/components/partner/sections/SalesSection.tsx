import { Card } from "@/components/partner/PartnerUI";
import PartnerPipeline from "@/components/partner/PartnerPipeline";

/** 파트너 · 실시간 영업 현황 (실DB 연동: 내 상품에 접수된 1차 영업) */
export default function SalesSection() {
  return (
    <Card title="실시간 상품 영업 및 고객정보 현황" sub="버즈·매니저를 통해 유입된 오가닉 B2B 고객 DB 진행 상태 추적">
      <PartnerPipeline />
    </Card>
  );
}
