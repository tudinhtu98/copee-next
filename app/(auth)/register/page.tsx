"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
});
export default function RegisterPage() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", username: "", password: "" },
  });
  const onSubmit = form.handleSubmit(async (v) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: v.email,
          username: v.username,
          password: v.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Register failed");
      window.location.href = "/login";
    } catch (e) {
      alert((e as any).message);
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
          <Input placeholder="Email" type="email" {...form.register("email")} />
          <Input placeholder="Tên đăng nhập" {...form.register("username")} />
          <Input
            placeholder="Mật khẩu"
            type="password"
            {...form.register("password")}
          />
          <Button className="w-full" type="submit">
            Đăng ký
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Đã có tài khoản? Đăng nhập
      </CardFooter>
    </Card>
  );
}
