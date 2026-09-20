"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Check, Clapperboard, Copy, ImagePlus, Loader2, Pencil, RefreshCw, Sparkles, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, fetcher } from "@/src/lib/fetcher";
import {
  formatPoints,
  mediaUrl,
  videoFileUrl,
  type MediaAsset,
  type StoryOptions,
  type StoryScript,
  type VideoJob,
} from "@/lib/ai-types";

/** Số clip: 1 clip ~8 giây (rẻ), 3 clip ~24 giây (đủ mở - thân - kết, tốn gấp 3). */
const CLIP_OPTIONS = [
  { value: 1, label: "1 clip · ~8 giây", desc: "Một hook + một câu chốt. Hợp reels bắt trend, rẻ nhất." },
  { value: 3, label: "3 clip · ~24 giây", desc: "Mở đầu – diễn biến – chốt. Kể được câu chuyện, tốn gấp 3 điểm." },
];

/** Chọn ảnh chân dung: tải lên từ máy hoặc lấy lại ảnh đã có trong thư viện. */
function PortraitPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (asset: MediaAsset) => void;
}) {
  const { data: library, mutate } = useSWR<MediaAsset[]>(open ? "/social/media" : null, fetcher);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/social/media", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Không tải ảnh lên được");
      await mutate();
      onPick(body as MediaAsset);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chọn ảnh chân dung</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Ảnh rõ mặt, chụp chính diện, chỉ một người sẽ cho kết quả giống nhất. AI giữ nguyên khuôn mặt trong ảnh này.
        </p>
        <div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files)} />
          <Button variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}
            Tải ảnh từ máy
          </Button>
        </div>
        <div className="max-h-[50vh] overflow-auto">
          {library?.length ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {library.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="overflow-hidden rounded-md border transition hover:ring-2 hover:ring-primary"
                  onClick={() => {
                    onPick(asset);
                    onClose();
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(asset)} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Thư viện chưa có ảnh nào.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Khối theo dõi video đang dựng: hỏi lại trạng thái 5 giây một lần cho tới khi xong. */
function JobPanel({ jobId, onReset }: { jobId: string; onReset: () => void }) {
  const { data: job, mutate } = useSWR<VideoJob>(`/video/${jobId}`, fetcher, {
    refreshInterval: (latest) => (latest?.status === "DONE" || latest?.status === "FAILED" ? 0 : 5000),
  });
  const [retrying, setRetrying] = useState(false);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`Đã chép ${label}`);
  };

  const retry = async () => {
    setRetrying(true);
    try {
      const res = await apiFetch(`/video/${jobId}/retry`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).message || "Không thử lại được");
      toast.success("Đã đưa lại vào hàng đợi");
      await mutate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRetrying(false);
    }
  };

  if (!job) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang lấy trạng thái video…
      </div>
    );
  }

  if (job.status === "FAILED") {
    return (
      <div className="space-y-3 rounded-md border border-destructive/40 p-4">
        <div className="font-medium text-destructive">Dựng video thất bại</div>
        <p className="text-sm text-muted-foreground">{job.errorMessage || "Lỗi không xác định"}</p>
        <p className="text-sm text-muted-foreground">Video lỗi không bị trừ điểm.</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={retrying} onClick={() => void retry()}>
            {retrying ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
            Thử lại
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Sửa kịch bản
          </Button>
        </div>
      </div>
    );
  }

  if (job.status !== "DONE") {
    return (
      <div className="space-y-2 rounded-md border p-4">
        <div className="flex items-center gap-2 font-medium">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang dựng video…
        </div>
        <p className="text-sm text-muted-foreground">
          Mỗi clip mất khoảng 1–3 phút. Bạn cứ rời trang, video xong sẽ nằm ở tab &quot;Video của tôi&quot;
          {job.clips > 1 ? ` (video này gồm ${job.clips} clip nên lâu hơn)` : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center gap-2 font-medium text-emerald-600">
        <Check className="h-4 w-4" /> Video đã xong
      </div>
      <video src={videoFileUrl(job.id)} controls playsInline className="max-h-[70vh] w-full max-w-sm rounded-md border bg-black" />
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <a href={videoFileUrl(job.id)} download={`${job.title || "video"}.mp4`}>
            Tải video về
          </a>
        </Button>
        {job.caption && (
          <Button variant="outline" onClick={() => void copy(job.caption!, "caption")}>
            <Copy className="mr-1 h-4 w-4" /> Chép caption
          </Button>
        )}
        {job.spokenText && (
          <Button variant="outline" onClick={() => void copy(job.spokenText!, "lời thoại")}>
            <Copy className="mr-1 h-4 w-4" /> Chép lời thoại (làm phụ đề)
          </Button>
        )}
        <Button variant="ghost" onClick={onReset}>
          Làm video khác
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Video không có chữ trên hình. Muốn có phụ đề như các video đang viral, dán lời thoại ở trên vào
        CapCut hoặc bật phụ đề tự động khi đăng.
      </p>
    </div>
  );
}

/** Bước 1 → 2 → 3: nhập ý tưởng, duyệt kịch bản, dựng video. */
export function StoryComposer({ videoCost }: { videoCost: number }) {
  const { data: options } = useSWR<StoryOptions>("/ai/story/options", fetcher);
  const { data: prices } = useSWR<{ videoScript: number }>("/ai/prices", fetcher);

  const [portrait, setPortrait] = useState<MediaAsset | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("tam-su");
  const [setting, setSetting] = useState("car");
  const [clips, setClips] = useState(1);
  const [audience, setAudience] = useState("");
  const [presenter, setPresenter] = useState("");

  const [script, setScript] = useState<StoryScript | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  // Đổi số clip thì kịch bản cũ không còn đúng số cảnh nữa
  useEffect(() => {
    if (script && script.scenes.length !== clips) setScript(null);
  }, [clips, script]);

  const draft = async () => {
    setDrafting(true);
    try {
      const res = await apiFetch("/ai/story/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          style,
          clips,
          setting,
          audience: audience.trim() || undefined,
          presenter: portrait ? undefined : presenter.trim() || undefined,
          mediaId: portrait?.id,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "AI chưa viết được kịch bản");
      setScript(body as StoryScript);
      setJobId(null);
      toast.success("Đã có kịch bản, đọc và sửa lại trước khi dựng video");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDrafting(false);
    }
  };

  const editScene = (index: number, field: "spoken" | "visual", value: string) => {
    setScript((prev) =>
      prev
        ? {
            ...prev,
            scenes: prev.scenes.map((s, i) =>
              i === index ? { ...s, [field]: value, words: field === "spoken" ? value.trim().split(/\s+/).filter(Boolean).length : s.words } : s,
            ),
          }
        : prev,
    );
  };

  const createVideo = async () => {
    if (!script) return;
    setCreating(true);
    try {
      const res = await apiFetch("/video/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: script.title,
          caption: script.caption,
          clips,
          setting,
          mediaId: portrait?.id,
          presenter: portrait ? undefined : presenter.trim() || undefined,
          scenes: script.scenes.map((s) => ({ spoken: s.spoken, visual: s.visual })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Không tạo được video");
      setJobId(body.id as string);
      toast.success("Đã bắt đầu dựng video");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const totalCost = videoCost * clips;
  const maxWords = options?.maxWordsPerClip ?? 26;

  return (
    <div className="space-y-6">
      {/* ── Bước 1: nhân vật + ý tưởng ── */}
      <section className="space-y-4 rounded-md border p-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Bước 1</Badge>
          <h2 className="font-medium">Nhân vật và câu chuyện</h2>
        </div>

        <div className="space-y-2">
          <Label>Người xuất hiện trong video</Label>
          <div className="flex flex-wrap items-center gap-3">
            {portrait ? (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(portrait)} alt="" className="h-16 w-16 rounded-md border object-cover" />
                <Button variant="ghost" size="sm" onClick={() => setPortrait(null)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Bỏ ảnh
                </Button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                <UserRound className="h-6 w-6" />
              </div>
            )}
            <Button variant="outline" onClick={() => setPickerOpen(true)}>
              <ImagePlus className="mr-1 h-4 w-4" /> {portrait ? "Đổi ảnh chân dung" : "Dùng ảnh chân dung của tôi"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Có ảnh thì AI giữ nguyên khuôn mặt trong ảnh. Không có ảnh thì AI tự dựng người dẫn theo mô tả bên dưới.
          </p>
        </div>

        {!portrait && (
          <div className="space-y-2">
            <Label htmlFor="presenter">Mô tả người dẫn (để trống cũng được)</Label>
            <Input
              id="presenter"
              value={presenter}
              onChange={(e) => setPresenter(e.target.value)}
              placeholder="Nữ 28 tuổi, tóc buộc gọn, áo phông trắng, gương mặt thân thiện"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="topic">Bạn muốn kể chuyện gì?</Label>
          <Textarea
            id="topic"
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ví dụ: chuyện mình nhận ra người ở trước mặt mới là người đáng trân trọng, sau một lần suýt mất họ."
          />
          <p className="text-sm text-muted-foreground">
            Kể càng cụ thể (tình huống, câu nói, cảm xúc) thì kịch bản càng thật và càng nhiều tương tác.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Phong cách kể</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options?.styles ?? []).map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bối cảnh quay</Label>
            <Select value={setting} onValueChange={setSetting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options?.settings ?? []).map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Khán giả muốn nhắm tới (không bắt buộc)</Label>
            <Input
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Dân văn phòng 25-35, mẹ bỉm sữa…"
            />
          </div>
          <div className="space-y-2">
            <Label>Độ dài video</Label>
            <Select value={String(clips)} onValueChange={(v) => setClips(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIP_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={String(c.value)}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{CLIP_OPTIONS.find((c) => c.value === clips)?.desc}</p>
          </div>
        </div>

        <Button disabled={drafting || topic.trim().length < 5} onClick={() => void draft()}>
          {drafting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          Viết kịch bản {prices ? `(${formatPoints(prices.videoScript)})` : ""}
        </Button>
      </section>

      {/* ── Bước 2: duyệt kịch bản ── */}
      {script && (
        <section className="space-y-4 rounded-md border p-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Bước 2</Badge>
            <h2 className="font-medium">Đọc và sửa kịch bản</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Chưa tốn điểm video ở bước này. Sửa thoải mái, viết lại kịch bản bao nhiêu lần cũng được — chỉ khi bấm
            &quot;Dựng video&quot; mới trừ điểm.
          </p>

          {script.warnings.map((w) => (
            <p key={w} className="rounded-md bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {w}
            </p>
          ))}

          <div className="space-y-2">
            <Label htmlFor="title">Tên video</Label>
            <Input id="title" value={script.title} onChange={(e) => setScript({ ...script, title: e.target.value })} />
          </div>

          {script.scenes.map((scene, i) => {
            const words = scene.spoken.trim().split(/\s+/).filter(Boolean).length;
            return (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cảnh {i + 1}</span>
                  <Badge variant={words > maxWords ? "destructive" : "outline"}>
                    {words}/{maxWords} tiếng
                  </Badge>
                </div>
                <Textarea rows={2} value={scene.spoken} onChange={(e) => editScene(i, "spoken", e.target.value)} />
                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    <Pencil className="mr-1 inline h-3 w-3" /> Mô tả hình ảnh (tiếng Anh, cho AI dựng hình)
                  </summary>
                  <Textarea
                    className="mt-2"
                    rows={2}
                    value={scene.visual}
                    onChange={(e) => editScene(i, "visual", e.target.value)}
                  />
                </details>
              </div>
            );
          })}

          <div className="space-y-2">
            <Label htmlFor="caption">Caption khi đăng</Label>
            <Textarea id="caption" rows={4} value={script.caption} onChange={(e) => setScript({ ...script, caption: e.target.value })} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={creating || Boolean(jobId)} onClick={() => void createVideo()}>
              {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Clapperboard className="mr-1 h-4 w-4" />}
              Dựng video ({formatPoints(totalCost)})
            </Button>
            <Button variant="outline" disabled={drafting} onClick={() => void draft()}>
              <RefreshCw className="mr-1 h-4 w-4" /> Viết kịch bản khác
            </Button>
          </div>
        </section>
      )}

      {/* ── Bước 3: video ── */}
      {jobId && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Bước 3</Badge>
            <h2 className="font-medium">Video của bạn</h2>
          </div>
          <JobPanel
            jobId={jobId}
            onReset={() => {
              setJobId(null);
            }}
          />
        </section>
      )}

      <PortraitPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={setPortrait} />
    </div>
  );
}
