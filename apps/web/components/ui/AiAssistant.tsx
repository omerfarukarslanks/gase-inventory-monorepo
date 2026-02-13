"use client";

import { useState, useEffect } from "react";
import Drawer from "@/components/ui/Drawer";
import type { DrawerSide } from "@/components/ui/Drawer";

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<DrawerSide>("right");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) =>
      setSide(e.matches ? "right" : "bottom");
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 w-10 rounded-xl2 border border-border bg-surface text-sm font-medium text-text hover:bg-surface2 md:w-auto md:px-3"
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
        closeLabel="✕"
        className={side === "bottom" ? "rounded-t-2xl" : ""}
      >
        <div className="p-4">
          <div className="text-sm text-muted">Hızlı komutlar</div>
          <div className="mt-3 grid gap-2">
            {[
              "Bu hafta en çok satan 10 ürün?",
              "Kadıköy mağazası düşük stokları listele",
              "Bekleyen transferler için öneri oluştur",
              "İade oranı artmış mı? Sebep analizi",
            ].map((t) => (
              <button
                key={t}
                className="rounded-xl2 border border-border bg-surface2 p-3 text-left text-sm text-text hover:bg-surface"
              >
                {t}
              </button>
            ))}
          </div>

          <textarea
            className="mt-4 h-28 w-full rounded-xl2 border border-border bg-surface2 p-3 text-sm text-text outline-none focus:ring-2 focus:ring-primary/25"
            placeholder="Sorunu yaz..."
          />
          <button className="mt-2 h-11 w-full rounded-xl2 bg-primary text-sm font-semibold text-black hover:bg-primaryHover">
            Gönder
          </button>
        </div>
      </Drawer>
    </>
  );
}
