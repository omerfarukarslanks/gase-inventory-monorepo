"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FieldError } from "./FieldError";

type FormFieldProps = {
  label?: ReactNode;
  error?: string;
  helperText?: ReactNode;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
};

export default function FormField({
  label,
  error,
  helperText,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <label
          className={cn(
            "text-xs font-semibold",
            error ? "text-error" : "text-muted",
            labelClassName,
          )}
        >
          {label}
        </label>
      ) : null}

      {children}

      {error ? (
        <FieldError error={error} className="px-1 text-xs text-error" />
      ) : helperText ? (
        <div className="px-1 text-xs text-muted">{helperText}</div>
      ) : null}
    </div>
  );
}
