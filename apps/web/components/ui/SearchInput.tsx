"use client";

import type { InputHTMLAttributes } from "react";
import { SearchIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
  inputClassName?: string;
};

export default function SearchInput({
  value,
  onChange,
  containerClassName,
  inputClassName,
  placeholder = "Ara...",
  disabled = false,
  ...rest
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
        <SearchIcon />
      </div>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60",
          inputClassName,
        )}
        {...rest}
      />
    </div>
  );
}
