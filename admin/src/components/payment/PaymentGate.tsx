"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiGet } from "@/lib/api";

type FeeOption = { baseFee: number };
type PayInfo = { payerType: "USER" | "PARTNER"; feeOptions: FeeOption[]; expired?: boolean; entryFeePaid?: boolean };

/**
 * 결제 게이트 — 회비 만기(매니저/센터) 또는 입점비 미납(파트너) 시 결제 메뉴로 강제 이동.
 * 다른 메뉴를 열어도 결제 페이지로 리다이렉트. 납부 완료(만기 연장/입점비 납부)되면 해제.
 * 결제 대상이 아니거나(BUZZ 등 403) 설정된 회비가 0원이면 게이트 미적용(잠금 방지).
 */
export default function PaymentGate({ paymentPath }: { paymentPath: string }) {
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    apiGet<PayInfo>("/api/payment/info").then((r) => {
      if (!alive || !r.ok || !r.data) return; // 비대상(403) 등 → 게이트 없음
      const d = r.data;
      const hasFee = d.feeOptions.some((o) => o.baseFee > 0);
      if (!hasFee) return; // 금액 미설정 → 잠금 방지
      const gated =
        (d.payerType === "USER" && d.expired === true) ||
        (d.payerType === "PARTNER" && d.entryFeePaid === false);
      if (gated && pathname !== paymentPath) window.location.href = paymentPath;
    });
    return () => { alive = false; };
  }, [pathname, paymentPath]);

  return null;
}
