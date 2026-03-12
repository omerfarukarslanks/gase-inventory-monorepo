"use client";

import ChatPanel from "@/components/chat/ChatPanel";
import { ReportShell } from "@/components/reports/ReportShell";

export default function ChatPage() {
  return (
    <ReportShell
      title="AI Copilot"
      description="Operasyon, satis ve rapor baglamini kullanarak ozet, yorum ve aksiyon onerisi alabilirsiniz."
      showAiAction={false}
    >
      <section className="rounded-xl2 border border-border bg-surface p-4">
        <ChatPanel
          className="h-[calc(100vh-220px)] min-h-[420px]"
          contentClassName="max-h-none"
        />
      </section>
    </ReportShell>
  );
}
