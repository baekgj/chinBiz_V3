import AuthGuard from "@/components/AuthGuard";
import { BuzzProvider } from "@/components/buzz/theme";
import BuzzShell from "@/components/buzz/BuzzShell";
import PaymentGate from "@/components/payment/PaymentGate";

export default function BuzzLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allow={["BUZZ", "MANAGER"]}>
      <PaymentGate paymentPath="/buzz/payment" />
      <BuzzProvider>
        <BuzzShell>{children}</BuzzShell>
      </BuzzProvider>
    </AuthGuard>
  );
}
