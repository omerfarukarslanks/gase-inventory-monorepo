"use client";

import { cn } from "@/lib/cn";
import FormField from "./FormField";

type TextareaFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
};

export default function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  error,
  rows = 3,
  disabled = false,
  className,
  textareaClassName,
}: TextareaFieldProps) {
  return (
    <FormField label={label} error={error} className={className}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          "w-full resize-none rounded-xl border-[1.5px] bg-surface px-3.5 py-[13px] text-[14px] text-text outline-none transition-all duration-[250ms] placeholder:text-muted",
          error
            ? "border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
            : "border-border focus:border-primary focus:bg-primary/[0.03] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]",
          disabled ? "cursor-not-allowed opacity-60" : "",
          textareaClassName,
        )}
      />
    </FormField>
  );
}
