import { Suspense } from "react";
import { PageHead } from "@/components/buzz/BuzzUI";
import AllowancesSection from "@/components/buzz/sections/AllowancesSection";

export default function BuzzAllowancesPage() {
  return (
    <div className="animate-float-up">
      <PageHead title="수당현황" sub="수당/정산현황 · 수당(Allowance) 원장" />
      <Suspense fallback={null}>
        <AllowancesSection />
      </Suspense>
    </div>
  );
}
