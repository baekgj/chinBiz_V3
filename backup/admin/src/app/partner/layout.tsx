import AuthGuard from "@/components/AuthGuard";
import PartnerTopbar from "@/components/partner/PartnerTopbar";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allow={["PARTNER"]}>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <PartnerTopbar />
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
