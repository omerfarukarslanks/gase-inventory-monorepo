"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import type { CentralSalePaymentListItem } from "@/lib/sales";
import { useLang } from "@/context/LangContext";
import { getPaymentMethodLabel, getPaymentStatusLabel, getPaymentStatusVariant } from "@/lib/status-labels";

type SalesPaymentsMobileListProps = {
  items: CentralSalePaymentListItem[];
  loading: boolean;
  error: string;
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

function LoadingCard() {
  return (
    <div className="space-y-3 rounded-xl2 border border-border bg-surface p-4">
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-surface2" />
    </div>
  );
}

function formatAmount(amount?: number | null, currency?: string | null) {
  const formatted = formatPrice(amount);
  if (formatted === "-") return "-";
  return currency ? `${formatted} ${currency}` : formatted;
}

export default function SalesPaymentsMobileList({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: SalesPaymentsMobileListProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-4 text-sm text-error">{error}</div>
      ) : (
        <>
          <div className="space-y-3 p-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
            ) : items.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("salesPayments.noResults")}
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(item.id)}
                        className="truncate text-left text-sm font-semibold text-primary hover:underline"
                      >
                        {item.paymentReference ?? item.id}
                      </button>
                      <p className="mt-1 text-xs text-muted">
                        {(item.saleReference ?? item.saleId ?? "-")} · {(item.customerName ?? "-")}
                      </p>
                    </div>
                    <StatusBadge
                      label={getPaymentStatusLabel(item.status, t)}
                      variant={getPaymentStatusVariant(item.status)}
                    />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("salesPayments.storeLabel")}</dt>
                      <dd className="mt-1">{item.store?.name ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("salesPayments.paymentMethodLabel")}</dt>
                      <dd className="mt-1">{getPaymentMethodLabel(item.paymentMethod, t)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("salesPayments.amountLabel")}</dt>
                      <dd className="mt-1 font-medium text-text">{formatAmount(item.amount, item.currency)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("salesPayments.paidAtLabel")}</dt>
                      <dd className="mt-1">{formatDate(item.paidAt ?? undefined)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("salesPayments.noteLabel")}</dt>
                      <dd className="mt-1 text-text2">{item.note?.trim() || t("salesPayments.noteEmpty")}</dd>
                    </div>
                  </dl>

                  <div className="border-t border-border pt-3">
                    <Button
                      label={t("salesPayments.detailAction")}
                      onClick={() => onOpenDetail(item.id)}
                      variant="secondary"
                      className="w-full"
                    />
                  </div>
                </article>
              ))
            )}
          </div>
          {footer}
        </>
      )}
    </section>
  );
}
