"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { sendChatMessage, type ChatMessage } from "@/lib/chat";
import { cn } from "@/lib/cn";

type ChatPanelProps = {
  className?: string;
  contentClassName?: string;
  quickPrompts?: string[];
  headerSlot?: ReactNode;
};

const DEFAULT_PROMPTS = [
  "Bu hafta en cok satan 10 urun?",
  "Dusuk stok alarmi olan urunleri ozetle",
  "Iptal orani artmis mi? Kisa analiz yap",
  "Magazalara gore performans karsilastirmasi ver",
];

export default function ChatPanel({
  className,
  contentClassName,
  quickPrompts = DEFAULT_PROMPTS,
  headerSlot,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Merhaba, raporlar ve operasyon akislari icin yardimci olabilirim.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending,
    [input, sending],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const submit = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;

    const nextUserMessage: ChatMessage = {
      role: "user",
      content,
    };

    const nextMessages = [...messages, nextUserMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const response = await sendChatMessage({
        messages: [
          {
            role: "user",
            content,
          },
        ],
      });
      setMessages((prev) => [...prev, response.message]);
    } catch {
      setError("AI yaniti alinamadi. Lutfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {headerSlot}

      {quickPrompts.length > 0 && (
        <div className="mt-3 grid gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void submit(prompt)}
              disabled={sending}
              className="rounded-xl2 border border-border bg-surface2 p-3 text-left text-sm text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          "mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl2 border border-border bg-surface2/30 p-3",
          contentClassName,
        )}
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
            className={cn(
              "max-w-[92%] rounded-xl px-3 py-2 text-sm",
              message.role === "user"
                ? "ml-auto bg-primary/15 text-text"
                : "mr-auto border border-border bg-surface text-text2",
            )}
          >
            {message.content}
          </div>
        ))}
        {sending && (
          <div className="mr-auto max-w-[92%] rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
            Yaziyor...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}

      <div className="mt-3 space-y-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="h-24 w-full rounded-xl2 border border-border bg-surface2 p-3 text-sm text-text outline-none focus:ring-2 focus:ring-primary/25"
          placeholder="Sorunu yaz..."
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void submit(input);
            }
          }}
        />
        <Button
          label={sending ? "Gonderiliyor..." : "Gonder"}
          onClick={() => void submit(input)}
          loading={sending}
          disabled={!canSend}
          variant="primarySolid"
          className="h-11 w-full"
        />
      </div>
    </div>
  );
}
