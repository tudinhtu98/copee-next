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
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (v) => {
    setIsLoading(true);
    try {
      const { signIn } = await import("next-auth/react");
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/dashboard";
      const r = await signIn("credentials", {
        redirect: false,
        email: v.email,
        password: v.password,
      });
      if (r?.error) throw new Error(r.error);
      toast.success("Đăng nhập thành công!");
      window.location.href = next;
    } catch (e) {
      toast.error((e as any).message);
      setIsLoading(false);
    }
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>Đăng nhập vào Copee</CardDescription>
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
              placeholder="Mật khẩu"
              type="password"
              {...form.register("password")}
              disabled={isLoading}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-center justify-center">
        <p className="text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Đăng ký
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
