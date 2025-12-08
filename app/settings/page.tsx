"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/src/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// Change Password Form Component
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setIsChanging(true);
      const res = await apiFetch("/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Không thể đổi mật khẩu");
      }

      toast.success("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Nhập mật khẩu hiện tại"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
        />
      </div>
      <Button
        onClick={handleChangePassword}
        disabled={
          isChanging ||
          !currentPassword ||
          !newPassword ||
          !confirmPassword ||
          newPassword !== confirmPassword
        }
      >
        {isChanging ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession() as any;

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Cài đặt tài khoản</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin tài khoản và mật khẩu của bạn
          </p>
        </div>

        {/* Account Settings */}
        <div className="rounded-md border p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Thông tin tài khoản</h2>
          </div>

          {/* Account Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="mt-1 text-sm text-muted-foreground">
                {session?.user?.email || "-"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <div className="mt-1 text-sm text-muted-foreground">
                {session?.user?.username || "-"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Vai trò</label>
              <div className="mt-1">
                <Badge variant="secondary">
                  {session?.user?.role === "ADMIN"
                    ? "Administrator"
                    : session?.user?.role === "MOD"
                    ? "Moderator"
                    : "User"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-base font-semibold">Đổi mật khẩu</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Thay đổi mật khẩu của bạn
              </p>
            </div>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
