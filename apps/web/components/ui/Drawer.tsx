"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export type DrawerSide = "right" | "left" | "top" | "bottom";

type Props = {
  open: boolean;
  onClose: () => void;
  side?: DrawerSide;
  title?: string;
  description?: string;
  closeLabel?: string;
  closeDisabled?: boolean;
  className?: string;
  footer?: ReactNode;
  footerClassName?: string;
  children: ReactNode;
};

const placementClasses: Record<DrawerSide, { panel: string }> = {
  right: {
    panel: "inset-y-0 right-0 h-full w-full max-w-[420px]",
  },
  left: {
    panel: "inset-y-0 left-0 h-full w-full max-w-[420px]",
  },
  top: {
    panel: "inset-x-0 top-0 w-full max-h-[85vh]",
  },
  bottom: {
    panel: "inset-x-0 bottom-0 w-full max-h-[85vh]",
  },
};

const transitionClasses: Record<DrawerSide, string> = {
  right: "translate-x-full",
  left: "-translate-x-full",
  top: "-translate-y-full",
  bottom: "translate-y-full",
};

export default function Drawer({
  open,
  onClose,
  side = "right",
  title,
  description,
  closeLabel = "Close",
  closeDisabled = false,
  className,
  footer,
  footerClassName,
  children,
}: Props) {

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        onClick={closeDisabled ? undefined : onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/35 transition-opacity duration-200",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed z-50 overflow-y-auto border border-border bg-surface shadow-xl transition-transform duration-300",
          placementClasses[side].panel,
          open ? "translate-x-0 translate-y-0" : transitionClasses[side],
          className,
        )}
      >
        {(title || description) && (
          <div className="sticky top-0 border-b border-border bg-surface/95 px-5 py-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                {title && <h2 className="text-base font-semibold text-text">{title}</h2>}
                {description && <p className="text-xs text-muted">{description}</p>}
              </div>
              <button
                onClick={onClose}
                disabled={closeDisabled}
                aria-label={closeLabel}
                title={closeLabel}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-text transition-colors hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {children}

        {footer && (
          <div
            className={cn(
              "sticky bottom-0 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur",
              footerClassName,
            )}
          >
            {footer}
          </div>
        )}
      </aside>
    </>,
    document.body,
  );
}
