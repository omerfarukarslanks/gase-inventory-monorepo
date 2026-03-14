"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import type { CentralSalePaymentDetail } from "@/lib/sales";
import { useLang } from "@/context/LangContext";
import { getPaymentMethodLabel, getPaymentStatusLabel, getPaymentStatusVariant } from "@/lib/status-labels";
import { useUserLabels } from "@/hooks/useUserLabels";

type SalePaymentDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  detail: CentralSalePaymentDetail | null;
  onClose: () => void;
  onOpenSale: () => void;
  canOpenSale: boolean;
};

function formatAmount(amount?: number | null, currency?: string | null) {
  const formatted = formatPrice(amount);
  if (formatted === "-") return "-";
  return currency ? `${formatted} ${currency}` : formatted;
}

export default function SalePaymentDetailDrawer({
  open,
  loading,
  detail,
  onClose,
  onOpenSale,
  canOpenSale,
}: SalePaymentDetailDrawerProps) {
  const { t } = useLang();
  const userLabels = useUserLabels(detail?.cancelledById ? [detail.cancelledById] : []);
  const cancelledByLabel = detail?.cancelledById ? (userLabels[detail.cancelledById] ?? detail.cancelledById) : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("salesPayments.detailsTitle")}
      description={detail?.paymentReference ?? detail?.id}
      mobileFullscreen
      className="!max-w-[760px]"
      footer={(
        <div className="flex items-center justify-between gap-2">
          <Button label={t("common.close")} onClick={onClose} variant="secondary" />
          {canOpenSale && detail?.saleId ? (
            <Button
              label={t("salesPayments.openSaleAction")}
              onClick={onOpenSale}
              variant="primarySoft"
            />
          ) : null}
        </div>
      )}
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">{t("salesPayments.detailsLoading")}</p>
        ) : !detail ? (
          <p className="text-sm text-muted">{t("salesPayments.detailsNotFound")}</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesPayments.saleLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-text">{detail.saleReference ?? detail.saleId ?? "-"}</p>
                <p className="mt-1 text-xs text-muted">{detail.customerName ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesPayments.amountLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-primary">{formatAmount(detail.amount, detail.currency)}</p>
                <div className="mt-2">
                  <StatusBadge
                    label={getPaymentStatusLabel(detail.status, t)}
                    variant={getPaymentStatusVariant(detail.status)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesPayments.storeLabel")}</p>
                <p className="mt-2 text-sm text-text2">{detail.store?.name ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesPayments.paymentMethodLabel")}</p>
                <p className="mt-2 text-sm text-text2">{getPaymentMethodLabel(detail.paymentMethod, t)}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesPayments.paidAtLabel")}</p>
                <p className="mt-2 text-sm text-text2">{formatDate(detail.paidAt ?? undefined)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesPayments.baseAmountLabel")}</p>
                <p className="mt-2 text-sm text-text2">{formatPrice(detail.amountInBaseCurrency)}</p>
                <p className="mt-1 text-xs text-muted">
                  {t("salesPayments.exchangeRateLabel")}: {formatPrice(detail.exchangeRate)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesPayments.noteLabel")}</p>
              <p className="mt-2 text-sm text-text2">{detail.note?.trim() || t("salesPayments.noteEmpty")}</p>
            </div>

            {detail.cancelledAt || cancelledByLabel ? (
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesPayments.cancellationTitle")}</p>
                {detail.cancelledAt ? (
                  <p className="mt-2 text-sm text-text2">
                    {t("salesPayments.cancelledAtLabel")}: {formatDate(detail.cancelledAt ?? undefined)}
                  </p>
                ) : null}
                {cancelledByLabel ? (
                  <p className="mt-1 text-sm text-text2">
                    {t("salesPayments.cancelledByLabel")}: {cancelledByLabel}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Drawer>
  );
}
