"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

type Props = {
  fixed?: boolean;
  className?: string;
};

export default function ThemeToggle({ fixed = true, className }: Props) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  if (!mounted || !resolvedTheme) {
    return (
      <button
        className={cn(
          "h-10 w-10 cursor-pointer rounded-xl border border-border bg-surface text-text2 shadow-sm",
          fixed && "fixed right-4 top-4 z-50",
          className,
        )}
        aria-label="Toggle theme"
      >
        <span className="flex items-center justify-center opacity-0">
          <svg width="17" height="17" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" />
          </svg>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className={cn(
        "h-10 w-10 rounded-xl cursor-pointer border border-border bg-surface text-text2 shadow-sm transition-all duration-200 hover:border-borderHover hover:text-text",
        fixed && "fixed right-4 top-4 z-50",
        className,
      )}
      aria-label="Toggle theme"
    >
      <span className="flex items-center justify-center">
        {currentTheme === "dark" ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}
