import { PageHead } from "@/components/partner/PartnerUI";
import OrderManager from "@/components/OrderManager";

export default function PartnerOrdersPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="주문 관리" sub="단순배송상품 주문접수 내역 및 주문상태 관리" />
      <OrderManager api="/api/partner/orders" tone="light" />
    </div>
  );
}
