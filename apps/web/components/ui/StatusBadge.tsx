export type StatusVariant = "success" | "error" | "neutral";

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: "inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary",
  error: "inline-block rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error",
  neutral: "inline-block rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted",
};

type StatusBadgeProps = {
  label: string;
  variant?: StatusVariant;
  className?: string;
};

export function StatusBadge({ label, variant = "neutral", className }: StatusBadgeProps) {
  return <span className={className ?? VARIANT_CLASSES[variant]}>{label}</span>;
}
