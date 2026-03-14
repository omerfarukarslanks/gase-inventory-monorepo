"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";

type ReportFilterPanelProps = {
  children: ReactNode;
  onApply?: () => void;
  applyLabel?: string;
  loading?: boolean;
  footerSlot?: ReactNode;
};

export function ReportFilterPanel({
  children,
  onApply,
  applyLabel = "Filtrele",
  loading = false,
  footerSlot,
}: ReportFilterPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-glow">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {onApply || footerSlot ? (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          {footerSlot}
          {onApply ? (
            <Button
              label={loading ? "Yukleniyor..." : applyLabel}
              onClick={onApply}
              loading={loading}
              variant="primarySolid"
              className="h-10 px-5"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
