"use client";

import {
  BarChart3,
  FileText,
  Bell,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  Brain,
  Settings,
  LogOut,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

const navItems = [
  { title: "Dashboard", icon: BarChart3, href: "/dashboard" },
  { title: "Portfolio", icon: Wallet, href: "/portfolio" },
  { title: "Markets", icon: TrendingUp, href: "/markets" },
  { title: "Tax Report", icon: FileText, href: "/tax" },
  { title: "Alerts", icon: Bell, href: "/alerts" },
  { title: "Compare", icon: ArrowLeftRight, href: "/compare" },
  { title: "AI Value", icon: Brain, href: "/value" },
];

export function AppSidebar() {
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            PE
          </div>
          <span className="text-lg font-semibold tracking-tight">
            PredictEdge
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.href} />}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton className="w-full" />}>
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {user?.firstName?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">
              {user?.fullName ?? "Account"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
