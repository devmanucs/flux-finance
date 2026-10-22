import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@flux-finance/ui/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { AuthGuard } from "@/features/auth";
import { PluggySyncWatcher } from "@/features/pluggy/components/pluggy-connections-panel";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PluggySyncWatcher />
      <SidebarProvider>
        <Suspense fallback={<div className="w-(--sidebar-width) border-r border-sidebar-border" />}>
          <AppSidebar />
        </Suspense>
        <SidebarInset>
          <DashboardHeader />
          <main className="flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
