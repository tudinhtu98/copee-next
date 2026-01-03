"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", username: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (v) => {
    setIsLoading(true);
    try {
      // Đăng ký tài khoản - call thẳng backend
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.copee.vn";
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: v.email,
          username: v.username,
          password: v.password,
        }),
      });

      // Xử lý response cẩn thận để tránh lỗi parse JSON
      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        if (!res.ok) {
          throw new Error(`Đăng ký thất bại (Lỗi ${res.status}). Vui lòng thử lại.`);
        }
        data = {};
      }

      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");

      toast.success("Đăng ký thành công! Đang đăng nhập...");

      // Tự động đăng nhập
      const { signIn } = await import("next-auth/react");
      const r = await signIn("credentials", {
        redirect: false,
        email: v.email,
        password: v.password,
      });

      if (r?.error) {
        toast.error("Đăng ký thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập thủ công.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      toast.success("Đăng nhập thành công!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (e) {
      toast.error((e as any).message);
      setIsLoading(false);
    }
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Đăng ký</CardTitle>
        <CardDescription>Tạo tài khoản Copee</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          type="button"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            try {
              const { signIn } = await import("next-auth/react");
              await signIn("google", { callbackUrl: "/dashboard" });
            } catch (e) {
              toast.error("Đăng ký với Google thất bại");
              setIsLoading(false);
            }
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Đăng ký với Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Hoặc
            </span>
          </div>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <Input
              placeholder="Email"
              type="email"
              {...form.register("email")}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              placeholder="Tên đăng nhập"
              {...form.register("username")}
              disabled={isLoading}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              type="password"
              {...form.register("password")}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-center justify-center">
        <p className="text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
