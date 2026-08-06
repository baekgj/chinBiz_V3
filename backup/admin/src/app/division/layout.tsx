import AuthGuard from "@/components/AuthGuard";
import AgreementGate from "@/components/AgreementGate";
import DivisionTopbar from "@/components/division/DivisionTopbar";
import { dv } from "@/components/division/DivisionUI";

export default function DivisionLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allow={["DIVISION_ADMIN"]}>
      <div className={dv.page}>
        <DivisionTopbar />
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
      {/* 본부 담당자 최초 로그인 시 [본부 이용약관] 동의 게이트 */}
      <AgreementGate code="DIVISION" fallbackTitle="본부 이용약관" />
    </AuthGuard>
  );
}
