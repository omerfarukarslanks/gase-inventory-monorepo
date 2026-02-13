"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function AiAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 rounded-xl2 border border-border bg-surface px-3 text-sm font-medium text-text hover:bg-surface2"
      >
        ✨ AI Assistant
      </button>

      <div className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-black/50 transition", open ? "opacity-100" : "opacity-0")}
        />

        <aside
          className={cn(
            "absolute right-0 top-0 h-full w-[420px] max-w-[92vw] border-l border-border bg-surface transition-transform",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <div className="font-semibold text-text">AI Assistant</div>
            <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-xl2 border border-border bg-surface hover:bg-surface2">
              ✕
            </button>
          </div>

          <div className="p-4">
            <div className="text-sm text-muted">Hızlı komutlar</div>
            <div className="mt-3 grid gap-2">
              {[
                "Bu hafta en çok satan 10 ürün?",
                "Kadıköy mağazası düşük stokları listele",
                "Bekleyen transferler için öneri oluştur",
                "İade oranı artmış mı? Sebep analizi",
              ].map((t) => (
                <button key={t} className="rounded-xl2 border border-border bg-surface2 p-3 text-left text-sm text-text hover:bg-surface">
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
        </aside>
      </div>
    </>
  );
}
