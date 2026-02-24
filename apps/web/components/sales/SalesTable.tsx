"use client";

import { formatDate, formatPrice } from "@/lib/format";
import { EditIcon, PriceIcon, TrashIcon } from "@/components/ui/icons/TableIcons";
import type { SaleListItem, SalePayment } from "@/lib/sales";

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
}: SalesTableProps) {
  if (salesError) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6">
          <p className="text-sm text-error">{salesError}</p>
        </div>
      </section>
    );
  }

  if (salesLoading) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6 text-sm text-muted">Satis fisleri yukleniyor...</div>
      </section>
    );
  }

  if (salesReceipts.length === 0) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6 text-sm text-muted">Gosterilecek satis fisi bulunamadi.</div>
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
              <th className="px-4 py-3 text-right">Islemler</th>
            </tr>
          </thead>
          <tbody>
            {salesReceipts.map((sale) => {
              const isExpanded = expandedPaymentSaleIds.includes(sale.id);
              const payments = paymentsBySaleId[sale.id] ?? [];
              const loadingPayments = Boolean(paymentLoadingBySaleId[sale.id]);
              const paymentsError = paymentErrorBySaleId[sale.id] ?? "";
              const showAddPaymentButton = shouldShowAddPaymentButton(sale.remainingAmount);

              return [
                  <tr key={`${sale.id}-main`} className="border-b border-border hover:bg-surface2/30 transition-colors">
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
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {showAddPaymentButton && (
                          <button
                            type="button"
                            onClick={() => onAddPayment(sale.id)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Odeme ekle"
                          >
                            <PriceIcon />
                          </button>
                        )}
                        {sale.status === "CONFIRMED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(sale)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                              aria-label="Satis fisini duzenle"
                              title="Fisi duzenle"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenCancel(sale)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-error/10 hover:text-error"
                              aria-label="Satis fisini iptal et"
                              title="Fisi iptal et"
                            >
                              <TrashIcon />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>,

                  isExpanded ? (
                    <tr key={`${sale.id}-payments`} className="border-b border-border bg-surface2/20">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                              Odeme Adimlari
                            </h3>
                          </div>

                          {loadingPayments ? (
                            <p className="text-sm text-muted">Odemeler yukleniyor...</p>
                          ) : paymentsError ? (
                            <p className="text-sm text-error">{paymentsError}</p>
                          ) : payments.length === 0 ? (
                            <p className="text-sm text-muted">Bu satis fisine ait odeme kaydi bulunamadi.</p>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-border">
                              <table className="w-full min-w-[860px]">
                                <thead className="border-b border-border bg-surface2/60">
                                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                                    <th className="px-3 py-2.5">Guncelleme Tarihi</th>
                                    <th className="px-3 py-2.5 text-right">Tutar</th>
                                    <th className="px-3 py-2.5">Odeme Yontemi</th>
                                    <th className="px-3 py-2.5">Durum</th>
                                    <th className="px-3 py-2.5">Para Birimi</th>
                                    <th className="px-3 py-2.5">Iptal Tarihi</th>
                                    <th className="px-3 py-2.5 text-right">Islemler</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-border text-sm text-text2 last:border-b-0">
                                      <td className="px-3 py-2.5">{formatDate(payment.updatedAt)}</td>
                                      <td className="px-3 py-2.5 text-right">{formatPrice(payment.amount)}</td>
                                      <td className="px-3 py-2.5">{getPaymentMethodLabel(payment.paymentMethod)}</td>
                                      <td className="px-3 py-2.5">{getPaymentStatusLabel(payment.status)}</td>
                                      <td className="px-3 py-2.5">{payment.currency ?? "-"}</td>
                                      <td className="px-3 py-2.5">{formatDate(payment.cancelledAt ?? undefined)}</td>
                                      <td className="px-3 py-2.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                          {payment.status !== "CANCELLED" && (
                                          <button
                                            type="button"
                                            onClick={() => onEditPayment(sale.id, payment)}
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
                                              onClick={() => onDeletePayment(sale.id, payment)}
                                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-error/10 hover:text-error"
                                              aria-label="Odeme kaydini sil"
                                              title="Sil"
                                            >
                                              <TrashIcon />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
    </section>
  );
}
