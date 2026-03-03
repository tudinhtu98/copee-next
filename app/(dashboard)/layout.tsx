import DashboardSidebar from "@/components/dashboard-sidebar";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100dvh-65px)]">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
