"use client";

import { cn } from "@/lib/cn";

type Props = {
  label: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  variant?:
    | "link"
    | "primarySoft"
    | "secondary"
    | "primarySolid"
    | "dangerSoft"
    | "authPrimary"
    | "authSecondary"
    | "pagination"
    | "paginationActive";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  form?: string;
  fullWidth?: boolean;
};

export default function Button({
  label,
  type = "button",
  className,
  variant = "link",
  disabled = false,
  loading = false,
  onClick,
  form,
  fullWidth = false,
}: Props) {
  const variantClasses: Record<NonNullable<Props["variant"]>, string> = {
    link: "text-[13px] font-semibold text-primary hover:opacity-90",
    primarySoft:
      "rounded-xl2 border border-primary/30 bg-primary/10 text-sm font-semibold text-primary hover:bg-primary/15",
    secondary:
      "rounded-xl2 border border-border bg-surface px-3 py-2 text-sm text-text hover:bg-surface2",
    primarySolid:
      "rounded-xl2 border border-primary/20 bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90",
    dangerSoft:
      "rounded-xl2 border border-error/40 bg-error/10 px-3 py-2 text-sm font-semibold text-text hover:bg-error/20",
    authPrimary:
      "rounded-[10px] bg-gradient-to-br from-primary to-accent py-[14px] text-[14.5px] font-bold text-white shadow-glow hover:opacity-[0.98]",
    authSecondary:
      "rounded-[10px] border-[1.5px] border-border px-5 py-[14px] text-[14px] font-semibold text-text2 transition-all duration-200 hover:border-borderHover",
    pagination:
      "rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text hover:bg-surface2",
    paginationActive:
      "rounded-lg border border-primary bg-primary/15 px-2 py-1 text-xs text-primary",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      form={form}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        variantClasses[variant],
        fullWidth && "w-full",
        disabled || loading ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      {loading ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-sp">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.28" strokeWidth="3" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>{label}</span>
        </>
      ) : <span>{label}</span>}

    </button>
  );
}
