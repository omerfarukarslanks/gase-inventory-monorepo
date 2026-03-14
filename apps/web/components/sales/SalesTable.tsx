"use client";

import { type ReactNode } from "react";
import TableSkeletonRows from "@/components/ui/TableSkeletonRows";
import { formatPrice } from "@/lib/format";
import type { SaleListItem, SalePayment } from "@/lib/sales";
import { VirtualSalePaymentsTable } from "@/components/sales/VirtualSalePaymentsTable";
import RowActionMenu, { type RowActionMenuItem } from "@/components/ui/RowActionMenu";
import { useLang } from "@/context/LangContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getPaymentStatusLabel,
  getPaymentStatusVariant,
  getSaleStatusLabel,
  getSaleStatusVariant,
} from "@/lib/status-labels";

type SalesTableProps = {
  salesReceipts: SaleListItem[];
  salesLoading: boolean;
  salesError: string;
  expandedPaymentSaleIds: string[];
  paymentsBySaleId: Record<string, SalePayment[]>;
  paymentLoadingBySaleId: Record<string, boolean>;
  paymentErrorBySaleId: Record<string, string>;
  onTogglePayments: (saleId: string) => void;
  onAddPayment: (saleId: string) => void;
  onOpenPaymentCenter: (paymentId: string) => void;
  onEditPayment: (saleId: string, payment: SalePayment) => void;
  onDeletePayment: (saleId: string, payment: SalePayment) => void;
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
  canOpenPaymentCenter?: boolean;
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


export default function SalesTable({
  salesReceipts,
  salesLoading,
  salesError,
  expandedPaymentSaleIds,
  paymentsBySaleId,
  paymentLoadingBySaleId,
  paymentErrorBySaleId,
  onTogglePayments,
  onAddPayment,
  onOpenPaymentCenter,
  onEditPayment,
  onDeletePayment,
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
  canOpenPaymentCenter = true,
  footer,
}: SalesTableProps) {
  const { t } = useLang();
  if (salesError) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6">
          <p className="text-sm text-error">{salesError}</p>
        </div>
        {footer}
      </section>
    );
  }

  if (salesReceipts.length === 0 && !salesLoading) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6 text-sm text-muted">{t("sales.receiptsEmpty")}</div>
        {footer}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-315">
          <thead className="border-b border-border bg-surface2/70">
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t("sales.receiptNo")}</th>
              <th className="px-4 py-3">{t("sales.firstName")}</th>
              <th className="px-4 py-3">{t("sales.surname")}</th>
              <th className="px-4 py-3">{t("sales.paymentStatus")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
              <th className="px-4 py-3 text-right">{t("sales.currency")}</th>
              <th className="px-4 py-3 text-right">{t("sales.total")}</th>
              <th className="px-4 py-3 text-right">{t("sales.remaining")}</th>
              <th className="sticky right-0 z-20 w-39 bg-surface2/70 px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)]">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {salesLoading ? (
              <TableSkeletonRows rows={6} cols={10} />
            ) : (
              salesReceipts.map((sale) => {
              const isExpanded = expandedPaymentSaleIds.includes(sale.id);
              const payments = paymentsBySaleId[sale.id] ?? [];
              const loadingPayments = Boolean(paymentLoadingBySaleId[sale.id]);
              const paymentsError = paymentErrorBySaleId[sale.id] ?? "";
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

              const hasActionMenuItems = actionItems.length > 0;

              return [
                  <tr
                    key={`${sale.id}-main`}
                    className="group border-b border-border transition-colors hover:bg-surface2/30"
                  >
                    <td className="px-4 py-3 text-sm text-text2">
                      <button
                        type="button"
                        onClick={() => onTogglePayments(sale.id)}
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface2 hover:text-text"
                        aria-label={isExpanded ? t("sales.paymentCancelled") : t("sales.addPayment")}
                        title={isExpanded ? t("sales.paymentCancelled") : t("sales.addPayment")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={isExpanded ? "rotate-180 transition-transform" : "transition-transform"}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-text2">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(sale.id)}
                        className="cursor-pointer text-left text-primary underline-offset-2 transition-colors hover:text-primary/80 hover:underline"
                      >
                        {sale.receiptNo ?? sale.id}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-text2">{sale.name ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text2">{sale.surname ?? "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge
                        label={getPaymentStatusLabel(sale.paymentStatus, t)}
                        variant={getPaymentStatusVariant(sale.paymentStatus)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge
                        label={getSaleStatusLabel(sale.status, t)}
                        variant={getSaleStatusVariant(sale.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text2">
                      {sale.currency}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-text">
                      {formatPrice(getSaleTotal(sale))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text2">
                      {formatPrice(sale.remainingAmount)}
                    </td>
                    <td className="sticky right-0 z-10 w-39 bg-surface px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)] group-hover:bg-surface2/50">
                      {hasActionMenuItems ? (
                        <RowActionMenu items={actionItems} />
                      ) : (
                        <span className="text-sm text-muted">-</span>
                      )}
                    </td>
                  </tr>,

                  isExpanded ? (
                    <tr key={`${sale.id}-payments`} className="border-b border-border bg-surface2/20">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
                          {loadingPayments ? (
                            <p className="text-sm text-muted">{t("sales.paymentsLoading")}</p>
                          ) : paymentsError ? (
                            <p className="text-sm text-error">{paymentsError}</p>
                          ) : payments.length === 0 ? (
                            <p className="text-sm text-muted">{t("sales.paymentsEmpty")}</p>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-border">
                              <VirtualSalePaymentsTable
                                saleId={sale.id}
                                payments={payments}
                                onOpenPaymentCenter={onOpenPaymentCenter}
                                onEditPayment={onEditPayment}
                                onDeletePayment={onDeletePayment}
                                canOpenPaymentCenter={canOpenPaymentCenter}
                                canUpdatePayments={canUpdatePayments}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : null,
              ];
            }))
            }
          </tbody>
        </table>
      </div>
      {footer}
    </section>
  );
}
