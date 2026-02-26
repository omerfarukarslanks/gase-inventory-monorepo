"use client";

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";

export type RowActionMenuItem = {
  key: string;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  hidden?: boolean;
};

type RowActionMenuProps = {
  items: RowActionMenuItem[];
  triggerLabel?: string;
  menuMinWidth?: number;
};

const MENU_ITEM_HEIGHT = 36;
const MENU_PADDING = 4;
const VIEWPORT_PADDING = 8;
const MENU_GAP = 6;

export default function RowActionMenu({
  items,
  triggerLabel = "Islem menusu",
  menuMinWidth = 160,
}: RowActionMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const visibleItems = useMemo(
    () => items.filter((item) => !item.hidden),
    [items],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-row-action-menu='true']")) return;
      setOpen(false);
    };

    const close = () => setOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!mounted || visibleItems.length === 0) return null;

  const handleToggle = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const estimatedMenuHeight = visibleItems.length * MENU_ITEM_HEIGHT + MENU_PADDING * 2;
    const openUpward =
      rect.bottom + MENU_GAP + estimatedMenuHeight > window.innerHeight - VIEWPORT_PADDING &&
      rect.top - MENU_GAP - estimatedMenuHeight >= VIEWPORT_PADDING;

    const top = openUpward
      ? Math.max(VIEWPORT_PADDING, rect.top - MENU_GAP - estimatedMenuHeight)
      : Math.min(
          rect.bottom + MENU_GAP,
          window.innerHeight - estimatedMenuHeight - VIEWPORT_PADDING,
        );

    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(rect.right - menuMinWidth, window.innerWidth - menuMinWidth - VIEWPORT_PADDING),
    );

    setPosition({ top, left });
    setOpen(true);
  };

  return (
    <>
      <div className="inline-flex" data-row-action-menu="true">
        <button
          type="button"
          onClick={handleToggle}
          className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-text ${open ? "bg-surface2 text-text" : ""}`}
          aria-label={triggerLabel}
          title="Islemler"
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
          >
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {open && position
        ? createPortal(
            <div
              data-row-action-menu="true"
              className="fixed z-[120] overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
              style={{ top: `${position.top}px`, left: `${position.left}px`, minWidth: `${menuMinWidth}px` }}
            >
              {visibleItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onClick();
                    setOpen(false);
                  }}
                  className={`block w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-60 ${item.tone === "danger" ? "text-error hover:bg-error/10" : "text-text2"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
