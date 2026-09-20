"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import useSWR from "swr";
import { Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { StoryComposer } from "./story-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, fetcher } from "@/src/lib/fetcher";
import {
  formatDateTime,
  formatPoints,
  videoFileUrl,
  VIDEO_STATUS_LABEL,
  type VideoJob,
  type VideoListResponse,
} from "@/lib/ai-types";

function StatusBadge({ job }: { job: VideoJob }) {
  const variant = job.status === "DONE" ? "secondary" : job.status === "FAILED" ? "destructive" : "outline";
  return <Badge variant={variant}>{VIDEO_STATUS_LABEL[job.status] ?? job.status}</Badge>;
}

/** Danh sách video đã tạo (cả video sản phẩm lẫn video kể chuyện). */
function VideoList() {
  const { data, mutate, isLoading } = useSWR<VideoListResponse>("/video?limit=30", fetcher, {
    // Còn video đang dựng thì tự làm mới cho tới khi xong
    refreshInterval: (latest) => (latest?.items?.some((j) => j.status === "PENDING" || j.status === "PROCESSING") ? 8000 : 0),
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const retry = async (id: string) => {
    setBusyId(id);
    try {
      const res = await apiFetch(`/video/${id}/retry`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).message || "Không thử lại được");
      toast.success("Đã đưa lại vào hàng đợi");
      await mutate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh sách video…
      </div>
    );
  }

  if (!data?.items.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Bạn chưa tạo video nào.</p>;
  }

  return (
    <div className="space-y-3">
      {data.items.map((job) => (
        <div key={job.id} className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{job.kind === "STORY" ? "Kể chuyện" : "Sản phẩm"}</Badge>
              <StatusBadge job={job} />
              <span className="truncate font-medium">{job.title || job.product?.title || "Video"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(job.createdAt)}
              {job.durationSec ? ` · ${job.durationSec}s` : ""}
              {job.clips > 1 ? ` · ${job.clips} clip` : ""}
              {job.cost ? ` · ${formatPoints(job.cost)}` : ""}
            </p>
            {job.status === "FAILED" && job.errorMessage && (
              <p className="text-sm text-destructive">{job.errorMessage}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {job.status === "DONE" && (
              <>
                <Button asChild size="sm" variant="outline">
                  <a href={videoFileUrl(job.id)} target="_blank" rel="noreferrer">
                    Xem
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={videoFileUrl(job.id)} download={`${job.title || "video"}.mp4`}>
                    <Download className="mr-1 h-3.5 w-3.5" /> Tải về
                  </a>
                </Button>
                {job.caption && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void navigator.clipboard.writeText(job.caption!);
                      toast.success("Đã chép caption");
                    }}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" /> Caption
                  </Button>
                )}
              </>
            )}
            {job.status === "FAILED" && (
              <Button size="sm" variant="outline" disabled={busyId === job.id} onClick={() => void retry(job.id)}>
                {busyId === job.id ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                )}
                Thử lại
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VideoPage() {
  const [tab, setTab] = useState("story");
  const { data: prices } = useSWR<{ perClip: number }>("/video/prices", fetcher);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Video AI</h1>
        <p className="text-sm text-muted-foreground">
          Tạo video dọc kiểu &quot;một người nói chuyện&quot; kể chuyện đời sống. AI viết kịch bản trước, bạn đọc và
          sửa, xác nhận rồi mới dựng video.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="story">Tạo video kể chuyện</TabsTrigger>
          <TabsTrigger value="list">Video của tôi</TabsTrigger>
        </TabsList>

        <TabsContent value="story" className="pt-3">
          <StoryComposer videoCost={prices?.perClip ?? 0} />
        </TabsContent>

        <TabsContent value="list" className="pt-3">
          <VideoList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
