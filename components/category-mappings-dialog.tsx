"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";

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

type CategoryMapping = {
  id: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  createdAt: string;
};

type WooCommerceCategory = {
  id: string;
  wooId: string;
  name: string;
  slug: string | null;
  parentId: string | null;
  count: number;
};

type CategoryMappingsDialogProps = {
  siteId: string;
  siteName: string;
};

export function CategoryMappingsDialog({
  siteId,
  siteName,
}: CategoryMappingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    sourceName: "",
    wooCategoryId: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    data: mappings,
    mutate,
    error,
  } = useSWR<CategoryMapping[]>(
    open ? `/sites/${siteId}/category-mappings` : null,
    fetcher
  );

  const {
    data: wooCategories,
    mutate: mutateCategories,
  } = useSWR<WooCommerceCategory[]>(
    open ? `/sites/${siteId}/categories` : null,
    fetcher
  );

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.sourceName || !form.wooCategoryId) {
      toast.warning("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`/api/proxy/sites/${siteId}/category-mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Lỗi lưu" }));
        throw new Error(data.message || "Lỗi lưu");
      }

      toast.success("Đã thêm category mapping");
      setForm({ sourceName: "", wooCategoryId: "" });
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Lỗi lưu");
    } finally {
      setIsSaving(false);
    }
  }

  async function onSyncCategories() {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/proxy/sites/${siteId}/categories/sync`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Lỗi sync" }));
        throw new Error(data.message || "Lỗi sync");
      }

      const data = await res.json();
      toast.success(data.message || `Đã sync ${data.count} categories`);
      mutateCategories();
    } catch (e: any) {
      toast.error(e.message || "Lỗi sync categories");
    } finally {
      setIsSyncing(false);
    }
  }

  function onSelectWooCategory(wooCategoryId: string) {
    setForm((prev) => ({
      ...prev,
      wooCategoryId: wooCategoryId,
    }));
  }

  async function onDelete(mappingId: string) {
    if (!confirm("Bạn có chắc muốn xoá mapping này?")) return;

    try {
      const res = await fetch(
        `/api/proxy/sites/${siteId}/category-mappings/${mappingId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Không thể xoá" }));
        throw new Error(data.message || "Không thể xoá");
      }

      mutate();
    } catch (e: any) {
      toast.error(e.message || "Không thể xoá");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Quản lý categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Category Mappings - {siteName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sync Categories Button */}
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Sync categories từ WooCommerce để có danh sách đầy đủ
              </p>
              {wooCategories && (
                <p className="text-xs text-muted-foreground mt-1">
                  Đã sync: {wooCategories.length} categories
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onSyncCategories}
              disabled={isSyncing}
            >
              {isSyncing ? "Đang sync..." : "Sync Categories"}
            </Button>
          </div>
          <form className="grid gap-3" onSubmit={onSave}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">
                Shopee Category Name
              </label>
              <Input
                placeholder="Ví dụ: Thời trang nữ"
                value={form.sourceName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sourceName: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">
                WooCommerce Category
              </label>
              {wooCategories && wooCategories.length > 0 ? (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.wooCategoryId}
                  onChange={(e) => onSelectWooCategory(e.target.value)}
                >
                  <option value="">Chọn category...</option>
                  {wooCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (ID: {cat.wooId})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Chưa có categories. Click &quot;Sync Categories&quot; để tải từ WooCommerce
                  </p>
                </div>
              )}
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Đang thêm..." : "Thêm mapping"}
            </Button>
          </form>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Mappings hiện có</h3>
            {error && (
              <div className="text-sm text-destructive">
                Không thể tải mappings
              </div>
            )}
            {mappings && mappings.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Chưa có mapping nào
              </div>
            )}
            <div className="space-y-2">
              {mappings?.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{mapping.sourceName}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge>{mapping.targetName}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {mapping.targetId}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(mapping.id)}
                  >
                    Xoá
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
