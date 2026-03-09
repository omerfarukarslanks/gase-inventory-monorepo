"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type PageShellProps = {
  /** Filter bar rendered above the table */
  filters?: ReactNode;
  /** Table (or main content) area */
  children: ReactNode;
  /** Top-level error message shown between filters and table */
  error?: string;
  className?: string;
};

/**
 * Consistent page-level wrapper used by all domain PageClient components.
 * Provides uniform spacing, optional filter bar placement, and a top-level
 * error banner slot so individual pages don't have to repeat this layout.
 */
export function PageShell({ filters, children, error, className }: PageShellProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {filters}
      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}
      {children}
    </div>
  );
}
