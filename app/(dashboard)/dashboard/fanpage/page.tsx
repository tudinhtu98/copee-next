"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ExternalLink, Link2, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AiActionCard } from "@/components/ai-action-card";
import { PostComposer } from "./post-composer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, fetcher } from "@/src/lib/fetcher";
import {
  formatDateTime,
  mediaUrl,
  POST_STATUS_LABEL,
  type AiAction,
  type ContentPost,
  type FacebookPage,
  type PagePost,
  type Product,
  type SocialConnection,
} from "@/lib/ai-types";

interface PagePostsResponse {
  items: PagePost[];
  nextCursor: string | null;
}

/** Kết nối Facebook: mở cửa sổ đồng ý của Facebook, hoặc dán token thủ công. */
function ConnectCard({ onConnected }: { onConnected: () => void }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      const res = await apiFetch("/social/facebook/auth-url");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Chưa cấu hình ứng dụng Facebook");
      window.location.href = body.url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  const pasteToken = async () => {
    setBusy(true);
    try {
      const res = await apiFetch("/social/facebook/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Kết nối thất bại");
      toast.success("Đã kết nối Facebook");
      setToken("");
      onConnected();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div>
        <h2 className="font-medium">Kết nối Facebook</h2>
        <p className="text-sm text-muted-foreground">
          Cho phép copee đọc danh sách fanpage, đăng bài và quản lý bài trên Page. Token được mã hoá trước khi lưu.
        </p>
      </div>
      <Button onClick={() => void connect()} disabled={busy}>
        <Link2 className="mr-1 h-4 w-4" /> Kết nối bằng Facebook
      </Button>
      <div className="space-y-2 border-t pt-3">
        <Label htmlFor="fb-token" className="text-sm">
          Hoặc dán access token thủ công (Graph API Explorer)
        </Label>
        <div className="flex gap-2">
          <Input id="fb-token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="EAAG..." />
          <Button variant="outline" disabled={busy || token.trim().length < 30} onClick={() => void pasteToken()}>
            Lưu token
          </Button>
        </div>
      </div>
    </div>
  );
}

function PostsTab({
  posts,
  reload,
  onEdit,
}: {
  posts: ContentPost[];
  reload: () => void;
  onEdit: (post: ContentPost) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (post: ContentPost) => {
    if (!window.confirm("Xoá bài này khỏi copee? Bài đã đăng trên Facebook vẫn giữ nguyên.")) return;
    setBusyId(post.id);
    try {
      const res = await apiFetch(`/social/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message || "Không xoá được");
      toast.success("Đã xoá bài khỏi copee");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const refresh = async (post: ContentPost) => {
    setBusyId(post.id);
    try {
      const res = await apiFetch(`/social/posts/${post.id}/refresh`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Không kiểm tra được");
      toast.info(body.status === "PUBLISHED" ? "Bài đã lên Page" : "Bài vẫn đang chờ tới giờ đăng");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (!posts.length) return <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bài nào. Sang tab “Soạn bài” để bắt đầu.</p>;

  return (
    <ul className="space-y-3">
      {posts.map((p) => (
        <li key={p.id} className="flex gap-3 rounded-md border p-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
            {p.media[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(p.media[0])} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={p.status === "PUBLISHED" ? "secondary" : p.status === "FAILED" ? "destructive" : "outline"}>
                {POST_STATUS_LABEL[p.status]}
              </Badge>
              {p.pageName && <span className="font-medium text-foreground">{p.pageName}</span>}
              <span>
                {p.status === "SCHEDULED"
                  ? `Hẹn đăng ${formatDateTime(p.scheduledAt)}`
                  : p.status === "PUBLISHED"
                    ? `Đã đăng ${formatDateTime(p.publishedAt)}`
                    : `Sửa lúc ${formatDateTime(p.updatedAt)}`}
              </span>
            </div>
            <p className="line-clamp-2 whitespace-pre-wrap text-sm">{p.message || <em className="text-muted-foreground">(Không có chữ)</em>}</p>
            {p.error && <p className="text-xs text-destructive">{p.error}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {(p.status === "DRAFT" || p.status === "FAILED") && (
                <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa / đăng
                </Button>
              )}
              {p.status === "SCHEDULED" && (
                <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => void refresh(p)}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Kiểm tra đã lên chưa
                </Button>
              )}
              {p.permalink && (
                <a
                  href={p.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Xem trên Facebook
                </a>
              )}
              {p.status !== "PUBLISHING" && (
                <Button size="sm" variant="ghost" disabled={busyId === p.id} onClick={() => void remove(p)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Xoá
                </Button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PagePostsTab({ pages }: { pages: FacebookPage[] }) {
  const [pageId, setPageId] = useState(pages[0]?.id ?? "");
  const { data, error, isLoading, mutate } = useSWR<PagePostsResponse>(pageId ? `/social/pages/${pageId}/posts` : null, fetcher);
  const [action, setAction] = useState<AiAction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const proposeDelete = async (post: PagePost) => {
    setBusyId(post.id);
    try {
      const res = await apiFetch("/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "DELETE_PAGE_POST", params: { pageId, postId: post.id } }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Không tạo được đề xuất");
      setAction(body);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Fanpage</Label>
          <Select value={pageId} onValueChange={setPageId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Chọn fanpage" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => void mutate()}>
          <RefreshCw className="mr-1 h-4 w-4" /> Tải lại
        </Button>
      </div>

      {action && <AiActionCard action={action} onChange={(u) => { setAction(u); if (u.status === "EXECUTED") void mutate(); }} />}

      {error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Đang lấy bài từ Facebook…</p>
      ) : !data?.items.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Fanpage chưa có bài nào.</p>
      ) : (
        <ul className="space-y-3">
          {data.items.map((p) => (
            <li key={p.id} className="flex gap-3 rounded-md border p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {p.picture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.picture} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{p.type}</Badge>
                  <span>{formatDateTime(p.createdAt)}</span>
                  {p.localPostId && <Badge variant="secondary">Có trong copee</Badge>}
                </div>
                <p className="line-clamp-2 whitespace-pre-wrap text-sm">{p.message || <em className="text-muted-foreground">(Không có chữ)</em>}</p>
                <p className="text-xs text-muted-foreground">
                  {p.reactions} cảm xúc · {p.comments} bình luận · {p.shares} chia sẻ
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {p.permalink && (
                    <a
                      href={p.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Xem trên Facebook
                    </a>
                  )}
                  <Button size="sm" variant="ghost" disabled={busyId === p.id} onClick={() => void proposeDelete(p)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Xoá trên Page
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FanpagePage() {
  const params = useSearchParams();
  const { data: connections, mutate: reloadConnections } = useSWR<SocialConnection[]>("/social/connections", fetcher);
  const { data: pages, mutate: reloadPages } = useSWR<FacebookPage[]>("/social/pages", fetcher);
  const { data: posts, mutate: reloadPosts } = useSWR<ContentPost[]>("/social/posts", fetcher);
  const { data: productList } = useSWR<{ products?: Product[] } | Product[]>("/products?limit=50", fetcher);
  const [tab, setTab] = useState("compose");
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const [composerKey, setComposerKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const products = Array.isArray(productList) ? productList : (productList?.products ?? []);
  const connected = (connections?.length ?? 0) > 0;

  const refreshPages = async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch("/social/pages/refresh", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).message || "Không tải lại được");
      await reloadPages();
      toast.success("Đã tải lại danh sách fanpage");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Fanpage</h1>
        <p className="text-sm text-muted-foreground">
          Soạn bài với AI, đăng lên fanpage hoặc hẹn giờ, và quản lý bài đang có trên Page.
        </p>
      </div>

      {params.get("connected") === "1" && <p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">Đã kết nối Facebook.</p>}
      {params.get("error") && <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{params.get("error")}</p>}

      {!connected && <ConnectCard onConnected={() => { void reloadConnections(); void reloadPages(); }} />}

      {connected && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">{pages?.length ?? 0} fanpage</span>
          {pages?.slice(0, 4).map((p) => (
            <Badge key={p.id} variant="outline">
              {p.name}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" disabled={refreshing} onClick={() => void refreshPages()}>
            {refreshing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
            Tải lại
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="compose">{editing ? "Sửa bài" : "Soạn bài"}</TabsTrigger>
          <TabsTrigger value="posts">Bài trong copee ({posts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="page">Bài trên Page</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="pt-3">
          <PostComposer
            key={composerKey}
            pages={pages ?? []}
            products={products}
            editing={editing}
            onSaved={() => void reloadPosts()}
            onPublished={() => {
              void reloadPosts();
              setEditing(null);
              setComposerKey((k) => k + 1);
              setTab("posts");
            }}
          />
        </TabsContent>

        <TabsContent value="posts" className="pt-3">
          <PostsTab
            posts={posts ?? []}
            reload={() => void reloadPosts()}
            onEdit={(post) => {
              setEditing(post);
              setComposerKey((k) => k + 1);
              setTab("compose");
            }}
          />
        </TabsContent>

        <TabsContent value="page" className="pt-3">
          {pages?.length ? <PagePostsTab pages={pages} /> : <p className="py-6 text-center text-sm text-muted-foreground">Chưa có fanpage nào.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
