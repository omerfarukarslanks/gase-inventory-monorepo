"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { useLang } from "@/context/LangContext";
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
  canOpenRule: boolean;
  onOpenRule: () => void;
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
  canOpenRule,
  onOpenRule,
}: SuggestionDetailDrawerProps) {
  const { t } = useLang();
  const isPending = suggestion?.status === "PENDING";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("supply.suggestions.detailTitle")}
      description={productName}
      closeDisabled={submitting}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button label={t("supply.suggestions.close")} onClick={onClose} variant="secondary" />
          <div className="flex items-center gap-2">
            {canDismiss && isPending ? (
              <Button label={t("supply.suggestions.dismiss")} onClick={onDismiss} disabled={submitting} variant="dangerSoft" />
            ) : null}
            {canAccept && isPending ? (
              <Button label={t("supply.suggestions.accept")} onClick={onAccept} disabled={submitting} loading={submitting} variant="primarySolid" />
            ) : null}
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">{t("supply.suggestions.detailLoading")}</p>
        ) : !suggestion ? (
          <p className="text-sm text-muted">{t("supply.suggestions.detailNotFound")}</p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.suggestions.productLabel")}</p>
              <p className="mt-2 text-sm font-semibold text-text">{productName}</p>
              <p className="mt-1 text-sm text-text2">{variantName}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
              <div className="rounded-xl border border-border bg-surface p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.suggestions.currentQuantityLabel")}</dt>
                <dd className="mt-1 text-lg font-semibold text-text">{suggestion.currentQuantity}</dd>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.suggestions.suggestedQuantityLabel")}</dt>
                <dd className="mt-1 text-lg font-semibold text-primary">{suggestion.suggestedQuantity}</dd>
              </div>
            </dl>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.suggestions.supplierInfoLabel")}</p>
              <p className="mt-2 text-sm text-text">{supplierName}</p>
              <p className="mt-1 text-xs text-muted">
                {t("supply.suggestions.createdAtLabel")}: {formatDate(suggestion.createdAt)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.suggestions.ruleSummaryLabel")}</p>
                  <p className="mt-2 text-sm text-text">
                    {t("supply.suggestions.ruleLabel")}: {suggestion.rule?.id ?? "-"}
                  </p>
                </div>
                {canOpenRule && suggestion.rule?.id ? (
                  <Button label={t("supply.suggestions.ruleOpen")} onClick={onOpenRule} variant="secondary" />
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-text2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.rules.minStockLabel")}</p>
                  <p className="mt-1">{suggestion.rule?.minStock ?? "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.rules.targetStockLabel")}</p>
                  <p className="mt-1">{suggestion.rule?.targetStock ?? "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.rules.leadTimeDaysLabel")}</p>
                  <p className="mt-1">{suggestion.rule?.leadTimeDays ?? "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.rules.statusLabel")}</p>
                  <p className="mt-1">{suggestion.rule?.isActive === false ? t("supply.common.inactive") : t("supply.common.active")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.suggestions.notesLabel")}</p>
              <p className="mt-2 text-sm text-text2">{suggestion.notes?.trim() || t("supply.suggestions.notesEmpty")}</p>
            </div>

            {suggestion.autoCreatedPoId ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                {t("supply.suggestions.autoCreatedPoLabel")}: {suggestion.autoCreatedPoId}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Drawer>
  );
}
