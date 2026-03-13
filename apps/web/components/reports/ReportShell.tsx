"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { PageShell } from "@/components/layout/PageShell";
import { useViewportMode } from "@/hooks/useViewportMode";

type ReportShellProps = {
  title: string;
  description: string;
  filters?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  onExport?: () => void;
  disableExport?: boolean;
  aiHref?: string;
  showAiAction?: boolean;
  extraActions?: ReactNode;
};

export function ReportShell({
  title,
  description,
  filters,
  summary,
  children,
  onExport,
  disableExport = false,
  aiHref = "/chat",
  showAiAction = true,
  extraActions,
}: ReportShellProps) {
  const router = useRouter();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";

  const actionButtons = useMemo(
    () => {
      if (!onExport && !showAiAction) return null;
      return (
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          {onExport ? (
            <Button
              label="Export"
              onClick={onExport}
              disabled={disableExport}
              variant="secondary"
              className="px-3 py-2"
            />
          ) : null}
          {showAiAction ? (
            <Button
              label="AI ile yorumla"
              onClick={() => router.push(aiHref)}
              variant="primarySoft"
              className="px-3 py-2"
            />
          ) : null}
        </div>
      );
    },
    [aiHref, disableExport, extraActions, onExport, router, showAiAction],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
        </div>
        {actionButtons}
      </div>

      <PageShell
        filters={!isMobile ? filters : undefined}
        mobileFilters={isMobile ? filters : undefined}
        mobileFiltersTitle={`${title} filtreleri`}
        mobileFiltersDescription="Tarih, magaza ve rapora ozel filtreler bu alanda yonetilir."
        contentClassName="space-y-4"
      >
        {summary}
        {children}
      </PageShell>
    </div>
  );
}
