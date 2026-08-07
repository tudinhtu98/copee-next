"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { apiFetch, fetcher } from "@/src/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type Profile = {
  id: string;
  email: string;
  username: string;
  role: string;
  balance: number;
  shopeeAffiliateId: string | null;
  telegramId: string | null;
};

// Shopee Affiliate ID — dùng để tạo link aff cho sản phẩm
function ShopeeAffiliateForm() {
  const { data: profile, mutate } = useSWR<Profile>("/auth/profile", fetcher);
  const [affiliateId, setAffiliateId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAffiliateId(profile?.shopeeAffiliateId ?? "");
  }, [profile?.shopeeAffiliateId]);

  const save = async () => {
    try {
      setIsSaving(true);
      const res = await apiFetch("/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopeeAffiliateId: affiliateId.trim() }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Không thể lưu Affiliate ID");
      }

      await mutate();
      toast.success(
        affiliateId.trim()
          ? "Đã lưu Shopee Affiliate ID"
          : "Đã xoá Shopee Affiliate ID",
      );
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi lưu Affiliate ID");
    } finally {
      setIsSaving(false);
    }
  };

  const unchanged = affiliateId.trim() === (profile?.shopeeAffiliateId ?? "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shopeeAffiliateId">Shopee Affiliate ID</Label>
        <Input
          id="shopeeAffiliateId"
          value={affiliateId}
          onChange={(e) => setAffiliateId(e.target.value)}
          placeholder="Ví dụ: 17384640229"
        />
        <p className="text-sm text-muted-foreground">
          Lấy trong Shopee Affiliate Center. Sau khi lưu, bạn có thể bấm{" "}
          <b>Cập nhật link aff</b> trong chi tiết sản phẩm để sinh link tiếp
          thị. Để trống rồi lưu để xoá.
        </p>
      </div>
      <Button onClick={save} disabled={isSaving || unchanged}>
        {isSaving ? "Đang lưu..." : "Lưu Affiliate ID"}
      </Button>
    </div>
  );
}

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

// Telegram Linking Section — tạo mã để gắn Telegram vào tài khoản (dùng cho tính năng tạo video)
function TelegramLinkSection() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);

  // Đặt NEXT_PUBLIC_VIDEO_BOT_USERNAME (không kèm @) để hiện nút mở bot video.
  const botUsername = process.env.NEXT_PUBLIC_VIDEO_BOT_USERNAME;

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const s = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setRemaining(s);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const generate = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/video-bot/link-code", { method: "POST" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Không tạo được mã liên kết");
      }
      const data = await res.json();
      setCode(data.code);
      const ttl = data.expiresInSec ?? 600;
      setExpiresAt(Date.now() + ttl * 1000);
      setRemaining(ttl);
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi tạo mã liên kết");
    } finally {
      setLoading(false);
    }
  };

  const copyCmd = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(`/lienket ${code}`);
      toast.success("Đã copy lệnh /lienket " + code);
    } catch {
      toast.error("Không copy được, hãy copy thủ công");
    }
  };

  const expired = !!code && remaining <= 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
        <li>Bấm <b>Tạo mã liên kết</b> bên dưới.</li>
        <li>Mở bot Telegram của copee.</li>
        <li>
          Gõ <code className="px-1 rounded bg-muted">/lienket &lt;mã&gt;</code> để gắn tài khoản.
        </li>
        <li>Gửi link sản phẩm Shopee (đã copy vào copee) cho bot để nhận video.</li>
      </ol>

      {!code || expired ? (
        <Button onClick={generate} disabled={loading}>
          {loading ? "Đang tạo mã..." : code ? "Tạo mã mới" : "Tạo mã liên kết"}
        </Button>
      ) : (
        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-2xl font-bold tracking-widest">{code}</span>
            <Badge variant="secondary">Còn {mm}:{ss}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Vào bot gõ:{" "}
            <code className="px-1 rounded bg-muted font-mono">/lienket {code}</code>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={copyCmd}>
              Copy lệnh
            </Button>
            {botUsername && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mở bot Telegram
                </a>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={generate} disabled={loading}>
              Tạo mã khác
            </Button>
          </div>
        </div>
      )}

      {expired && (
        <p className="text-sm text-destructive">Mã đã hết hạn, hãy tạo mã mới.</p>
      )}
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

          {/* Shopee Affiliate */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-base font-semibold">Shopee Affiliate</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nhập Affiliate ID để tạo link tiếp thị cho sản phẩm
              </p>
            </div>
            <ShopeeAffiliateForm />
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

        {/* Telegram Linking */}
        <div className="rounded-md border p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Liên kết Telegram</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gắn Telegram vào tài khoản để tạo video sản phẩm qua bot: gửi link
              Shopee → nhận video.
            </p>
          </div>
          <TelegramLinkSection />
        </div>
      </div>
    </div>
  );
}
