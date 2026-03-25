"use client";

import { cn } from "@/lib/cn";

type SegmentedControlOption = {
  value: string;
  label: string;
};

type SegmentedControlProps = {
  options: readonly SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
};

export default function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  buttonClassName,
  disabled = false,
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition-colors",
              selected
                ? "border-primary bg-primary/[0.05] font-medium text-primary"
                : "border-border text-text hover:bg-surface2",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              buttonClassName,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
