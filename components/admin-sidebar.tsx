"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
  const pathname = usePathname();

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    if (pathname === "/admin") return "overview";
    if (pathname.startsWith("/admin/users")) return "users";
    if (pathname.startsWith("/admin/sites")) return "sites";
    if (pathname.startsWith("/admin/categories")) return "categories";
    if (pathname.startsWith("/admin/products")) return "products";
    if (pathname.startsWith("/admin/stats")) return "stats";
    return "overview";
  };

  const navItems = [
    { value: "overview", href: "/admin", label: "Tổng quan" },
    { value: "stats", href: "/admin/stats", label: "Top thống kê" },
    { value: "users", href: "/admin/users", label: "Quản lý user" },
    { value: "sites", href: "/admin/sites", label: "Quản lý Site" },
    { value: "categories", href: "/admin/categories", label: "Quản lý danh mục" },
    { value: "products", href: "/admin/products", label: "Quản lý sản phẩm" },
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
              <Link href={item.href}>{item.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </aside>
  );
}

