"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { SearchableDropdownOption } from "@/components/ui/SearchableDropdown";

type SearchableMultiSelectDropdownProps = {
  options: SearchableDropdownOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  noResultsText?: string;
  className?: string;
};

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function SearchableMultiSelectDropdown({
  options,
  values,
  onChange,
  placeholder = "Magaza secin",
  noResultsText = "Sonuc bulunamadi.",
  className = "",
}: SearchableMultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  const selectedLabels = useMemo(
    () =>
      options
        .filter((option) => values.includes(option.value))
        .map((option) => option.label),
    [options, values],
  );

  const toggleValue = (nextValue: string) => {
    if (values.includes(nextValue)) {
      onChange(values.filter((value) => value !== nextValue));
      return;
    }

    onChange([...values, nextValue]);
  };

  const triggerText =
    selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 text-left text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <span className={cn("truncate", values.length === 0 && "text-muted")}>
          {triggerText}
        </span>
        <ChevronIcon />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-surface p-2 shadow-lg shadow-primary/10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ara..."
            className="mb-2 h-9 w-full rounded-lg border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />

          <div className="max-h-52 space-y-1 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1 text-sm text-muted">{noResultsText}</div>
            ) : (
              filteredOptions.map((option) => {
                const checked = values.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                      checked
                        ? "bg-primary/10 text-primary"
                        : "text-text2 hover:bg-surface2 hover:text-text",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-4 w-4 items-center justify-center rounded border text-[10px]",
                        checked
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
