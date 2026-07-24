import AuthGuard from "@/components/AuthGuard";
import { BuzzProvider } from "@/components/buzz/theme";
import BuzzShell from "@/components/buzz/BuzzShell";

export default function BuzzLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allow={["BUZZ", "MANAGER"]}>
      <BuzzProvider>
        <BuzzShell>{children}</BuzzShell>
      </BuzzProvider>
    </AuthGuard>
  );
}
