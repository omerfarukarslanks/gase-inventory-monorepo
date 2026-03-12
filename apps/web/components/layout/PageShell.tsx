"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useLang } from "@/context/LangContext";
import { useViewportMode } from "@/hooks/useViewportMode";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";

type PageShellProps = {
  /** Filter bar rendered above the table */
  filters?: ReactNode;
  /** Optional mobile-only filter body rendered in a fullscreen sheet */
  mobileFilters?: ReactNode;
  mobileFiltersTitle?: string;
  mobileFiltersDescription?: string;
  mobileFiltersLabel?: string;
  /** Table (or main content) area */
  children: ReactNode;
  /** Top-level error message shown between filters and table */
  error?: string;
  className?: string;
  contentClassName?: string;
};

/**
 * Consistent page-level wrapper used by all domain PageClient components.
 * Provides uniform spacing, optional filter bar placement, and a top-level
 * error banner slot so individual pages don't have to repeat this layout.
 */
export function PageShell({
  filters,
  mobileFilters,
  mobileFiltersTitle,
  mobileFiltersDescription,
  mobileFiltersLabel,
  children,
  error,
  className,
  contentClassName,
}: PageShellProps) {
  const { t } = useLang();
  const viewportMode = useViewportMode();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const isMobile = viewportMode === "mobile";

  return (
    <div className={cn("space-y-4", className)}>
      {filters}
      {isMobile && mobileFilters ? (
        <>
          <div className="flex justify-end">
            <Button
              label={mobileFiltersLabel ?? t("shell.filtersTitle")}
              onClick={() => setMobileFiltersOpen(true)}
              variant="secondary"
              className="px-3 py-2"
            />
          </div>
          <Drawer
            open={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            side="bottom"
            title={mobileFiltersTitle ?? t("shell.filtersTitle")}
            description={mobileFiltersDescription}
            mobileFullscreen
          >
            <div className="space-y-3 p-4">{mobileFilters}</div>
          </Drawer>
        </>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
