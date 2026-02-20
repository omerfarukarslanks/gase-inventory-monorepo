"use client";

import ChatPanel from "@/components/chat/ChatPanel";

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">AI Chat</h1>
        <p className="text-sm text-muted">
          Operasyon, satis ve stok raporlari icin soru sorup hizli ozet alabilirsiniz.
        </p>
      </div>

      <section className="rounded-xl2 border border-border bg-surface p-4">
        <ChatPanel
          className="h-[calc(100vh-220px)] min-h-[420px]"
          contentClassName="max-h-none"
        />
      </section>
    </div>
  );
}
