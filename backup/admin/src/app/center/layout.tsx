import AuthGuard from "@/components/AuthGuard";
import AgreementGate from "@/components/AgreementGate";
import CenterTopbar from "@/components/center/CenterTopbar";
import { ct } from "@/components/center/CenterUI";

export default function CenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allow={["CENTER_ADMIN"]}>
      <div className={ct.page}>
        <CenterTopbar />
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
      {/* 센터 담당자 최초 로그인 시 [센터 이용약관] 동의 게이트 */}
      <AgreementGate code="CENTER" fallbackTitle="센터 이용약관" />
    </AuthGuard>
  );
}
