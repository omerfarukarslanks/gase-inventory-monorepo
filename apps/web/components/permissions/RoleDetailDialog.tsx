"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RoleEntry } from "@/lib/permissions";
import RoleDetailContent from "./RoleDetailContent";

type Props = {
  role: RoleEntry | null;
  onClose: () => void;
};

export default function RoleDetailDialog({ role, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!role) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [role, onClose]);

  if (!mounted) return null;

  const open = Boolean(role);

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={onClose}
    >
      <div
        className="flex h-[calc(100dvh-2rem)] min-h-0 max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {role ? (
          <RoleDetailContent
            role={role}
            trailingAction={
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-muted cursor-pointer transition-colors hover:bg-surface2 hover:text-text"
                aria-label="Detayı kapat"
                title="Detayı kapat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            }
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
