"use client";

import { useEffect, useRef, useState } from "react";
import { useLang, type Lang } from "@/context/LangContext";
import { cn } from "@/lib/cn";

const LANGS: { value: Lang; label: string; nativeLabel: string }[] = [
  { value: "tr", label: "TR", nativeLabel: "Türkçe" },
  { value: "en", label: "EN", nativeLabel: "English" },
];

const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("transition-transform duration-150", open && "rotate-180")}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export default function LangToggle() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = LANGS.find((l) => l.value === lang) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl2 border border-border bg-surface px-3 text-xs font-semibold text-text2 transition-colors hover:bg-surface2"
      >
        <GlobeIcon />
        <span>{current.label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-36 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_4px_16px_rgb(0_0_0/0.12)] dark:shadow-[0_4px_16px_rgb(0_0_0/0.3)]">
          {LANGS.map(({ value, label, nativeLabel }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setLang(value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                lang === value
                  ? "bg-primary/8 text-primary"
                  : "text-text hover:bg-surface2",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 text-xs font-bold text-muted">{label}</span>
                <span className="font-medium">{nativeLabel}</span>
              </div>
              {lang === value && (
                <span className="text-primary">
                  <CheckIcon />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
