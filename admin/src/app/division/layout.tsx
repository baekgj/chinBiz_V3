import AuthGuard from "@/components/AuthGuard";
import DivisionTopbar from "@/components/division/DivisionTopbar";
import { dv } from "@/components/division/DivisionUI";

export default function DivisionLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allow={["DIVISION_ADMIN"]}>
      <div className={dv.page}>
        <DivisionTopbar />
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
