import PaymentPolicy from "@/components/payment/PaymentPolicy";

/** 매니저 [결제] — 관리 매니저 이용권 안내 + 유료서비스 결제 및 환불정책 → [동의하기] → 회비결제 */
export default function BuzzPaymentPage() {
  return (
    <div className="animate-float-up">
      <PaymentPolicy ticketCode="MANAGER_TICKET" ticketTitle="관리 매니저 이용권 안내" payPath="/buzz/payment/pay" />
    </div>
  );
}
