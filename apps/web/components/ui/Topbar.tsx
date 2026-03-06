"use client";

import { AiAssistant } from "@/components/ui/AiAssistant";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LangToggle from "@/components/ui/LangToggle";
import { useLang } from "@/context/LangContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function Topbar() {
  const { t, lang } = useLang();
  const { can } = usePermissions();

  const dateStr = new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/70 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-text">{t("topbar.pageTitle")}</div>
          <div className="truncate text-xs text-muted">{dateStr}</div>
        </div>

        <div className="flex items-center gap-2">
 {/*          <div className="hidden items-center gap-2 rounded-xl2 border border-border bg-surface px-3 md:flex">
            <span className="text-muted">?</span>
            <input
              className="h-10 w-65 bg-transparent text-sm text-text outline-none placeholder:text-muted"
              placeholder={t("topbar.search")}
            />
          </div> */}
          {can("AI_CHAT") && <AiAssistant />}

          <LangToggle />

          <ThemeToggle fixed={false} className="rounded-xl2" />
        </div>
      </div>
    </header>
  );
}
