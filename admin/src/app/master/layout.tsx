import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allow={["MASTER_ADMIN"]}>
      <div className="min-h-screen">
        <Sidebar />
        <div className="pl-64">
          <Topbar />
          <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
