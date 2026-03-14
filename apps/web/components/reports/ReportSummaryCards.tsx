"use client";

import type { ReportSummaryItem } from "@/lib/analytics";

export function ReportSummaryCards({
  items,
  columnsClassName = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
}: {
  items: ReportSummaryItem[];
  columnsClassName?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={`grid gap-4 ${columnsClassName}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-surface p-5 shadow-glow">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-text">{item.value}</p>
          {item.hint ? <p className="mt-2 text-xs text-muted">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
