import PaymentPanel from "@/components/payment/PaymentPanel";

/** 센터 회비결제 화면 — [결제] 안내 화면에서 [동의하기] 후 진입 (docs/36) */
export default function CenterPaymentPayPage() {
  return (
    <div className="animate-float-up">
      <PaymentPanel homePath="/center" />
    </div>
  );
}
