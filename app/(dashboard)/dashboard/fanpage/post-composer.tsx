"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { ImagePlus, Loader2, Save, Send, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AiActionCard } from "@/components/ai-action-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, fetcher } from "@/src/lib/fetcher";
import { formatPoints, mediaUrl, type AiAction, type ContentPost, type FacebookPage, type MediaAsset, type Product } from "@/lib/ai-types";

const TONES = [
  { value: "friendly", label: "Thân thiện, gần gũi" },
  { value: "professional", label: "Chuyên nghiệp, tin cậy" },
  { value: "urgent", label: "Khẩn trương, kích thích mua ngay" },
  { value: "playful", label: "Vui nhộn, bắt trend" },
  { value: "luxury", label: "Sang trọng, cao cấp" },
];

const GOALS = [
  { value: "messages", label: "Kéo khách nhắn tin" },
  { value: "engagement", label: "Tăng tương tác" },
  { value: "traffic", label: "Kéo khách bấm link mua" },
  { value: "awareness", label: "Giới thiệu sản phẩm mới" },
];

const ASPECTS = [
  { value: "1:1", label: "Vuông 1:1" },
  { value: "4:5", label: "Dọc 4:5" },
  { value: "9:16", label: "Đứng 9:16 (story)" },
  { value: "16:9", label: "Ngang 16:9" },
];

/** Chọn ảnh: từ thư viện, tải lên từ máy, hoặc nhờ AI tạo (AI tạo ảnh cần xác nhận vì tốn điểm). */
function MediaPicker({
  open,
  onClose,
  selected,
  onConfirm,
  products,
}: {
  open: boolean;
  onClose: () => void;
  selected: MediaAsset[];
  onConfirm: (assets: MediaAsset[]) => void;
  products: Product[];
}) {
  const { data: library, mutate } = useSWR<MediaAsset[]>(open ? "/social/media" : null, fetcher);
  const [picked, setPicked] = useState<MediaAsset[]>(selected);
  const [uploading, setUploading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [productId, setProductId] = useState("none");
  const [action, setAction] = useState<AiAction | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggle = (asset: MediaAsset) =>
    setPicked((prev) => (prev.some((p) => p.id === asset.id) ? prev.filter((p) => p.id !== asset.id) : [...prev, asset]));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await apiFetch("/social/media", { method: "POST", body: form });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || `Không tải lên được ${file.name}`);
        setPicked((prev) => [...prev, body]);
      }
      await mutate();
      toast.success("Đã tải ảnh lên");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const proposeImage = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch("/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "GENERATE_IMAGE",
          params: { prompt, aspectRatio: aspect, ...(productId !== "none" ? { productId } : {}) },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Không tạo được đề xuất");
      setAction(body);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chọn ảnh cho bài viết ({picked.length} ảnh)</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">Thư viện</TabsTrigger>
            <TabsTrigger value="generate">Tạo ảnh bằng AI</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Ảnh tự chuyển sang JPEG cho hợp chuẩn Facebook.</p>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void upload(e.target.files)} />
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1 h-4 w-4" />}
                Tải ảnh lên
              </Button>
            </div>
            {!library ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Đang tải…</p>
            ) : library.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Thư viện chưa có ảnh nào.</p>
            ) : (
              <ul className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto">
                {library.map((asset) => {
                  const order = picked.findIndex((p) => p.id === asset.id);
                  return (
                    <li key={asset.id} className="relative">
                      <button
                        type="button"
                        onClick={() => toggle(asset)}
                        className={`block aspect-square w-full overflow-hidden rounded-md border-2 ${order >= 0 ? "border-primary" : "border-transparent"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaUrl(asset)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                      {order >= 0 && (
                        <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {order + 1}
                        </span>
                      )}
                      {asset.source === "AI_GENERATED" && <Badge className="absolute bottom-1 left-1">AI</Badge>}
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="img-prompt">Mô tả ảnh muốn tạo</Label>
              <Textarea
                id="img-prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: bình giữ nhiệt đặt trên bàn gỗ cạnh cửa sổ, ánh nắng buổi sáng"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Khung ảnh</Label>
                <Select value={aspect} onValueChange={setAspect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECTS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ảnh gốc từ sản phẩm (tuỳ chọn)</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Không dùng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không dùng</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title.slice(0, 50)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button disabled={generating || prompt.trim().length < 5} onClick={() => void proposeImage()}>
              <Wand2 className="mr-1 h-4 w-4" />
              {generating ? "Đang chuẩn bị…" : "Xem chi phí và tạo ảnh"}
            </Button>
            {action && (
              <AiActionCard
                action={action}
                onChange={(updated) => {
                  setAction(updated);
                  if (updated.status === "EXECUTED") void mutate();
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            onClick={() => {
              onConfirm(picked);
              onClose();
            }}
          >
            Dùng {picked.length} ảnh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Soạn bài fanpage: AI viết nội dung, chọn ảnh, lưu nháp, rồi đăng hoặc hẹn giờ (có xác nhận). */
export function PostComposer({
  pages,
  products,
  editing,
  onSaved,
  onPublished,
}: {
  pages: FacebookPage[];
  products: Product[];
  editing: ContentPost | null;
  onSaved: (post: ContentPost) => void;
  onPublished: () => void;
}) {
  const publishable = pages.filter((p) => p.canPublish);
  const [postId, setPostId] = useState<string | null>(editing?.id ?? null);
  const [pageId, setPageId] = useState(editing?.pageId ?? publishable[0]?.id ?? "");
  const [productId, setProductId] = useState(editing?.productId ?? "none");
  const [message, setMessage] = useState(editing?.message ?? "");
  const [link, setLink] = useState(editing?.link ?? "");
  const [media, setMedia] = useState<MediaAsset[]>(editing?.media ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [action, setAction] = useState<AiAction | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");

  // AI viết bài
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("friendly");
  const [goal, setGoal] = useState("messages");
  const [writing, setWriting] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);

  const save = async (): Promise<ContentPost> => {
    const body = {
      pageId: pageId || null,
      productId: productId !== "none" ? productId : null,
      message,
      link: link.trim() || null,
      mediaIds: media.map((m) => m.id),
    };
    const res = await apiFetch(postId ? `/social/posts/${postId}` : "/social/posts", {
      method: postId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const saved = await res.json();
    if (!res.ok) throw new Error(saved.message || "Không lưu được bài");
    setPostId(saved.id);
    onSaved(saved);
    return saved;
  };

  const write = async () => {
    setWriting(true);
    try {
      const res = await apiFetch("/ai/write-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(brief.trim() ? { brief: brief.trim() } : {}),
          ...(productId !== "none" ? { productId } : {}),
          tone,
          goal,
          variants: 3,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "AI chưa viết được");
      setVariants(body.variants);
      if (body.link && !link) setLink(body.link);
      toast.success(`AI đã viết ${body.variants.length} phương án`, { description: `Đã dùng ${formatPoints(body.cost)}` });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWriting(false);
    }
  };

  const propose = async (schedule: boolean) => {
    setBusy("publish");
    try {
      const saved = await save();
      const res = await apiFetch("/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "PUBLISH_POST",
          params: { postId: saved.id, ...(schedule && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}) },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Không tạo được đề xuất");
      setAction(body);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Đăng lên fanpage</Label>
            <Select value={pageId} onValueChange={setPageId}>
              <SelectTrigger>
                <SelectValue placeholder={pages.length ? "Chọn fanpage" : "Chưa kết nối fanpage"} />
              </SelectTrigger>
              <SelectContent>
                {pages.map((p) => (
                  <SelectItem key={p.id} value={p.id} disabled={!p.canPublish}>
                    {p.name}
                    {p.canPublish ? "" : " (không có quyền đăng)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sản phẩm liên quan (tuỳ chọn)</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Không gắn sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không gắn sản phẩm</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title.slice(0, 50)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" /> Nhờ AI viết bài
          </p>
          <Textarea
            rows={2}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Mô tả thêm (khuyến mãi, điểm nổi bật…). Đã chọn sản phẩm thì có thể bỏ trống."
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOALS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" disabled={writing || (productId === "none" && brief.trim().length < 5)} onClick={() => void write()}>
            {writing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            {variants.length ? "Viết lại 3 phương án" : "Viết 3 phương án"}
          </Button>
          {variants.length > 0 && (
            <ul className="grid gap-2 md:grid-cols-3">
              {variants.map((v, i) => (
                <li key={i} className="flex flex-col rounded-md border bg-background p-2">
                  <p className="mb-2 text-xs font-semibold text-primary">Phương án {i + 1}</p>
                  <p className="max-h-40 flex-1 overflow-y-auto whitespace-pre-wrap text-xs">{v}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setMessage(v)}>
                    Dùng bài này
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Nội dung bài</Label>
          <Textarea id="message" rows={10} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Nội dung bài đăng…" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Link mua hàng (tuỳ chọn)</Label>
          <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Ảnh ({media.length})</Label>
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <ImagePlus className="mr-1 h-4 w-4" /> Thêm / tạo ảnh
            </Button>
          </div>
          {media.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {media.map((m) => (
                <li key={m.id} className="relative h-20 w-20 overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(m)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Gỡ ảnh"
                    onClick={() => setMedia((prev) => prev.filter((x) => x.id !== m.id))}
                    className="absolute right-0 top-0 bg-black/60 p-1 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Button
            variant="outline"
            disabled={busy !== null || (!message.trim() && media.length === 0)}
            onClick={async () => {
              setBusy("save");
              try {
                await save();
                toast.success("Đã lưu bản nháp");
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(null);
              }
            }}
          >
            <Save className="mr-1 h-4 w-4" /> Lưu nháp
          </Button>
          <Button disabled={busy !== null || !pageId || (!message.trim() && media.length === 0)} onClick={() => void propose(false)}>
            <Send className="mr-1 h-4 w-4" /> Đăng ngay
          </Button>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="sched" className="text-xs">
                Hoặc hẹn giờ
              </Label>
              <Input id="sched" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-52" />
            </div>
            <Button variant="secondary" disabled={busy !== null || !pageId || !scheduledAt} onClick={() => void propose(true)}>
              Hẹn giờ
            </Button>
          </div>
        </div>

        {action && (
          <AiActionCard
            action={action}
            onChange={(updated) => {
              setAction(updated);
              if (updated.status === "EXECUTED") onPublished();
            }}
          />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Xem trước</p>
        <div className="overflow-hidden rounded-md border">
          <div className="flex items-center gap-2 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {(pages.find((p) => p.id === pageId)?.name ?? "P").slice(0, 1)}
            </div>
            <div>
              <p className="text-sm font-semibold">{pages.find((p) => p.id === pageId)?.name ?? "Chọn fanpage"}</p>
              <p className="text-xs text-muted-foreground">Vừa xong</p>
            </div>
          </div>
          <p className="whitespace-pre-wrap px-3 pb-2 text-sm">{message || <span className="text-muted-foreground">Nội dung bài…</span>}</p>
          {media[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(media[0])} alt="" className="w-full object-cover" />
          )}
        </div>
      </div>

      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} selected={media} onConfirm={setMedia} products={products} />
    </div>
  );
}
