import OrderManager from "@/components/OrderManager";

/** 본사 [파트너사 관리]-[주문관리] — 단순배송상품 주문(partner_order) 전체 (docs/33) */
export default function OrgOrdersPage() {
  return <OrderManager api="/api/org/orders" tone="dark" showPartner />;
}
