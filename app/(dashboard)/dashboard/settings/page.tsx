"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import useSWR from "swr";
import { CategoryMappingsDialog } from "@/components/category-mappings-dialog";
import { toast } from "sonner";

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
};

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: "",
    baseUrl: "",
    wooConsumerKey: "",
    wooConsumerSecret: "",
  });
  const [isSaving, setIsSaving] = useState(false);
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
      toast.success("Đã lưu site mới");
      setForm({
        name: "",
        baseUrl: "",
        wooConsumerKey: "",
        wooConsumerSecret: "",
      });
      mutate();
    } finally {
      setIsSaving(false);
    }
  }
  async function onRemoveSite(id: string) {
    if (!confirm("Bạn có chắc muốn xoá site này?")) return;
    try {
      const res = await fetch(`/api/proxy/sites/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Không thể xoá site" }));
        throw new Error(data.message || "Không thể xoá site");
      }
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Không thể xoá site");
    }
  }
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Cài đặt</h1>
      <form className="grid gap-3 max-w-xl" onSubmit={onSave}>
        <Input
          placeholder="Tên site"
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
        <Input
          placeholder="Base URL (https://...)"
          value={form.baseUrl}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, baseUrl: e.target.value }))
          }
          required
        />
        <Input
          placeholder="Woo Consumer Key"
          value={form.wooConsumerKey}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, wooConsumerKey: e.target.value }))
          }
          required
        />
        <Input
          placeholder="Woo Consumer Secret"
          value={form.wooConsumerSecret}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, wooConsumerSecret: e.target.value }))
          }
          required
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Đang lưu..." : "Lưu"}
        </Button>
      </form>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Site đã cấu hình</h2>
        {isLoading && (
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        )}
        {error && (
          <div className="text-sm text-destructive">
            Không thể tải danh sách site
          </div>
        )}
        <div className="grid gap-2">
          {sites?.map((site) => (
            <div
              key={site.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <div className="font-medium">{site.name}</div>
                <div className="text-sm text-muted-foreground">
                  {site.baseUrl}
                </div>
              </div>
              <div className="flex gap-2">
                <CategoryMappingsDialog siteId={site.id} siteName={site.name} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveSite(site.id)}
                >
                  Xoá
                </Button>
              </div>
            </div>
          ))}
          {sites && sites.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground">
              Chưa có site nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
