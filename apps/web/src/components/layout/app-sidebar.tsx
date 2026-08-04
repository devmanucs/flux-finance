"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BankIcon,
  DashboardSquare01Icon,
  Logout03Icon,
  MoneyExchange01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import {
  Avatar,
  AvatarFallback,
} from "@flux-finance/ui/components/ui/avatar";
import { Button } from "@flux-finance/ui/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@flux-finance/ui/components/ui/sidebar";
import { Icon } from "@flux-finance/ui/components/ui/icon";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useAccounts } from "@/features/accounts";
import { useTransactions } from "@/features/transactions";
import { getStatusCounts, PAYMENT_STATUS_META, type PaymentStatus } from "@/lib/payment-status";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/transactions", label: "Transações", icon: MoneyExchange01Icon },
  { href: "/accounts", label: "Contas Bancárias", icon: BankIcon },
  { href: "/categories", label: "Categorias", icon: Tag01Icon },
];

const STATUS_ITEMS: PaymentStatus[] = ["overdue", "due_soon", "paid"];

function formatCount(count: number) {
  return String(count).padStart(2, "0");
}

function userInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { mutate: logout } = useLogout();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const statusCounts = getStatusCounts([...accounts, ...transactions]);
  const activeStatus = searchParams.get("status");

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="inline-block size-2 shrink-0 rounded-full bg-sidebar-foreground" />
          <span className="font-heading text-lg font-semibold tracking-tight">Flux Finance</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive && !(item.href === "/accounts" && activeStatus)}
                    >
                      <Icon icon={item.icon} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
            Status
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {STATUS_ITEMS.map((status) => {
                const meta = PAYMENT_STATUS_META[status];
                const href = `/accounts?status=${status}`;
                const isActive = pathname === "/accounts" && activeStatus === status;

                return (
                  <SidebarMenuItem key={status}>
                    <SidebarMenuButton render={<Link href={href} />} isActive={isActive}>
                      <span
                        className={`size-2 shrink-0 rounded-full ${meta.dotClassName}`}
                        aria-hidden
                      />
                      <span>{meta.label}</span>
                      <SidebarMenuBadge className="rounded-full bg-sidebar-accent px-1.5 text-[11px] text-sidebar-accent-foreground">
                        {formatCount(statusCounts[status])}
                      </SidebarMenuBadge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        {user ? (
          <div className="flex items-center gap-2.5 rounded-2xl bg-sidebar-accent/60 px-2.5 py-2">
            <Avatar size="sm">
              <AvatarFallback>{userInitials(user.name) || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => logout(undefined, { onSuccess: () => router.push("/login") })}
        >
          <Icon icon={Logout03Icon} data-icon="inline-start" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
