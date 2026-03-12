"use client";

import { useState } from "react";
import Link from "next/link";
import Drawer from "@/components/ui/Drawer";
import type { DrawerSide } from "@/components/ui/Drawer";
import { useViewportMode } from "@/hooks/useViewportMode";
import ChatPanel from "@/components/chat/ChatPanel";

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const viewportMode = useViewportMode();
  const side: DrawerSide = viewportMode === "desktop" ? "right" : "bottom";
  const mobileFullscreen = viewportMode === "mobile";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 w-10 rounded-xl2 border cursor-pointer border-border bg-surface text-sm font-medium text-text hover:bg-surface2 md:w-auto md:px-3"
        aria-label="Open AI Assistant"
      >
        <span className="md:hidden">✨</span>
        <span className="hidden md:inline">✨ AI Assistant</span>
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side={side}
        title="AI Assistant"
        description="Hizli analiz ve soru-cevap"
        closeLabel="✕"
        mobileFullscreen={mobileFullscreen}
        className={side === "bottom" && !mobileFullscreen ? "rounded-t-2xl" : ""}
      >
        <div className="flex h-full min-h-0 flex-col p-4">
          <div className="mb-2 flex items-center justify-end">
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text transition-colors hover:bg-surface2"
            >
              Tam Sayfa Ac
            </Link>
          </div>
          <ChatPanel
            className="min-h-0"
            contentClassName={mobileFullscreen ? "max-h-none" : side === "bottom" ? "max-h-[36vh]" : "max-h-[42vh]"}
            quickPrompts={[
              "Bu hafta en cok satan 10 urun?",
              "Low stock urunleri oncelik sirasina gore listele",
              "Iptal oraninda son 7 gunde degisim var mi?",
              "Magaza performansi icin ozet cikar",
            ]}
          />
        </div>
      </Drawer>
    </>
  );
}
