"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { formatDate, formatPrice } from "@/lib/format";
import type { SaleReturnDetail, SaleReturnLine } from "@/lib/sales";
import { useLang } from "@/context/LangContext";

function buildCustomerName(item: SaleReturnDetail) {
  const name = [item.customer?.name, item.customer?.surname].filter(Boolean).join(" ").trim();
  return name || "-";
}

function buildLineLabels(line: SaleReturnLine, t: (key: string) => string) {
  if (line.saleLine?.productType === "PACKAGE") {
    return {
      title: line.saleLine.packageName?.trim() || t("salesReturns.packageFallback"),
      subtitle: t("salesReturns.packageLine"),
    };
  }

  return {
    title: line.saleLine?.productName?.trim() || t("salesReturns.productFallback"),
    subtitle: line.saleLine?.variantName?.trim() || t("salesReturns.variantFallback"),
  };
}

type SaleReturnDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  detail: SaleReturnDetail | null;
  onClose: () => void;
  onOpenSale: () => void;
  canOpenSale: boolean;
};

export default function SaleReturnDetailDrawer({
  open,
  loading,
  detail,
  onClose,
  onOpenSale,
  canOpenSale,
}: SaleReturnDetailDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("salesReturns.detailsTitle")}
      description={detail?.returnNo ?? detail?.id}
      mobileFullscreen
      className="!max-w-[760px]"
      footer={(
        <div className="flex items-center justify-between gap-2">
          <Button label={t("common.close")} onClick={onClose} variant="secondary" />
          {canOpenSale && detail?.saleId ? (
            <Button
              label={t("salesReturns.openSaleAction")}
              onClick={onOpenSale}
              variant="primarySoft"
            />
          ) : null}
        </div>
      )}
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">{t("salesReturns.detailsLoading")}</p>
        ) : !detail ? (
          <p className="text-sm text-muted">{t("salesReturns.detailsNotFound")}</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesReturns.saleLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-text">{detail.saleReference ?? detail.saleId ?? "-"}</p>
                <p className="mt-1 text-xs text-muted">{detail.store?.name ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesReturns.totalRefundLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-primary">{formatPrice(detail.totalRefundAmount)}</p>
                <p className="mt-1 text-xs text-muted">{detail.lineCount} {t("salesReturns.lineCountLabel").toLowerCase()}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesReturns.customerLabel")}</p>
                <p className="mt-2 text-sm text-text2">{buildCustomerName(detail)}</p>
                {detail.customer?.phoneNumber ? (
                  <p className="mt-1 text-xs text-muted">{t("salesReturns.phoneLabel")}: {detail.customer.phoneNumber}</p>
                ) : null}
                {detail.customer?.email ? (
                  <p className="mt-1 text-xs text-muted">{t("salesReturns.emailLabel")}: {detail.customer.email}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesReturns.returnedAtLabel")}</p>
                <p className="mt-2 text-sm text-text2">{formatDate(detail.returnedAt ?? undefined)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesReturns.linesTitle")}</p>
              <div className="mt-3 space-y-3">
                {detail.lines.length === 0 ? (
                  <p className="text-sm text-muted">{t("salesReturns.linesEmpty")}</p>
                ) : (
                  detail.lines.map((line) => {
                    const labels = buildLineLabels(line, t);
                    return (
                      <div key={line.id} className="rounded-xl border border-border bg-surface2/20 p-3">
                        <div className="text-sm font-medium text-text">{labels.title}</div>
                        <div className="mt-1 text-xs text-muted">{labels.subtitle}</div>
                        <div className="mt-2 grid gap-2 text-xs text-text2 md:grid-cols-3">
                          <div>
                            {t("salesReturns.quantityLabel")}: {line.quantity ?? 0}
                          </div>
                          <div>
                            {t("salesReturns.refundAmountLabel")}: {formatPrice(line.refundAmount)}
                          </div>
                          <div>
                            {t("sales.currency")}: {line.saleLine?.currency ?? "-"}
                          </div>
                        </div>

                        {Array.isArray(line.packageVariantReturns) && line.packageVariantReturns.length > 0 ? (
                          <div className="mt-3 rounded-lg border border-border bg-surface p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                              {t("salesReturns.packageReturnsLabel")}
                            </p>
                            <div className="mt-2 space-y-2">
                              {line.packageVariantReturns.map((variant) => (
                                <div key={`${line.id}-${variant.productVariantId}`} className="flex items-center justify-between gap-3 text-xs text-text2">
                                  <div className="min-w-0">
                                    <div className="truncate text-text">{variant.productName?.trim() || t("salesReturns.productFallback")}</div>
                                    <div className="truncate text-muted">{variant.variantName?.trim() || t("salesReturns.variantFallback")}</div>
                                  </div>
                                  <div className="shrink-0 font-medium text-text">{variant.quantity}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("salesReturns.notesLabel")}</p>
              <p className="mt-2 text-sm text-text2">{detail.notes?.trim() || t("salesReturns.notesEmpty")}</p>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
