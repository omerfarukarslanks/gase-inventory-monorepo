"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import RowActionMenu, { type RowActionMenuItem } from "@/components/ui/RowActionMenu";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/format";
import type { SaleListItem, SalePayment } from "@/lib/sales";
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
  getSaleStatusLabel,
  getSaleStatusVariant,
} from "@/lib/status-labels";

type SalesMobileListProps = {
  salesReceipts: SaleListItem[];
  salesLoading: boolean;
  salesError: string;
  onAddPayment: (saleId: string) => void;
  onOpenDetail: (saleId: string) => void;
  onEdit: (sale: SaleListItem) => void;
  onOpenCancel: (sale: SaleListItem) => void;
  onReturn: (sale: SaleListItem) => void;
  onDownloadReceipt: (saleId: string) => void;
  onManageLines: (sale: SaleListItem) => void;
  canUpdate?: boolean;
  canCancel?: boolean;
  canCreateLines?: boolean;
  canUpdateLines?: boolean;
  canReturn?: boolean;
  canDownloadReceipt?: boolean;
  canCreatePayments?: boolean;
  canUpdatePayments?: boolean;
  footer?: ReactNode;
};

function getSaleTotal(sale: SaleListItem) {
  if (sale.lineTotal != null) return sale.lineTotal;
  if (sale.total != null) return sale.total;
  if (!Array.isArray(sale.lines)) return null;
  return sale.lines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);
}

function shouldShowAddPaymentButton(remainingAmount?: number | null) {
  if (remainingAmount == null) return true;
  return Number(remainingAmount) !== 0;
}

function LoadingCard() {
  return (
    <div className="space-y-3 rounded-xl2 border border-border bg-surface p-4">
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-surface2" />
    </div>
  );
}

export default function SalesMobileList({
  salesReceipts,
  salesLoading,
  salesError,
  onAddPayment,
  onOpenDetail,
  onEdit,
  onOpenCancel,
  onReturn,
  onDownloadReceipt,
  onManageLines,
  canUpdate = true,
  canCancel = true,
  canCreateLines = true,
  canUpdateLines = true,
  canReturn = true,
  canDownloadReceipt = true,
  canCreatePayments = true,
  canUpdatePayments = true,
  footer,
}: SalesMobileListProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {salesError ? (
        <div className="p-4">
          <p className="text-sm text-error">{salesError}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3">
            {salesLoading ? (
              Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
            ) : salesReceipts.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("sales.receiptsEmpty")}
              </div>
            ) : (
              salesReceipts.map((sale) => {
                const showAddPaymentButton = shouldShowAddPaymentButton(sale.remainingAmount);
                const isCancelledSale = sale.status === "CANCELLED";
                const isConfirmedSale = sale.status === "CONFIRMED";
                const actionItems: RowActionMenuItem[] = [];

                if (isCancelledSale) {
                  if (canDownloadReceipt) {
                    actionItems.push({
                      key: "print",
                      label: t("sales.print"),
                      onClick: () => onDownloadReceipt(sale.id),
                    });
                  }
                } else {
                  if (showAddPaymentButton && canCreatePayments) {
                    actionItems.push({
                      key: "add-payment",
                      label: t("sales.addPayment"),
                      onClick: () => onAddPayment(sale.id),
                    });
                  }

                  if (isConfirmedSale) {
                    if (canUpdate) {
                      actionItems.push({
                        key: "edit",
                        label: t("common.edit"),
                        onClick: () => onEdit(sale),
                      });
                    }
                    if (canUpdateLines || canCreateLines) {
                      actionItems.push({
                        key: "manage-lines",
                        label: t("sales.manageLines"),
                        onClick: () => onManageLines(sale),
                      });
                    }
                    if (canReturn) {
                      actionItems.push({
                        key: "return",
                        label: t("sales.createReturn"),
                        onClick: () => onReturn(sale),
                      });
                    }
                    if (canDownloadReceipt) {
                      actionItems.push({
                        key: "print",
                        label: t("sales.print"),
                        onClick: () => onDownloadReceipt(sale.id),
                      });
                    }
                    if (canCancel) {
                      actionItems.push({
                        key: "cancel",
                        label: t("sales.cancelSale"),
                        tone: "danger",
                        onClick: () => onOpenCancel(sale),
                      });
                    }
                  }
                }

                return (
                  <article key={sale.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(sale.id)}
                          className="text-left text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                          {sale.receiptNo ?? sale.id}
                        </button>
                        <p className="mt-1 text-xs text-muted">
                          {[sale.name, sale.surname].filter(Boolean).join(" ") || "Musteri secilmedi"}
                        </p>
                      </div>
                      {actionItems.length > 0 ? <RowActionMenu items={actionItems} triggerLabel="Satis islemleri" /> : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        label={getPaymentStatusLabel(sale.paymentStatus, t)}
                        variant={getPaymentStatusVariant(sale.paymentStatus)}
                      />
                      <StatusBadge
                        label={getSaleStatusLabel(sale.status, t)}
                        variant={getSaleStatusVariant(sale.status)}
                      />
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("sales.total")}</dt>
                        <dd className="mt-1 font-medium text-text">{formatPrice(getSaleTotal(sale))}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("sales.remaining")}</dt>
                        <dd className="mt-1 font-medium text-text">{formatPrice(sale.remainingAmount)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("sales.currency")}</dt>
                        <dd className="mt-1">{sale.currency ?? "-"}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Odeme Yontemi</dt>
                        <dd className="mt-1">{getPaymentMethodLabel((sale as { paymentMethod?: SalePayment["paymentMethod"] }).paymentMethod, t)}</dd>
                      </div>
                    </dl>

                    <div className="flex gap-2 border-t border-border pt-3">
                      <Button
                        label="Detay"
                        onClick={() => onOpenDetail(sale.id)}
                        variant="secondary"
                        className="min-w-[110px] flex-1"
                      />
                      {showAddPaymentButton && canCreatePayments ? (
                        <Button
                          label={t("sales.addPayment")}
                          onClick={() => onAddPayment(sale.id)}
                          variant="primarySoft"
                          className="min-w-[110px] flex-1"
                        />
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {footer}
        </>
      )}
    </section>
  );
}
