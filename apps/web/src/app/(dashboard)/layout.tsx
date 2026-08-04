import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@flux-finance/ui/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { AuthGuard } from "@/features/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <Suspense fallback={<div className="w-(--sidebar-width) border-r border-sidebar-border" />}>
          <AppSidebar />
        </Suspense>
        <SidebarInset>
          <DashboardHeader />
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
