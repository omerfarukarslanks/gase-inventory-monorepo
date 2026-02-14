"use client";

import { createPortal } from "react-dom";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Yes",
  cancelLabel = "No",
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={loading ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-xl2 border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-text">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            label={cancelLabel}
            onClick={onClose}
            disabled={loading}
            variant="secondary"
          />
          <Button
            label={loading ? "Deleting..." : confirmLabel}
            onClick={onConfirm}
            disabled={loading}
            variant="dangerSoft"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
