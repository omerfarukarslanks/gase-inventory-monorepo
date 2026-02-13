import { cn } from "@/lib/cn";

export function KpiCard({
  title,
  value,
  hint,
  delta,
  variant = "primary",
  className,
}: {
  title: string;
  value: string;
  hint: string;
  delta: number; // +12.4, -15
  variant?: "primary" | "accent" | "warning" | "error";
  className?: string;
}) {
  const positive = delta >= 0;

  const badge = positive
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-error/10 text-error border-error/20";

  const orb =
    variant === "primary"
      ? "bg-primary/10"
      : variant === "accent"
      ? "bg-accent/10"
      : variant === "warning"
      ? "bg-warning/10"
      : "bg-error/10";

  return (
    <div className={cn("relative overflow-hidden rounded-xl2 border border-border bg-surface p-5 shadow-glow animate-su", className)}>
      <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full", orb)} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-sm text-muted">{title}</div>
          <div className="mt-2 text-2xl font-semibold text-text">{value}</div>
          <div className="mt-2 text-xs text-muted">{hint}</div>
        </div>

        <div className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", badge)}>
          {positive ? "▲" : "▼"} {Math.abs(delta)}%
        </div>
      </div>
    </div>
  );
}
