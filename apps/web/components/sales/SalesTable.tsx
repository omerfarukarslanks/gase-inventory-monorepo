"use client";

import { useState, type ReactNode } from "react";
import { formatDate, formatPrice } from "@/lib/format";
import { EditIcon, TrashIcon } from "@/components/ui/icons/TableIcons";
import type { SaleListItem, SalePayment } from "@/lib/sales";
import RowActionMenu, { type RowActionMenuItem } from "@/components/ui/RowActionMenu";
import { useLang } from "@/context/LangContext";

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
  footer?: ReactNode;
};

function getSaleTotal(sale: SaleListItem) {
  if (sale.lineTotal != null) return sale.lineTotal;
  if (sale.total != null) return sale.total;
  if (!Array.isArray(sale.lines)) return null;
  return sale.lines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);
}

type TFn = (key: string) => string;

function getPaymentStatusLabel(status?: string | null, t?: TFn) {
  if (!t) return status ?? "-";
  if (status === "PARTIAL") return t("sales.paymentPartial");
  if (status === "PAID") return t("sales.paymentPaid");
  if (status === "UNPAID") return t("sales.paymentUnpaid");
  if (status === "PENDING") return t("sales.paymentPending");
  if (status === "CANCELLED") return t("sales.paymentCancelled");
  if (status === "UPDATED") return t("sales.paymentUpdated");
  if (status === "ACTIVE") return t("common.active");
  return status ?? "-";
}

function getPaymentStatusClass(status?: string | null) {
  if (status === "PAID" || status === "ACTIVE") {
    return "inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary";
  }
  if (status === "CANCELLED" || status === "UNPAID") {
    return "inline-block rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error";
  }
  return "inline-block rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted";
}

function getSaleStatusLabel(status?: string | null, t?: TFn) {
  if (!t) return status ?? "-";
  if (status === "CONFIRMED") return t("sales.statusConfirmed");
  if (status === "CANCELLED") return t("sales.statusCancelled");
  if (status === "DRAFT") return t("sales.statusDraft");
  return status ?? "-";
}

function getPaymentMethodLabel(paymentMethod?: string | null, t?: TFn) {
  if (!t) return paymentMethod ?? "-";
  if (paymentMethod === "CASH") return t("sales.methodCash");
  if (paymentMethod === "CARD") return t("sales.methodCard");
  if (paymentMethod === "TRANSFER") return t("sales.methodTransfer");
  if (paymentMethod === "OTHER") return t("sales.methodOther");
  return paymentMethod ?? "-";
}

function shouldShowAddPaymentButton(remainingAmount?: number | null) {
  if (remainingAmount == null) return true;
  return Number(remainingAmount) !== 0;
}

function VirtualSalePaymentsTable({
  saleId,
  payments,
  onEditPayment,
  onDeletePayment,
  canUpdatePayments,
}: {
  saleId: string;
  payments: SalePayment[];
  onEditPayment: (saleId: string, payment: SalePayment) => void;
  onDeletePayment: (saleId: string, payment: SalePayment) => void;
  canUpdatePayments: boolean;
}) {
  const { t } = useLang();
  const rowHeight = 44;
  const containerHeight = 280;
  const overscan = 4;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = payments.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(payments.length, startIndex + visibleCount + overscan * 2);
  const visiblePayments = payments.slice(startIndex, endIndex);

  return (
    <div className="min-w-215">
      <div className="grid grid-cols-[1.15fr_0.9fr_0.9fr_0.9fr_0.8fr_1fr_0.9fr] border-b border-border bg-surface2/70 text-left text-[11px] uppercase tracking-wide text-muted">
        <div className="px-3 py-2.5">{t("sales.updateDate")}</div>
        <div className="px-3 py-2.5 text-right">{t("sales.amount")}</div>
        <div className="px-3 py-2.5">{t("sales.paymentMethod")}</div>
        <div className="px-3 py-2.5">{t("common.status")}</div>
        <div className="px-3 py-2.5">{t("sales.currency")}</div>
        <div className="px-3 py-2.5">{t("sales.cancelDate")}</div>
        <div className="bg-surface2/70 px-3 py-2.5 text-right">
          {t("common.actions")}
        </div>
      </div>

      <div className="h-70 overflow-y-auto" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <div className="relative" style={{ height: totalHeight }}>
          <div className="absolute inset-x-0" style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {visiblePayments.map((payment) => (
              <div
                key={payment.id}
                className="grid h-11 grid-cols-[1.15fr_0.9fr_0.9fr_0.9fr_0.8fr_1fr_0.9fr] items-center border-b border-border text-sm text-text2 last:border-b-0 hover:bg-surface2/30"
              >
                <div className="px-3 py-2.5">{formatDate(payment.updatedAt)}</div>
                <div className="px-3 py-2.5 text-right">{formatPrice(payment.amount)}</div>
                <div className="px-3 py-2.5">{getPaymentMethodLabel(payment.paymentMethod, t)}</div>
                <div className="px-3 py-2.5">{getPaymentStatusLabel(payment.status, t)}</div>
                <div className="px-3 py-2.5">{payment.currency ?? "-"}</div>
                <div className="px-3 py-2.5">{formatDate(payment.cancelledAt ?? undefined)}</div>
                <div className="flex items-center justify-end gap-1 px-3 py-2.5">
                  {canUpdatePayments && payment.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => onEditPayment(saleId, payment)}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label="Odeme kaydini duzenle"
                      title="Duzenle"
                    >
                      <EditIcon />
                    </button>
                  )}
                  {canUpdatePayments && payment.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => onDeletePayment(saleId, payment)}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-error/10 hover:text-error"
                      aria-label="Odeme kaydini sil"
                      title="Sil"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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

  if (salesLoading) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6 text-sm text-muted">{t("sales.receiptsLoading")}</div>
        {footer}
      </section>
    );
  }

  if (salesReceipts.length === 0) {
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
            {salesReceipts.map((sale) => {
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
                      <span className={getPaymentStatusClass(sale.paymentStatus)}>
                        {getPaymentStatusLabel(sale.paymentStatus, t)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          sale.status === "CONFIRMED"
                            ? "inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                            : sale.status === "CANCELLED"
                              ? "inline-block rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error"
                              : "inline-block rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted"
                        }
                      >
                        {getSaleStatusLabel(sale.status, t)}
                      </span>
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
                                onEditPayment={onEditPayment}
                                onDeletePayment={onDeletePayment}
                                canUpdatePayments={canUpdatePayments}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : null,
              ];
            })}
          </tbody>
        </table>
      </div>
      {footer}
    </section>
  );
}
