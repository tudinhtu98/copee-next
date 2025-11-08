"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UserSettingsPage() {
  const { data: session } = useSession() as any;
  const [copied, setCopied] = useState(false);

  const token = session?.accessToken || "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert("Không thể copy. Vui lòng chọn và copy thủ công.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý cài đặt tài khoản và mở rộng Chrome
        </p>
      </div>

      <div className="rounded-md border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Chrome Extension Token</h2>
        <p className="text-sm text-muted-foreground">
          Sử dụng token này để cấu hình Chrome extension Copee
        </p>

        <div className="flex gap-2">
          <Input value={token} readOnly className="font-mono text-sm" />
          <Button onClick={copyToClipboard} variant="outline">
            {copied ? "✓ Đã copy" : "Copy"}
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-sm mb-2">Hướng dẫn sử dụng:</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Click "Copy" để copy token</li>
            <li>Mở Chrome extension Copee</li>
            <li>Click "Settings" trong popup</li>
            <li>Paste token vào ô "Auth Token"</li>
            <li>
              Điền API Endpoint:{" "}
              <code className="bg-white px-1 rounded">
                http://localhost:3000
              </code>
            </li>
            <li>Click "Save Settings"</li>
          </ol>
        </div>
      </div>

      <div className="rounded-md border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Thông tin tài khoản</h2>
        <div className="space-y-2">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <div className="font-medium">{session?.user?.email || "-"}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Username</label>
            <div className="font-medium">{session?.user?.username || "-"}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Vai trò</label>
            <div className="font-medium">{session?.user?.role || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
