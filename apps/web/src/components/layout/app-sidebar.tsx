"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BankIcon,
  DashboardSquare01Icon,
  Logout03Icon,
  MoneyExchange01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@flux-finance/ui/components/ui/sidebar";
import { useCurrentUser, useLogout } from "@/features/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/transactions", label: "Transações", icon: MoneyExchange01Icon },
  { href: "/accounts", label: "Contas", icon: BankIcon },
  { href: "/categories", label: "Categorias", icon: Tag01Icon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { mutate: logout } = useLogout();

  return (
    <Sidebar>
      <SidebarHeader>
        <span className="px-2 font-heading text-lg font-semibold">Flux Finance</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                  >
                    <HugeiconsIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {user && (
            <SidebarMenuItem>
              <span className="px-2 text-xs text-muted-foreground">{user.name}</span>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout(undefined, { onSuccess: () => router.push("/login") })}
            >
              <HugeiconsIcon icon={Logout03Icon} />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
