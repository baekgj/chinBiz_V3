import PaymentPanel from "@/components/payment/PaymentPanel";

/** 매니저 회비결제 화면 — [결제] 안내 화면에서 [동의하기] 후 진입 (docs/36) */
export default function BuzzPaymentPayPage() {
  return (
    <div className="animate-float-up">
      <PaymentPanel homePath="/buzz" />
    </div>
  );
}
