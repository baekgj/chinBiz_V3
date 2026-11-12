import PaymentPolicy from "@/components/payment/PaymentPolicy";

/** 센터 [결제] — 센터 이용권 안내 + 유료서비스 결제 및 환불정책 → [동의하기] → 회비결제 */
export default function CenterPaymentPage() {
  return (
    <div className="animate-float-up">
      <PaymentPolicy ticketCode="CENTER_TICKET" ticketTitle="센터 이용권 안내" payPath="/center/payment/pay" />
    </div>
  );
}
