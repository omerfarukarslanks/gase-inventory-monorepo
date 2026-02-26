"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableDropdownOption = {
  value: string;
  label: string;
};

type SearchableDropdownProps = {
  options: SearchableDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyOptionLabel?: string;
  noResultsText?: string;
  clearAriaLabel?: string;
  toggleAriaLabel?: string;
  inputAriaLabel?: string;
  allowClear?: boolean;
  showEmptyOption?: boolean;
  showSearchInput?: boolean;
  menuPlacement?: "bottom" | "top";
  className?: string;
  disabled?: boolean;
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

const ClearIcon = () => (
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
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Seçiniz",
  emptyOptionLabel = "Tümü",
  noResultsText = "Sonuç bulunamadı.",
  clearAriaLabel = "Seçimi temizle",
  toggleAriaLabel = "Listeyi aç",
  inputAriaLabel = "Seçim filtresi",
  allowClear = true,
  showEmptyOption = true,
  showSearchInput = true,
  menuPlacement = "bottom",
  className = "",
  disabled = false,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (!showSearchInput) return;
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [open, showSearchInput]);

  const filteredOptions = useMemo(() => {
    if (!showSearchInput) return options;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [options, query, showSearchInput]);

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") setOpen(true);
          }}
          className={`h-10 w-full rounded-xl border border-border bg-surface pl-3 pr-16 text-left text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
          aria-label={inputAriaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          disabled={disabled}
        >
          <span className={selectedOption ? "text-text" : "text-muted"}>
            {selectedOption?.label ?? placeholder}
          </span>
        </button>

        {allowClear && value && !disabled && (
          <button
            type="button"
            onClick={() => selectOption("")}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-text"
            aria-label={clearAriaLabel}
          >
            <ClearIcon />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
          }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-text ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
          aria-label={toggleAriaLabel}
          disabled={disabled}
        >
          <ChevronIcon />
        </button>
      </div>

      {open && !disabled && (
        <div
          className={`absolute z-30 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lg shadow-primary/10 ${
            menuPlacement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {showSearchInput && (
            <div className="px-1 pb-1">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                placeholder="Ara..."
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                }}
                className="h-9 w-full rounded-lg border border-border bg-surface2 px-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                aria-label={inputAriaLabel}
              />
            </div>
          )}

          {showEmptyOption && (
            <button
              type="button"
              onClick={() => selectOption("")}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-text2 transition-colors hover:bg-surface2 hover:text-text"
            >
              {emptyOptionLabel}
            </button>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted">{noResultsText}</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectOption(option.value)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  value === option.value
                    ? "bg-primary/10 text-primary"
                    : "text-text2 hover:bg-surface2 hover:text-text"
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
