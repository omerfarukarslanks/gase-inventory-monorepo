"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/context/LangContext";
import type { Store } from "@/lib/stores";
import StoreDetailContent from "./StoreDetailContent";

// ─── main ─────────────────────────────────────────────────────────────────────

type Props = {
  store: Store | null;
  onClose: () => void;
};

export default function StoreDetailDialog({ store, onClose }: Props) {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!store) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [store, onClose]);

  if (!mounted) return null;

  const open = Boolean(store);

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {store && (
          <StoreDetailContent
            store={store}
            trailingAction={
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-text"
                aria-label={t("common.closeDetail")}
                title={t("common.closeDetail")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            }
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
