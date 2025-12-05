"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() as any;
  const role = session?.user?.role;

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    if (pathname === "/dashboard") return "overview";
    if (pathname.startsWith("/dashboard/products")) return "products";
    if (pathname.startsWith("/dashboard/upload-jobs")) return "upload-jobs";
    if (pathname.startsWith("/dashboard/categories")) return "categories";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    if (pathname.startsWith("/dashboard/user-settings")) return "user-settings";
    if (pathname.startsWith("/dashboard/billing")) return "billing";
    return "overview";
  };

  const navItems = [
    { value: "overview", href: "/dashboard", label: "Tổng quan" },
    { value: "products", href: "/dashboard/products", label: "Sản phẩm" },
    { value: "upload-jobs", href: "/dashboard/upload-jobs", label: "Xử lý Upload" },
    { value: "categories", href: "/dashboard/categories", label: "Danh mục" },
    { value: "settings", href: "/dashboard/settings", label: "Cài đặt WordPress" },
    { value: "user-settings", href: "/dashboard/user-settings", label: "API Key cho Extension" },
    { value: "billing", href: "/dashboard/billing", label: "Nạp tiền & Lịch sử" },
  ];

  if (role === "ADMIN" || role === "MOD") {
    navItems.push({ value: "admin", href: "/admin", label: "Admin" });
  }

  return (
    <aside className="w-64 shrink-0 border-r p-4">
      <div className="font-semibold mb-6 text-lg">Copee</div>
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

