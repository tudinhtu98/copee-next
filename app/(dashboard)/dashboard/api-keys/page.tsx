"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { fetcher, apiFetch } from "@/src/lib/fetcher";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ApiKey = {
  id: string;
  name: string;
  permissions: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type CreateApiKeyResponse = {
  id: string;
  key: string; // Only shown once!
  name: string;
  permissions: string[];
  expiresAt: string | null;
  createdAt: string;
};

export default function ApiKeysPage() {
  const [copied, setCopied] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiresInDays, setNewKeyExpiresInDays] = useState<number | undefined>(undefined);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: apiKeys, mutate: mutateApiKeys } = useSWR<ApiKey[]>(
    "/api-keys",
    fetcher
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Đã copy!");
    } catch (error) {
      toast.error("Không thể copy. Vui lòng chọn và copy thủ công.");
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.warning("Vui lòng nhập tên cho API key");
      return;
    }

    try {
      setIsCreating(true);
      const res = await apiFetch("/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          expiresInDays: newKeyExpiresInDays || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Không thể tạo API key");
      }

      const data: CreateApiKeyResponse = await res.json();
      setCreatedKey(data);
      mutateApiKeys();
      setNewKeyName("");
      setNewKeyExpiresInDays(undefined);
      setIsCreateDialogOpen(false);
      toast.success("API key đã được tạo thành công!");
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi tạo API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn thu hồi API key này?")) {
      return;
    }

    try {
      const res = await apiFetch(`/api-keys/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Không thể thu hồi API key");
      }

      mutateApiKeys();
      toast.success("API key đã được thu hồi");
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi thu hồi API key");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">API Keys cho Extension</h1>
        <p className="text-sm text-muted-foreground">
          Tạo và quản lý API Keys để sử dụng với Chrome Extension
        </p>
      </div>

      {/* API Keys Section */}
      <div className="rounded-md border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Danh sách API Keys</h2>
            <p className="text-sm text-muted-foreground">
              API keys có thời gian hết hạn dài hơn access token. Sử dụng để xác thực với Chrome Extension.
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Tạo API Key</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo API Key mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tên</label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ví dụ: Chrome Extension"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Thời gian hết hạn (ngày, để trống = không hết hạn)
                  </label>
                  <Input
                    type="number"
                    value={newKeyExpiresInDays || ""}
                    onChange={(e) =>
                      setNewKeyExpiresInDays(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder="Ví dụ: 90"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateApiKey} disabled={isCreating}>
                  {isCreating ? "Đang tạo..." : "Tạo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Show created key (only once) */}
        {createdKey && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 space-y-2">
            <p className="font-semibold text-sm">
              ⚠️ Lưu ý: API key này chỉ hiển thị một lần. Hãy copy và lưu lại ngay!
            </p>
            <div className="flex gap-2">
              <Input
                value={createdKey.key}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(createdKey.key)}
                variant="outline"
              >
                {copied ? "✓ Đã copy" : "Copy"}
              </Button>
              <Button
                onClick={() => setCreatedKey(null)}
                variant="outline"
              >
                Đóng
              </Button>
            </div>
          </div>
        )}

        {/* API Keys List */}
        {apiKeys && apiKeys.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Quyền</TableHead>
                <TableHead>Lần sử dụng cuối</TableHead>
                <TableHead>Hết hạn</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {key.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString("vi-VN")
                      : "Chưa sử dụng"}
                  </TableCell>
                  <TableCell>
                    {key.expiresAt
                      ? new Date(key.expiresAt).toLocaleDateString("vi-VN")
                      : "Không hết hạn"}
                  </TableCell>
                  <TableCell>
                    {new Date(key.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeApiKey(key.id)}
                    >
                      Thu hồi
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            Chưa có API key nào. Tạo API key mới để sử dụng với Chrome Extension.
          </p>
        )}
      </div>
    </div>
  );
}
