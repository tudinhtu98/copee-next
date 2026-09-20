"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, History, MessageSquarePlus, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { AiActionCard } from "@/components/ai-action-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/src/lib/fetcher";
import { formatPoints, type ChatMessage, type Conversation, type ConversationDetail } from "@/lib/ai-types";

const SUGGESTIONS = [
  "Số dư của tôi còn bao nhiêu điểm?",
  "Liệt kê sản phẩm tôi đã copy gần đây",
  "Viết bài đăng Facebook cho sản phẩm mới nhất",
  "Tạo video quảng cáo cho sản phẩm bán chạy",
];

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[92%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm ${
          isUser ? "bg-primary text-primary-foreground" : "border bg-background"
        }`}
      >
        {message.content}
      </div>
      {message.toolCalls.length > 0 && (
        <details className="mt-1 w-full text-xs text-muted-foreground">
          <summary className="cursor-pointer">Đã tra dữ liệu ({message.toolCalls.length})</summary>
          <ul className="mt-1 space-y-0.5 pl-3">
            {message.toolCalls.map((t, i) => (
              <li key={i}>
                <span className="font-mono">{t.name}</span> — {t.summary}
              </li>
            ))}
          </ul>
        </details>
      )}
      {message.cost > 0 && <span className="mt-1 text-xs text-muted-foreground">Đã dùng {formatPoints(message.cost)}</span>}
      {message.actions.length > 0 && (
        <div className="mt-2 w-full space-y-2">
          {message.actions.map((a) => (
            <AiActionCard key={a.id} action={a} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Trợ lý AI nổi ở mọi trang: hỏi số dư, sản phẩm, job video, fanpage… và nhờ làm việc.
 * Việc tốn điểm hoặc khó hoàn tác chỉ hiện thành thẻ đề xuất, người dùng bấm Xác nhận mới chạy.
 */
export default function AiChatWidget() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const loadConversations = async () => {
    try {
      const res = await apiFetch("/ai/conversations");
      if (res.ok) setConversations(await res.json());
    } catch {
      /* im lặng: danh sách hội thoại không phải thứ chặn người dùng hỏi tiếp */
    }
  };

  const openConversation = async (id: string) => {
    setShowHistory(false);
    if (id === conversationId) return;
    try {
      const res = await apiFetch(`/ai/conversations/${id}`);
      if (!res.ok) throw new Error("Không mở được cuộc trò chuyện");
      const detail: ConversationDetail = await res.json();
      setConversationId(detail.id);
      setMessages(detail.messages);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const startNew = () => {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: message, toolCalls: [], actions: [], cost: 0, createdAt: new Date().toISOString() },
    ]);
    try {
      let id = conversationId;
      if (!id) {
        const created = await apiFetch("/ai/conversations", { method: "POST" });
        if (!created.ok) throw new Error("Không tạo được cuộc trò chuyện");
        id = (await created.json()).id as string;
        setConversationId(id);
      }
      const res = await apiFetch(`/ai/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Trợ lý chưa trả lời được");
      setMessages((prev) => [...prev, body.message]);
      void loadConversations();
    } catch (e) {
      toast.error((e as Error).message);
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("local-")));
      setInput(message);
    } finally {
      setSending(false);
    }
  };

  if (status !== "authenticated") return null;

  return (
    <>
      {mounted && (
        <section
          aria-label="Trợ lý AI"
          className={`fixed inset-0 z-50 flex-col overflow-hidden bg-background sm:inset-auto sm:bottom-16 sm:right-4 sm:h-[min(620px,calc(100dvh-6rem))] sm:w-[400px] sm:rounded-lg sm:border sm:shadow-xl ${
            open ? "flex" : "hidden"
          }`}
        >
          <div className="flex items-center gap-1 border-b px-2 py-2">
            {showHistory ? (
              <Button variant="ghost" size="icon" aria-label="Quay lại" onClick={() => setShowHistory(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <span className="ml-1 rounded-md bg-primary/10 p-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </span>
            )}
            <p className="flex-1 truncate px-1 text-sm font-semibold">{showHistory ? "Lịch sử trò chuyện" : "Trợ lý copee"}</p>
            {!showHistory && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Lịch sử trò chuyện"
                onClick={() => {
                  setShowHistory(true);
                  void loadConversations();
                }}
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label="Cuộc trò chuyện mới" onClick={startNew}>
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Đóng" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào.</p>
              ) : (
                <ul className="divide-y">
                  {conversations.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => void openConversation(c.id)}
                        className={`w-full px-2 py-2.5 text-left text-sm hover:bg-muted ${c.id === conversationId ? "bg-muted" : ""}`}
                      >
                        <span className="block truncate font-medium">{c.title}</span>
                        <span className="text-xs text-muted-foreground">{c.messageCount} tin nhắn</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <p className="text-sm font-medium">Hỏi trợ lý về gian hàng của bạn</p>
                    <p className="text-xs text-muted-foreground">
                      Trợ lý đọc dữ liệu thật: số dư, sản phẩm, video, fanpage. Việc tốn điểm luôn hỏi ý bạn trước.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void send(s)}
                          className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => <Bubble key={m.id} message={m} />)
                )}
                {sending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">Đang xử lý…</Badge>
                  </div>
                )}
              </div>

              <form
                className="flex items-end gap-2 border-t p-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
              >
                <textarea
                  rows={2}
                  value={input}
                  disabled={sending}
                  aria-label="Câu hỏi cho trợ lý"
                  placeholder="Hỏi về sản phẩm, số dư, fanpage…"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter gửi, Shift+Enter xuống dòng; bỏ qua khi bộ gõ tiếng Việt đang ghép chữ
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  className="flex-1 resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Gửi">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      )}

      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-16 right-4 z-50 h-12 rounded-full shadow-lg"
          aria-label="Mở trợ lý AI"
        >
          <Sparkles className="mr-1 h-5 w-5" />
          Trợ lý AI
        </Button>
      )}
    </>
  );
}
