"use client";

import { AiAssistant } from "@/components/ui/AiAssistant";
import ActiveStoreChip from "@/components/ui/ActiveStoreChip";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LangToggle from "@/components/ui/LangToggle";
import { useLang } from "@/context/LangContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import type { ViewportMode } from "@/hooks/useViewportMode";
import { cn } from "@/lib/cn";

type TopbarProps = {
  mode: ViewportMode;
  onOpenNavigation?: () => void;
};

export default function Topbar({ mode, onOpenNavigation }: TopbarProps) {
  const { t, lang } = useLang();
  const { can } = usePermissions();
  const { activeItem } = useAppNavigation();
  const isMobile = mode === "mobile";
  const isTablet = mode === "tablet";

  const localeMap = {
    tr: "tr-TR",
    en: "en-US",
    es: "es-ES",
    de: "de-DE",
    ar: "ar-SA",
  } as const;

  const pageTitle = activeItem ? t(activeItem.labelKey) : t("topbar.pageTitle");
  const dateStr = new Date().toLocaleDateString(localeMap[lang], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isMobile) {
    return (
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-text">{pageTitle}</div>
              <div className="truncate text-xs text-muted">{dateStr}</div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {can("AI_CHAT") && <AiAssistant />}
            </div>
          </div>

          <ActiveStoreChip compact className="w-full" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/70 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {isTablet && onOpenNavigation ? (
            <button
              type="button"
              onClick={onOpenNavigation}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2 border border-border bg-surface text-text transition-colors hover:bg-surface2"
              aria-label={t("shell.navigationMenu")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          ) : null}

          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-text">{pageTitle}</div>
            <div className="truncate text-xs text-muted">{dateStr}</div>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <ActiveStoreChip compact={isTablet} className={cn("min-w-0", isTablet ? "max-w-60" : "max-w-72")} />
          {can("AI_CHAT") && <AiAssistant />}
          {!isTablet && <LangToggle />}
          {!isTablet && <ThemeToggle fixed={false} className="rounded-xl2" />}
        </div>
      </div>
    </header>
  );
}
