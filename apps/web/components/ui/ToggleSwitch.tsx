"use client";

import { cn } from "@/lib/cn";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: ToggleSwitchProps) {
  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? "Toggle"}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
          checked
            ? "border-primary bg-primary/20"
            : "border-border bg-surface2",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-surface shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      {label ? (
        <span className="text-xs text-text2">{label}</span>
      ) : null}
    </label>
  );
}
