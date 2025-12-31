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
      // Đăng ký tài khoản
      const res = await fetch("/api/auth/register", {
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
