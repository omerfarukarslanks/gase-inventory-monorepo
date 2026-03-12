"use client";

import type { ReactNode } from "react";
import { ReportEmptyState } from "@/components/reports/ReportEmptyState";
import { ReportErrorState } from "@/components/reports/ReportErrorState";

type ReportTableSurfaceProps = {
  loading: boolean;
  error?: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
  loadingLabel?: string;
  className?: string;
};

export function ReportTableSurface({
  loading,
  error,
  isEmpty,
  emptyMessage,
  children,
  loadingLabel = "Yukleniyor...",
  className = "rounded-2xl border border-border bg-surface p-6 shadow-glow",
}: ReportTableSurfaceProps) {
  return (
    <div className={className}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted">{loadingLabel}</p>
        </div>
      ) : error ? (
        <ReportErrorState message={error} />
      ) : isEmpty ? (
        <ReportEmptyState message={emptyMessage} />
      ) : (
        children
      )}
    </div>
  );
}
