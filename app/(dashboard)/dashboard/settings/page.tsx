"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch("/api/proxy" + url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.message || "Không thể tải dữ liệu");
    } catch {
      throw new Error("Không thể tải dữ liệu");
    }
  }
  return (await res.json()) as T;
};

type Site = {
  id: string;
  name: string;
  baseUrl: string;
  wooConsumerKey?: string | null;
  wooConsumerSecret?: string | null;
  wpUsername?: string | null;
  wpApplicationPassword?: string | null;
};

export default function SettingsPage() {
  const [isAddSiteDialogOpen, setIsAddSiteDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    baseUrl: "",
    wooConsumerKey: "",
    wooConsumerSecret: "",
    wpUsername: "",
    wpApplicationPassword: "",
  });
  const [editingWooKeys, setEditingWooKeys] = useState<{
    siteId: string | null;
    wooConsumerKey: string;
    wooConsumerSecret: string;
  }>({
    siteId: null,
    wooConsumerKey: "",
    wooConsumerSecret: "",
  });
  const [editingWpAuth, setEditingWpAuth] = useState<{
    siteId: string | null;
    wpUsername: string;
    wpApplicationPassword: string;
  }>({
    siteId: null,
    wpUsername: "",
    wpApplicationPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingWooKeys, setIsSavingWooKeys] = useState(false);
  const [isSavingWpAuth, setIsSavingWpAuth] = useState(false);
  const [isWooKeysDialogOpen, setIsWooKeysDialogOpen] = useState(false);
  const [isWpAuthDialogOpen, setIsWpAuthDialogOpen] = useState(false);
  const [testingSiteId, setTestingSiteId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    siteId: string | null;
    siteName: string;
    isOpen: boolean;
    confirmText: string;
  }>({
    siteId: null,
    siteName: "",
    isOpen: false,
    confirmText: "",
  });
  const {
    data: sites,
    mutate,
    error,
    isLoading,
  } = useSWR<Site[]>("/sites", fetcher);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch("/api/proxy/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Lỗi lưu" }));
        return toast.error(data.message || "Lỗi lưu");
      }
      toast.success("Đã thêm site mới");
      setForm({
        name: "",
        baseUrl: "",
        wooConsumerKey: "",
        wooConsumerSecret: "",
        wpUsername: "",
        wpApplicationPassword: "",
      });
      setIsAddSiteDialogOpen(false);
      mutate();
    } finally {
      setIsSaving(false);
    }
  }

  function openEditWooKeysDialog(site: Site) {
    setEditingWooKeys({
      siteId: site.id,
      wooConsumerKey: site.wooConsumerKey || "",
      wooConsumerSecret: "", // Don't show existing secret for security
    });
    setIsWooKeysDialogOpen(true);
  }

  async function onSaveWooKeys(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingWooKeys.siteId) return;
    try {
      setIsSavingWooKeys(true);
      const res = await fetch(`/api/proxy/sites/${editingWooKeys.siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wooConsumerKey: editingWooKeys.wooConsumerKey || null,
          wooConsumerSecret: editingWooKeys.wooConsumerSecret || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Lỗi lưu" }));
        return toast.error(data.message || "Lỗi lưu");
      }
      toast.success("Đã cập nhật WooCommerce keys");
      setEditingWooKeys({ siteId: null, wooConsumerKey: "", wooConsumerSecret: "" });
      setIsWooKeysDialogOpen(false);
      mutate();
    } finally {
      setIsSavingWooKeys(false);
    }
  }

  function openEditWpAuthDialog(site: Site) {
    setEditingWpAuth({
      siteId: site.id,
      wpUsername: site.wpUsername || "",
      wpApplicationPassword: "", // Don't show existing password for security
    });
    setIsWpAuthDialogOpen(true);
  }
  function openDeleteDialog(site: Site) {
    setDeleteConfirm({
      siteId: site.id,
      siteName: site.name,
      isOpen: true,
      confirmText: "",
    });
  }

  async function onRemoveSite() {
    if (!deleteConfirm.siteId) return;
    const expectedText = `Xoá ${deleteConfirm.siteName}`;
    if (deleteConfirm.confirmText !== expectedText) {
      toast.error(`Vui lòng nhập chính xác: "${expectedText}"`);
      return;
    }
    try {
      const res = await fetch(`/api/proxy/sites/${deleteConfirm.siteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Không thể xoá site" }));
        throw new Error(data.message || "Không thể xoá site");
      }
      toast.success("Đã xoá site thành công");
      setDeleteConfirm({
        siteId: null,
        siteName: "",
        isOpen: false,
        confirmText: "",
      });
      mutate();
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error.message || "Không thể xoá site");
    }
  }

  async function onSaveWpAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingWpAuth.siteId) return;
    try {
      setIsSavingWpAuth(true);
      const res = await fetch(`/api/proxy/sites/${editingWpAuth.siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUsername: editingWpAuth.wpUsername || null,
          wpApplicationPassword: editingWpAuth.wpApplicationPassword || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Lỗi lưu" }));
        return toast.error(data.message || "Lỗi lưu");
      }
      toast.success("Đã cập nhật Application Password");
      setEditingWpAuth({ siteId: null, wpUsername: "", wpApplicationPassword: "" });
      setIsWpAuthDialogOpen(false);
      mutate();
    } finally {
      setIsSavingWpAuth(false);
    }
  }

  async function onTestConnection(siteId: string) {
    try {
      setTestingSiteId(siteId);
      const res = await fetch(`/api/proxy/sites/${siteId}/test-connection`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Lỗi test connection" }));
        return toast.error(data.message || "Lỗi test connection");
      }
      const results = await res.json();
      
      // Show results for WooCommerce
      if (results.wooCommerce) {
        if (results.wooCommerce.success) {
          toast.success(`WooCommerce: ${results.wooCommerce.message}`);
        } else {
          toast.error(`WooCommerce: ${results.wooCommerce.message}`);
        }
      }
      
      // Show results for WordPress
      if (results.wordPress) {
        if (results.wordPress.success) {
          toast.success(`WordPress: ${results.wordPress.message}`);
        } else {
          toast.warning(`WordPress: ${results.wordPress.message}`);
        }
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error.message || "Lỗi test connection");
    } finally {
      setTestingSiteId(null);
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý WordPress Sites</h1>
        <Dialog open={isAddSiteDialogOpen} onOpenChange={setIsAddSiteDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddSiteDialogOpen(true)}>
              Thêm Site Mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={onSave}>
              <DialogHeader>
                <DialogTitle>Thêm WordPress Site Mới</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Tên site</label>
                  <Input
                    placeholder="My WordPress Site"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Base URL</label>
                  <Input
                    placeholder="https://example.com"
                    value={form.baseUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, baseUrl: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">WooCommerce Consumer Key</label>
                  <Input
                    placeholder="ck_..."
                    value={form.wooConsumerKey}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, wooConsumerKey: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">WooCommerce Consumer Secret</label>
                  <Input
                    type="password"
                    placeholder="cs_..."
                    value={form.wooConsumerSecret}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, wooConsumerSecret: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2 pt-2 border-t">
                  <label className="text-sm font-medium">WordPress Username (Tùy chọn)</label>
                  <Input
                    placeholder="admin"
                    value={form.wpUsername}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, wpUsername: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Để upload hình ảnh lên WordPress Media Library
                  </p>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Application Password (Tùy chọn)</label>
                  <Input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    value={form.wpApplicationPassword}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, wpApplicationPassword: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Tạo tại: WordPress Admin → Users → Profile → Application Passwords
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddSiteDialogOpen(false);
                    setForm({
                      name: "",
                      baseUrl: "",
                      wooConsumerKey: "",
                      wooConsumerSecret: "",
                      wpUsername: "",
                      wpApplicationPassword: "",
                    });
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Thêm Site"}
                </Button>
              </DialogFooter>
    </form>
          </DialogContent>
        </Dialog>
      </div>

    <div className="space-y-2">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        )}
        {error && (
          <div className="text-sm text-destructive">
            Không thể tải danh sách site
          </div>
        )}
        <div className="grid gap-3">
        {sites?.map((site) => (
            <div
              key={site.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
            <div>
                  <div className="font-semibold text-lg">{site.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {site.baseUrl}
                  </div>
            </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTestConnection(site.id)}
                    disabled={testingSiteId === site.id}
                  >
                    {testingSiteId === site.id ? "Đang test..." : "Test Connection"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(site)}
                  >
              Xoá
            </Button>
                </div>
              </div>

              <div className="grid gap-3 pt-2 border-t">
                {/* WooCommerce Keys */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">WooCommerce Keys</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {site.wooConsumerKey ? (
                        <>Consumer Key: {site.wooConsumerKey.substring(0, 20)}... • Consumer Secret: ••••••••</>
                      ) : (
                        <span className="text-yellow-600">Chưa cấu hình</span>
                      )}
                    </div>
                  </div>
                  <Dialog open={isWooKeysDialogOpen && editingWooKeys.siteId === site.id} onOpenChange={setIsWooKeysDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditWooKeysDialog(site)}
                      >
                        {site.wooConsumerKey ? "Chỉnh sửa" : "Thiết lập"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={onSaveWooKeys}>
                        <DialogHeader>
                          <DialogTitle>
                            {site.wooConsumerKey ? "Chỉnh sửa" : "Thiết lập"} WooCommerce Keys
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">
                              Consumer Key
                            </label>
                            <Input
                              placeholder="ck_..."
                              value={editingWooKeys.wooConsumerKey}
                              onChange={(e) =>
                                setEditingWooKeys((prev) => ({
                                  ...prev,
                                  wooConsumerKey: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">
                              Consumer Secret
                            </label>
                            <Input
                              type="password"
                              placeholder="cs_..."
                              value={editingWooKeys.wooConsumerSecret}
                              onChange={(e) =>
                                setEditingWooKeys((prev) => ({
                                  ...prev,
                                  wooConsumerSecret: e.target.value,
                                }))
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Tạo tại: WooCommerce → Settings → Advanced → REST API
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingWooKeys({ siteId: null, wooConsumerKey: "", wooConsumerSecret: "" });
                              setIsWooKeysDialogOpen(false);
                            }}
                          >
                            Hủy
                          </Button>
                          <Button type="submit" disabled={isSavingWooKeys}>
                            {isSavingWooKeys ? "Đang lưu..." : "Lưu"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Application Password */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">Application Password</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {site.wpUsername ? (
                        <>Username: {site.wpUsername} • Application Password: ••••••••</>
                      ) : (
                        <span className="text-yellow-600">Chưa cấu hình</span>
                      )}
                    </div>
                  </div>
                  <Dialog open={isWpAuthDialogOpen && editingWpAuth.siteId === site.id} onOpenChange={setIsWpAuthDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditWpAuthDialog(site)}
                      >
                        {site.wpUsername ? "Chỉnh sửa" : "Thiết lập"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={onSaveWpAuth}>
                        <DialogHeader>
                          <DialogTitle>
                            {site.wpUsername ? "Chỉnh sửa" : "Thiết lập"} Application Password
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">
                              WordPress Username
                            </label>
                            <Input
                              placeholder="admin"
                              value={editingWpAuth.wpUsername}
                              onChange={(e) =>
                                setEditingWpAuth((prev) => ({
                                  ...prev,
                                  wpUsername: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">
                              Application Password
                            </label>
                            <Input
                              type="password"
                              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                              value={editingWpAuth.wpApplicationPassword}
                              onChange={(e) =>
                                setEditingWpAuth((prev) => ({
                                  ...prev,
                                  wpApplicationPassword: e.target.value,
                                }))
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Tạo tại: WordPress Admin → Users → Profile → Application Passwords
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingWpAuth({ siteId: null, wpUsername: "", wpApplicationPassword: "" });
                              setIsWpAuthDialogOpen(false);
                            }}
                          >
                            Hủy
                          </Button>
                          <Button type="submit" disabled={isSavingWpAuth}>
                            {isSavingWpAuth ? "Đang lưu..." : "Lưu"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

              </div>
          </div>
        ))}
        {sites && sites.length === 0 && !isLoading && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chưa có site nào. Nhấn &quot;Thêm Site Mới&quot; để bắt đầu.
            </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirm({
            siteId: null,
            siteName: "",
            isOpen: false,
            confirmText: "",
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa site</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Hành động này không thể hoàn tác. Để xác nhận, vui lòng nhập{" "}
              <span className="font-semibold text-foreground">
                &quot;Xoá {deleteConfirm.siteName}&quot;
              </span>{" "}
              vào ô bên dưới.
            </p>
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Nhập &quot;Xoá {deleteConfirm.siteName}&quot;
              </label>
              <Input
                placeholder={`Xoá ${deleteConfirm.siteName}`}
                value={deleteConfirm.confirmText}
                onChange={(e) =>
                  setDeleteConfirm((prev) => ({
                    ...prev,
                    confirmText: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirm({
                  siteId: null,
                  siteName: "",
                  isOpen: false,
                  confirmText: "",
                });
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onRemoveSite}
              disabled={deleteConfirm.confirmText !== `Xoá ${deleteConfirm.siteName}`}
            >
              Xoá Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
