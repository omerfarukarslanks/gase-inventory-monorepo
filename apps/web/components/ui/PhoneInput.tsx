"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";

// ─── helpers ──────────────────────────────────────────────────────────────────

function flagEmoji(code: string): string {
  return [...code]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["tr"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

type CountryOption = {
  code: string;   // "TR"
  dial: string;   // "90"
  flag: string;   // "🇹🇷"
  name: string;   // "Türkiye"
};

function buildCountryOptions(): CountryOption[] {
  return getCountries()
    .map((code) => ({
      code,
      dial: getCountryCallingCode(code),
      flag: flagEmoji(code),
      name: countryName(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  countryCode: string;      // "TR"
  localNumber: string;      // "5321234567"
  onCountryChange: (code: string) => void;
  onNumberChange: (number: string) => void;
  error?: string;
};

export default function PhoneInput({
  countryCode,
  localNumber,
  onCountryChange,
  onNumberChange,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const options = useMemo(buildCountryOptions, []);

  const selected = options.find((o) => o.code === countryCode) ?? options.find((o) => o.code === "TR");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.dial.includes(q),
    );
  }, [options, search]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const borderClass = error
    ? "border-error"
    : focused || open
      ? "border-primary shadow-[0_0_0_3px_rgba(16,185,129,0.1)]"
      : "border-border";

  return (
    <div>
      <div
        ref={containerRef}
        className={`relative flex overflow-visible rounded-xl border-[1.5px] bg-surface transition-all duration-[250ms] ${borderClass} ${focused || open ? "bg-primary/[0.03]" : ""}`}
      >
        {/* Country selector trigger */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex shrink-0 items-center gap-1.5 border-r border-border px-3 py-[13px] text-[13px] text-text transition-colors hover:bg-surface2"
        >
          <span className="text-base leading-none">{selected?.flag}</span>
          <span className="font-medium">+{selected?.dial}</span>
          <svg
            className={`h-3 w-3 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={localNumber}
          onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s\-()]/g, ""))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="532 123 45 67"
          className="w-full flex-1 bg-transparent px-3.5 py-[13px] text-[14px] text-text outline-none placeholder:text-muted"
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-primary/10">
            {/* Search */}
            <div className="border-b border-border p-2">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ülke ara..."
                className="w-full rounded-lg border border-border bg-surface2 px-2.5 py-1.5 text-sm text-text outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* List */}
            <ul className="max-h-56 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">Sonuç bulunamadı.</li>
              ) : (
                filtered.map((o) => (
                  <li key={o.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onCountryChange(o.code);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface2 ${
                        o.code === countryCode ? "bg-primary/10 font-medium text-primary" : "text-text"
                      }`}
                    >
                      <span className="text-base leading-none">{o.flag}</span>
                      <span className="flex-1 truncate">{o.name}</span>
                      <span className="text-muted">+{o.dial}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-[12px] text-error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
