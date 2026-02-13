"use client";

import { AiAssistant } from "@/components/ui/AiAssistant";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Topbar() {
  const dateStr = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/70 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-text">Dashboard</div>
          <div className="truncate text-xs text-muted">{dateStr}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl2 border border-border bg-surface px-3 md:flex">
            <span className="text-muted">?</span>
            <input
              className="h-10 w-[260px] bg-transparent text-sm text-text outline-none placeholder:text-muted"
              placeholder="Ara..."
            />
          </div>

          <AiAssistant />

          <button className="h-10 w-10 rounded-xl2 border border-border bg-surface text-text hover:bg-surface2">
            ??
          </button>

          <ThemeToggle fixed={false} className="rounded-xl2" />
        </div>
      </div>
    </header>
  );
}
