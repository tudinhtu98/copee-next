"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboardIcon,
  BarChart3Icon,
  UsersIcon,
  GlobeIcon,
  FolderTreeIcon,
  PackageIcon,
  ScrollTextIcon,
  type LucideIcon,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    if (pathname === "/admin") return "overview";
    if (pathname.startsWith("/admin/users")) return "users";
    if (pathname.startsWith("/admin/sites")) return "sites";
    if (pathname.startsWith("/admin/categories")) return "categories";
    if (pathname.startsWith("/admin/products")) return "products";
    if (pathname.startsWith("/admin/audit-logs")) return "audit-logs";
    if (pathname.startsWith("/admin/stats")) return "stats";
    return "overview";
  };

  const navItems: { value: string; href: string; label: string; icon: LucideIcon }[] = [
    { value: "overview", href: "/admin", label: "Tổng quan", icon: LayoutDashboardIcon },
    { value: "stats", href: "/admin/stats", label: "Top thống kê", icon: BarChart3Icon },
    { value: "users", href: "/admin/users", label: "Quản lý user", icon: UsersIcon },
    { value: "sites", href: "/admin/sites", label: "Quản lý Site", icon: GlobeIcon },
    { value: "categories", href: "/admin/categories", label: "Quản lý danh mục", icon: FolderTreeIcon },
    { value: "products", href: "/admin/products", label: "Quản lý sản phẩm", icon: PackageIcon },
    { value: "audit-logs", href: "/admin/audit-logs", label: "Nhật ký hoạt động", icon: ScrollTextIcon },
  ];

  return (
    <aside className="w-64 shrink-0 border-r p-4">
      <div className="font-semibold mb-6 text-lg">Admin</div>
      <Tabs value={getCurrentTab()} className="w-full">
        <TabsList className="flex-col h-auto w-full items-start bg-transparent p-0 gap-1">
          {navItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              asChild
              className={cn(
                "w-full justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-muted-foreground"
              )}
            >
              <Link href={item.href} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </aside>
  );
}

