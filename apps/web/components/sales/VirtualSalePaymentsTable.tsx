"use client";

import { useState } from "react";
import { formatDate, formatPrice } from "@/lib/format";
import { EditIcon, SearchIcon, TrashIcon } from "@/components/ui/icons/TableIcons";
import type { SalePayment } from "@/lib/sales";
import { useLang } from "@/context/LangContext";
import { getPaymentStatusLabel, getPaymentMethodLabel } from "@/lib/status-labels";

type VirtualSalePaymentsTableProps = {
  saleId: string;
  payments: SalePayment[];
  onOpenPaymentCenter: (paymentId: string) => void;
  onEditPayment: (saleId: string, payment: SalePayment) => void;
  onDeletePayment: (saleId: string, payment: SalePayment) => void;
  canOpenPaymentCenter: boolean;
  canUpdatePayments: boolean;
};

const ROW_HEIGHT = 44;
const CONTAINER_HEIGHT = 280;
const OVERSCAN = 4;

export function VirtualSalePaymentsTable({
  saleId,
  payments,
  onOpenPaymentCenter,
  onEditPayment,
  onDeletePayment,
  canOpenPaymentCenter,
  canUpdatePayments,
}: VirtualSalePaymentsTableProps) {
  const { t } = useLang();
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = payments.length * ROW_HEIGHT;
  const visibleCount = Math.ceil(CONTAINER_HEIGHT / ROW_HEIGHT);
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(payments.length, startIndex + visibleCount + OVERSCAN * 2);
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
          <div className="absolute inset-x-0" style={{ transform: `translateY(${startIndex * ROW_HEIGHT}px)` }}>
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
                  {canOpenPaymentCenter ? (
                    <button
                      type="button"
                      onClick={() => onOpenPaymentCenter(payment.id)}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label={t("salesPayments.openInCenterAction")}
                      title={t("salesPayments.openInCenterAction")}
                    >
                      <SearchIcon />
                    </button>
                  ) : null}
                  {canUpdatePayments && payment.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => onEditPayment(saleId, payment)}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label={t("common.edit")}
                      title={t("common.edit")}
                    >
                      <EditIcon />
                    </button>
                  )}
                  {canUpdatePayments && payment.status !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => onDeletePayment(saleId, payment)}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-error/10 hover:text-error"
                      aria-label={t("common.delete")}
                      title={t("common.delete")}
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
