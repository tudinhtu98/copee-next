"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AppHeader() {
  const { data } = useSession() as any;
  const role = data?.user?.role;
  const username = data?.user?.username || data?.user?.name;
  const email = data?.user?.email;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = role === "ADMIN" || role === "MOD";
  
  // Determine logo link based on user role
  const getLogoHref = () => {
    if (!data?.user) return "/";
    return isAdmin ? "/admin" : "/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between">
        {/* Logo - canh lề giống tab left trong sidebar (p-4 + px-3 = 28px) */}
        <Link
          href={getLogoHref()}
          className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity pl-7"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
            <span className="text-lg font-extrabold">C</span>
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Copee
          </span>
        </Link>

        {/* User Menu / Auth Buttons */}
        <div className="flex items-center gap-3 pr-4">
            {data?.user ? (
              <>
                {/* Desktop User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center gap-2 h-9 px-3"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-medium leading-none">
                          {username}
                        </span>
                        {role && (
                          <span className="text-xs text-muted-foreground leading-none mt-0.5">
                            {role === "ADMIN"
                              ? "Administrator"
                              : role === "MOD"
                              ? "Moderator"
                              : "User"}
                          </span>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {username}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin ? (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Cài đặt tài khoản
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}
          </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && data?.user && (
        <div className="md:hidden border-t py-4 space-y-2">
          {isAdmin ? (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Cài đặt tài khoản
          </Link>
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                {username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{username}</span>
                {role && (
                  <Badge
                    variant="secondary"
                    className="text-xs mt-0.5 w-fit"
                  >
                    {role === "ADMIN"
                      ? "Administrator"
                      : role === "MOD"
                      ? "Moderator"
                      : "User"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={() => {
              signOut({ callbackUrl: "/" });
              setMobileMenuOpen(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      )}
    </header>
  );
}
