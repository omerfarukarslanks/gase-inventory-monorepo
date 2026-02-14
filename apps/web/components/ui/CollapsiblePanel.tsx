"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  rightSlot?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  toggleAriaLabel?: string;
  children: ReactNode;
};

export default function CollapsiblePanel({
  title,
  open,
  onToggle,
  rightSlot,
  className,
  headerClassName,
  contentClassName,
  toggleAriaLabel,
  children,
}: Props) {
  return (
    <section className={cn("rounded-xl2 border border-border bg-surface2/30 p-4", className)}>
      <div className={cn("flex items-center justify-between", headerClassName)}>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 items-center gap-2 text-left cursor-pointer"
          aria-expanded={open}
          aria-label={toggleAriaLabel}
        >
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
            className={cn("shrink-0 text-muted transition-transform", open && "rotate-90")}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="truncate text-xs font-semibold text-muted">{title}</span>
        </button>
        {rightSlot}
      </div>

      {open && <div className={cn("space-y-3 pt-3", contentClassName)}>{children}</div>}
    </section>
  );
}
