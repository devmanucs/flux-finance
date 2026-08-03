"use client";

import { SidebarTrigger } from "@flux-finance/ui/components/ui/sidebar";
import { ThemeToggle } from "@flux-finance/ui/components/theme-toggle";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/80 px-6 py-3 backdrop-blur-sm">
      <SidebarTrigger />
      <div className="ml-auto flex items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}
