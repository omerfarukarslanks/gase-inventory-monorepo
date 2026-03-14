"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { formatDate, formatPrice } from "@/lib/format";
import type { SaleReturnListItem } from "@/lib/sales";
import { useLang } from "@/context/LangContext";

function buildCustomerName(item: SaleReturnListItem) {
  const name = [item.customer?.name, item.customer?.surname].filter(Boolean).join(" ").trim();
  return name || "-";
}

type SaleReturnsTableProps = {
  items: SaleReturnListItem[];
  loading: boolean;
  error: string;
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

export default function SaleReturnsTable({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: SaleReturnsTableProps) {
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
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2/40 text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("salesReturns.returnNoLabel")}</th>
              <th className="px-4 py-3">{t("salesReturns.saleLabel")}</th>
              <th className="px-4 py-3">{t("salesReturns.customerLabel")}</th>
              <th className="px-4 py-3">{t("salesReturns.storeLabel")}</th>
              <th className="px-4 py-3">{t("salesReturns.returnedAtLabel")}</th>
              <th className="px-4 py-3">{t("salesReturns.lineCountLabel")}</th>
              <th className="px-4 py-3 text-right">{t("salesReturns.totalRefundLabel")}</th>
              <th className="px-4 py-3 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-sm text-muted">
                  {t("salesReturns.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                  {t("salesReturns.noResults")}
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
                      {item.returnNo ?? item.id}
                    </button>
                    {item.notes ? <div className="mt-1 text-xs text-muted">{item.notes}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-text">{item.saleReference ?? item.saleId ?? "-"}</td>
                  <td className="px-4 py-3 text-text2">{buildCustomerName(item)}</td>
                  <td className="px-4 py-3 text-text2">{item.store?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-text2">{formatDate(item.returnedAt ?? undefined)}</td>
                  <td className="px-4 py-3 text-text">{item.lineCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-text">{formatPrice(item.totalRefundAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      label={t("salesReturns.detailAction")}
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
