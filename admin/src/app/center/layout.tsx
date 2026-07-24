import AuthGuard from "@/components/AuthGuard";
import CenterTopbar from "@/components/center/CenterTopbar";
import { ct } from "@/components/center/CenterUI";

export default function CenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allow={["CENTER_ADMIN"]}>
      <div className={ct.page}>
        <CenterTopbar />
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
