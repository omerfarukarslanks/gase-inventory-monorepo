"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getSuggestionStatusLabel, getSuggestionStatusVariant } from "@/components/supply/status";
import type { ReplenishmentSuggestion } from "@/lib/replenishment";

type SuggestionDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  submitting: boolean;
  suggestion: ReplenishmentSuggestion | null;
  productName: string;
  variantName: string;
  supplierName: string;
  storeName: string;
  onClose: () => void;
  onAccept: () => void;
  onDismiss: () => void;
  canAccept: boolean;
  canDismiss: boolean;
};

export default function SuggestionDetailDrawer({
  open,
  loading,
  submitting,
  suggestion,
  productName,
  variantName,
  supplierName,
  storeName,
  onClose,
  onAccept,
  onDismiss,
  canAccept,
  canDismiss,
}: SuggestionDetailDrawerProps) {
  const isPending = suggestion?.status === "PENDING";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Oneri Detayi"
      description={productName}
      closeDisabled={submitting}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button label="Kapat" onClick={onClose} variant="secondary" />
          <div className="flex items-center gap-2">
            {canDismiss && isPending ? (
              <Button label="Reddet" onClick={onDismiss} disabled={submitting} variant="dangerSoft" />
            ) : null}
            {canAccept && isPending ? (
              <Button label="Kabul Et" onClick={onAccept} disabled={submitting} loading={submitting} variant="primarySolid" />
            ) : null}
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">Oneri detayi yukleniyor...</p>
        ) : !suggestion ? (
          <p className="text-sm text-muted">Gosterilecek oneri bulunamadi.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={getSuggestionStatusLabel(suggestion.status)}
                variant={getSuggestionStatusVariant(suggestion.status)}
              />
              <span className="inline-flex rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted">
                {storeName}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-surface2/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Urun</p>
              <p className="mt-2 text-sm font-semibold text-text">{productName}</p>
              <p className="mt-1 text-sm text-text2">{variantName}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
              <div className="rounded-xl border border-border bg-surface p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Mevcut Miktar</dt>
                <dd className="mt-1 text-lg font-semibold text-text">{suggestion.currentQuantity}</dd>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Onerilen Siparis</dt>
                <dd className="mt-1 text-lg font-semibold text-primary">{suggestion.suggestedQuantity}</dd>
              </div>
            </dl>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tedarik Bilgisi</p>
              <p className="mt-2 text-sm text-text">{supplierName}</p>
              <p className="mt-1 text-xs text-muted">Kural: {suggestion.rule?.id ?? "-"}</p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Not</p>
              <p className="mt-2 text-sm text-text2">{suggestion.notes?.trim() || "Not yok."}</p>
            </div>

            {suggestion.autoCreatedPoId ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                Bu oneri icin olusan PO: {suggestion.autoCreatedPoId}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Drawer>
  );
}
