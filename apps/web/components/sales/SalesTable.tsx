"use client";

import { useState, type ReactNode } from "react";
import { formatDate, formatPrice } from "@/lib/format";
import { EditIcon, TrashIcon } from "@/components/ui/icons/TableIcons";
import type { SaleListItem, SalePayment } from "@/lib/sales";
import RowActionMenu, { type RowActionMenuItem } from "@/components/ui/RowActionMenu";

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
  footer?: ReactNode;
};

function getSaleTotal(sale: SaleListItem) {
  if (sale.lineTotal != null) return sale.lineTotal;
  if (sale.total != null) return sale.total;
  if (!Array.isArray(sale.lines)) return null;
  return sale.lines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);
}

function getPaymentStatusLabel(status?: string | null) {
  if (status === "PARTIAL") return "Kismi Odendi";
  if (status === "PAID") return "Odendi";
  if (status === "UNPAID") return "Odenmedi";
  if (status === "PENDING") return "Beklemede";
  if (status === "CANCELLED") return "Iptal Edildi";
  if (status === "UPDATED") return "Guncellendi";
  if (status === "ACTIVE") return "Aktif";
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

function getSaleStatusLabel(status?: string | null) {
  if (status === "CONFIRMED") return "Onaylandi";
  if (status === "CANCELLED") return "Iptal Edildi";
  if (status === "DRAFT") return "Taslak";
  return status ?? "-";
}

function getPaymentMethodLabel(paymentMethod?: string | null) {
  if (paymentMethod === "CASH") return "Nakit";
  if (paymentMethod === "CARD") return "Kart";
  if (paymentMethod === "TRANSFER") return "Havale/EFT";
  if (paymentMethod === "OTHER") return "Diger";
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
}: {
  saleId: string;
  payments: SalePayment[];
  onEditPayment: (saleId: string, payment: SalePayment) => void;
  onDeletePayment: (saleId: string, payment: SalePayment) => void;
}) {
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
    <div className="min-w-[860px]">
      <div className="grid grid-cols-[1.15fr_0.9fr_0.9fr_0.9fr_0.8fr_1fr_0.9fr] border-b border-border bg-surface2/70 text-left text-[11px] uppercase tracking-wide text-muted">
        <div className="px-3 py-2.5">Guncelleme Tarihi</div>
        <div className="px-3 py-2.5 text-right">Tutar</div>
        <div className="px-3 py-2.5">Odeme Yontemi</div>
        <div className="px-3 py-2.5">Durum</div>
        <div className="px-3 py-2.5">Para Birimi</div>
        <div className="px-3 py-2.5">Iptal Tarihi</div>
        <div className="bg-surface2/70 px-3 py-2.5 text-right">
          Islemler
        </div>
      </div>

      <div className="h-[280px] overflow-y-auto" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <div className="relative" style={{ height: totalHeight }}>
          <div className="absolute inset-x-0" style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {visiblePayments.map((payment) => (
              <div
                key={payment.id}
                className="grid h-11 grid-cols-[1.15fr_0.9fr_0.9fr_0.9fr_0.8fr_1fr_0.9fr] items-center border-b border-border text-sm text-text2 last:border-b-0 hover:bg-surface2/30"
              >
                <div className="px-3 py-2.5">{formatDate(payment.updatedAt)}</div>
                <div className="px-3 py-2.5 text-right">{formatPrice(payment.amount)}</div>
                <div className="px-3 py-2.5">{getPaymentMethodLabel(payment.paymentMethod)}</div>
                <div className="px-3 py-2.5">{getPaymentStatusLabel(payment.status)}</div>
                <div className="px-3 py-2.5">{payment.currency ?? "-"}</div>
                <div className="px-3 py-2.5">{formatDate(payment.cancelledAt ?? undefined)}</div>
                <div className="flex items-center justify-end gap-1 px-3 py-2.5">
                  {payment.status !== "CANCELLED" && (
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
                  {payment.status !== "CANCELLED" && (
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
  footer,
}: SalesTableProps) {
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
        <div className="p-6 text-sm text-muted">Satis fisleri yukleniyor...</div>
        {footer}
      </section>
    );
  }

  if (salesReceipts.length === 0) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6 text-sm text-muted">Gosterilecek satis fisi bulunamadi.</div>
        {footer}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1260px]">
          <thead className="border-b border-border bg-surface2/70">
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Receipt No</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Soyad</th>
              <th className="px-4 py-3">Odeme Durumu</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">Para Birimi</th>
              <th className="px-4 py-3 text-right">Toplam</th>
              <th className="px-4 py-3 text-right">Kalan</th>
              <th className="sticky right-0 z-20 w-[156px] bg-surface2/70 px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)]">
                Islemler
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
                actionItems.push({
                  key: "print",
                  label: "Yazdir",
                  onClick: () => onDownloadReceipt(sale.id),
                });
              } else {
                if (showAddPaymentButton) {
                  actionItems.push({
                    key: "add-payment",
                    label: "Odeme Ekle",
                    onClick: () => onAddPayment(sale.id),
                  });
                }

                if (isConfirmedSale) {
                  actionItems.push({
                    key: "edit",
                    label: "Duzenle",
                    onClick: () => onEdit(sale),
                  });
                  actionItems.push({
                    key: "return",
                    label: "Iade Olustur",
                    onClick: () => onReturn(sale),
                  });
                  actionItems.push({
                    key: "print",
                    label: "Yazdir",
                    onClick: () => onDownloadReceipt(sale.id),
                  });
                  actionItems.push({
                    key: "cancel",
                    label: "Iptal Et",
                    tone: "danger",
                    onClick: () => onOpenCancel(sale),
                  });
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
                        aria-label={isExpanded ? "Odeme kayitlarini kapat" : "Odeme kayitlarini ac"}
                        title={isExpanded ? "Odeme kayitlarini kapat" : "Odeme kayitlarini ac"}
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
                        {getPaymentStatusLabel(sale.paymentStatus)}
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
                        {getSaleStatusLabel(sale.status)}
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
                    <td className="sticky right-0 z-10 w-[156px] bg-surface px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)] group-hover:bg-surface2/50">
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
                            <p className="text-sm text-muted">Odemeler yukleniyor...</p>
                          ) : paymentsError ? (
                            <p className="text-sm text-error">{paymentsError}</p>
                          ) : payments.length === 0 ? (
                            <p className="text-sm text-muted">Bu satis fisine ait odeme kaydi bulunamadi.</p>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-border">
                              <VirtualSalePaymentsTable
                                saleId={sale.id}
                                payments={payments}
                                onEditPayment={onEditPayment}
                                onDeletePayment={onDeletePayment}
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
