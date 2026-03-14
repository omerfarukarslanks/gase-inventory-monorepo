"use client";

export function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-12">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
