"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import type { CentralSalePaymentListItem } from "@/lib/sales";
import { useLang } from "@/context/LangContext";
import { getPaymentMethodLabel, getPaymentStatusLabel, getPaymentStatusVariant } from "@/lib/status-labels";

type SalesPaymentsTableProps = {
  items: CentralSalePaymentListItem[];
  loading: boolean;
  error: string;
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

function formatAmount(amount?: number | null, currency?: string | null) {
  const formatted = formatPrice(amount);
  if (formatted === "-") return "-";
  return currency ? `${formatted} ${currency}` : formatted;
}

export default function SalesPaymentsTable({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: SalesPaymentsTableProps) {
  const { t } = useLang();

  if (error) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-4 text-sm text-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2/40 text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("salesPayments.paymentReferenceLabel")}</th>
              <th className="px-4 py-3">{t("salesPayments.saleLabel")}</th>
              <th className="px-4 py-3">{t("salesPayments.customerLabel")}</th>
              <th className="px-4 py-3">{t("salesPayments.storeLabel")}</th>
              <th className="px-4 py-3">{t("salesPayments.paymentMethodLabel")}</th>
              <th className="px-4 py-3 text-right">{t("salesPayments.amountLabel")}</th>
              <th className="px-4 py-3">{t("salesPayments.paidAtLabel")}</th>
              <th className="px-4 py-3">{t("salesPayments.statusLabel")}</th>
              <th className="px-4 py-3">{t("salesPayments.noteLabel")}</th>
              <th className="px-4 py-3 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-sm text-muted">
                  {t("salesPayments.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted">
                  {t("salesPayments.noResults")}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(item.id)}
                      className="font-semibold text-primary hover:underline"
                    >
                      {item.paymentReference ?? item.id}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text">{item.saleReference ?? item.saleId ?? "-"}</td>
                  <td className="px-4 py-3 text-text2">{item.customerName ?? "-"}</td>
                  <td className="px-4 py-3 text-text2">{item.store?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-text2">{getPaymentMethodLabel(item.paymentMethod, t)}</td>
                  <td className="px-4 py-3 text-right font-medium text-text">{formatAmount(item.amount, item.currency)}</td>
                  <td className="px-4 py-3 text-text2">{formatDate(item.paidAt ?? undefined)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={getPaymentStatusLabel(item.status, t)}
                      variant={getPaymentStatusVariant(item.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-text2">{item.note?.trim() || t("salesPayments.noteEmpty")}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      label={t("salesPayments.detailAction")}
                      onClick={() => onOpenDetail(item.id)}
                      variant="secondary"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </section>
  );
}
