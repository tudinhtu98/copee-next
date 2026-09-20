"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ShieldAlert, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/src/lib/fetcher";
import {
  ACTION_KIND_LABEL,
  ACTION_STATUS_LABEL,
  formatPoints,
  type AiAction,
  type AiActionStatus,
} from "@/lib/ai-types";

const STATUS_VARIANT: Record<AiActionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PROPOSED: "default",
  EXECUTING: "secondary",
  EXECUTED: "secondary",
  FAILED: "destructive",
  CANCELLED: "outline",
  EXPIRED: "outline",
};

/** Giá trị là link (ảnh vừa tạo, link bài) thì cho bấm mở. */
function Value({ text }: { text: string }) {
  if (/^https?:\/\//.test(text)) {
    return (
      <a href={text} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
        Mở link
      </a>
    );
  }
  if (text.startsWith("/social/media/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/api/proxy${text}`} alt="Ảnh vừa tạo" className="mt-1 max-h-40 rounded-md border" />
    );
  }
  return <>{text}</>;
}

/**
 * Thẻ đề xuất: cho xem trước những gì sẽ xảy ra và chi phí, rồi người dùng bấm Xác nhận.
 * Đề xuất có thể do trợ lý AI, agent qua MCP hoặc chính nút bấm trên web tạo ra —
 * lúc nào cũng phải có người bấm Xác nhận thì mới thực hiện.
 */
export function AiActionCard({
  action: initial,
  onChange,
}: {
  action: AiAction;
  onChange?: (action: AiAction) => void;
}) {
  const [action, setAction] = useState(initial);
  const [pending, setPending] = useState<"confirm" | "cancel" | null>(null);

  useEffect(() => setAction(initial), [initial]);

  const expired = action.status === "PROPOSED" && new Date(action.expiresAt) < new Date();
  const status: AiActionStatus = expired ? "EXPIRED" : action.status;
  const destructive = action.kind === "DELETE_PAGE_POST";
  const done = status === "EXECUTED" || status === "FAILED";

  const act = async (kind: "confirm" | "cancel") => {
    setPending(kind);
    try {
      const res = await apiFetch(`/ai/actions/${action.id}/${kind}`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Không thực hiện được");
      setAction(body);
      onChange?.(body);
      if (kind === "confirm") {
        if (body.status === "EXECUTED") toast.success("Đã thực hiện", { description: body.summary });
        else toast.error("Không thực hiện được", { description: body.error ?? undefined });
      } else {
        toast.info("Đã huỷ đề xuất");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className={`rounded-md border p-3 text-sm ${status === "PROPOSED" ? (destructive ? "border-destructive/50" : "border-amber-400/60") : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        {destructive ? (
          <ShieldAlert className="h-4 w-4 text-destructive" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
        <span className="text-xs font-medium uppercase text-muted-foreground">{ACTION_KIND_LABEL[action.kind]}</span>
        <Badge variant={STATUS_VARIANT[status]}>{ACTION_STATUS_LABEL[status]}</Badge>
        {action.costPoints > 0 && <Badge variant="outline">{formatPoints(action.costPoints)}</Badge>}
      </div>
      <p className="mt-1.5 font-medium">{action.summary}</p>

      <ul className="mt-2 divide-y rounded-md border">
        {action.items.map((item, i) => (
          <li key={i} className="flex flex-wrap items-start gap-x-2 gap-y-1 px-2.5 py-2">
            {done &&
              (item.ok === false ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : item.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : null)}
            <span className="min-w-0 flex-1 basis-32 text-muted-foreground">{item.label}</span>
            <span className="flex min-w-0 items-center gap-1.5 font-medium">
              {item.before && (
                <>
                  <span className="text-muted-foreground line-through">{item.before}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </>
              )}
              {item.after && <Value text={item.after} />}
            </span>
            {item.error && <p className="w-full text-xs text-destructive">{item.error}</p>}
          </li>
        ))}
      </ul>

      {status === "PROPOSED" && action.warnings.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {action.warnings.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      )}
      {action.error && <p className="mt-2 text-xs text-destructive">{action.error}</p>}

      {status === "PROPOSED" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant={destructive ? "destructive" : "default"} disabled={pending !== null} onClick={() => void act("confirm")}>
            <Check className="mr-1 h-4 w-4" />
            {pending === "confirm" ? "Đang thực hiện..." : "Xác nhận thực hiện"}
          </Button>
          <Button size="sm" variant="outline" disabled={pending !== null} onClick={() => void act("cancel")}>
            <X className="mr-1 h-4 w-4" />
            Huỷ
          </Button>
          <span className="text-xs text-muted-foreground">
            Hết hạn lúc {new Date(action.expiresAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}
      {status === "EXPIRED" && (
        <p className="mt-2 text-xs text-muted-foreground">Đề xuất đã hết hạn. Hãy yêu cầu lại để dùng dữ liệu mới nhất.</p>
      )}
    </div>
  );
}
