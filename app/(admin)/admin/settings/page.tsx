"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetcher, apiFetch } from "@/src/lib/fetcher";
import { toast } from "sonner";

type VideoSettings = { videoEngine: string; videoCost: number };

const ENGINES = [
  {
    value: "omni",
    label: "Gemini Omni (chất lượng cao)",
    desc: "Quay thật, chân thực nhất, 720p. Chi phí ~40-50k/video.",
  },
  {
    value: "veo",
    label: "Veo 3.1 Lite (tiết kiệm)",
    desc: "Full HD 1080p, thiên studio. Chi phí ~10-13k/video.",
  },
];

export default function AdminVideoSettingsPage() {
  const { data, mutate, isLoading } = useSWR<VideoSettings>(
    "/admin/settings",
    fetcher,
  );

  const [engine, setEngine] = useState("omni");
  const [cost, setCost] = useState("5000");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setEngine(data.videoEngine);
      setCost(String(data.videoCost));
    }
  }, [data]);

  const dirty =
    !!data && (engine !== data.videoEngine || Number(cost) !== data.videoCost);

  const save = async () => {
    const c = Number(cost);
    if (!Number.isFinite(c) || c < 0) {
      toast.error("Chi phí không hợp lệ");
      return;
    }
    try {
      setSaving(true);
      const res = await apiFetch("/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoEngine: engine, videoCost: c }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Lưu thất bại");
      }
      await mutate();
      toast.success("Đã lưu cài đặt video");
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const current = ENGINES.find((e) => e.value === engine);

  return (
    <div className="container mx-auto max-w-2xl py-6 px-4">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Cài đặt video</h1>
          <p className="text-sm text-muted-foreground">
            Thay đổi model tạo video và chi phí. Áp dụng ngay, không cần khởi động lại.
          </p>
        </div>

        {/* Model */}
        <div className="rounded-md border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Model tạo video</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Engine dùng để sinh video cho tất cả user.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Engine</Label>
            <Select value={engine} onValueChange={setEngine} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENGINES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {current && (
              <p className="text-sm text-muted-foreground">{current.desc}</p>
            )}
          </div>
        </div>

        {/* Chi phí */}
        <div className="rounded-md border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Chi phí mỗi video</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Số điểm trừ vào tài khoản user khi tạo 1 video thành công.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Điểm / video</Label>
            <Input
              id="cost"
              type="number"
              min={0}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="max-w-[220px]"
            />
            <p className="text-sm text-muted-foreground">
              Gợi ý: đặt ≥ chi phí thật để không lỗ (Omni ~50.000, Veo ~13.000).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
          {dirty && <Badge variant="secondary">Có thay đổi chưa lưu</Badge>}
        </div>
      </div>
    </div>
  );
}
