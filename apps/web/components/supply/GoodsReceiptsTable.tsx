"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { useLang } from "@/context/LangContext";

export type GoodsReceiptListItem = {
  id: string;
  purchaseOrderId: string;
  purchaseOrderReference: string;
  warehouseId: string;
  warehouseName: string;
  storeName: string;
  receivedAt?: string;
  notes?: string | null;
  lineCount: number;
  totalReceivedQuantity: number;
};

type GoodsReceiptsTableProps = {
  items: GoodsReceiptListItem[];
  loading: boolean;
  error: string;
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

export default function GoodsReceiptsTable({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: GoodsReceiptsTableProps) {
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
              <th className="px-4 py-3">{t("supply.receipts.purchaseOrderLabel")}</th>
              <th className="px-4 py-3">{t("supply.receipts.storeLabel")}</th>
              <th className="px-4 py-3">{t("supply.receipts.warehouseLabel")}</th>
              <th className="px-4 py-3">{t("supply.receipts.receivedAtLabel")}</th>
              <th className="px-4 py-3">{t("supply.receipts.lineCountLabel")}</th>
              <th className="px-4 py-3">{t("supply.receipts.totalReceivedQuantityLabel")}</th>
              <th className="px-4 py-3 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                  {t("supply.receipts.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                  {t("supply.receipts.noResults")}
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
                      {item.purchaseOrderReference}
                    </button>
                    {item.notes ? <div className="mt-1 text-xs text-muted">{item.notes}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-text">{item.storeName}</td>
                  <td className="px-4 py-3 text-text2">{item.warehouseName}</td>
                  <td className="px-4 py-3 text-text2">{formatDate(item.receivedAt ?? undefined)}</td>
                  <td className="px-4 py-3 text-text">{item.lineCount}</td>
                  <td className="px-4 py-3 font-medium text-text">{item.totalReceivedQuantity}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      label={t("supply.receipts.detailAction")}
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
