"use client";

export function ReportErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-error/30 bg-error/10 p-6 text-sm text-error">
      {message}
    </div>
  );
}
