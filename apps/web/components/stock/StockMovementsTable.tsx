"use client";

import type { ReactNode } from "react";
import TableSkeletonRows from "@/components/ui/TableSkeletonRows";
import { formatDate } from "@/lib/format";
import type { InventoryMovement } from "@/lib/inventory";
import { useLang } from "@/context/LangContext";
import { getMovementTypeLabel } from "@/components/stock/movement-types";

type StockMovementsTableProps = {
  items: InventoryMovement[];
  loading: boolean;
  error: string;
  footer?: ReactNode;
};

function formatQuantity(value: number | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function getQuantityClass(value: number) {
  if (value > 0) return "text-primary";
  if (value < 0) return "text-error";
  return "text-text";
}

export default function StockMovementsTable({
  items,
  loading,
  error,
  footer,
}: StockMovementsTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-4 text-sm text-error">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface2/40 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">{t("stockMovements.productLabel")}</th>
                <th className="px-4 py-3">{t("stockMovements.typeLabel")}</th>
                <th className="px-4 py-3 text-right">{t("stockMovements.quantityLabel")}</th>
                <th className="px-4 py-3">{t("stockMovements.storeLabel")}</th>
                <th className="px-4 py-3">{t("stockMovements.warehouseLabel")}</th>
                <th className="px-4 py-3">{t("stockMovements.locationLabel")}</th>
                <th className="px-4 py-3">{t("stockMovements.referenceLabel")}</th>
                <th className="px-4 py-3">{t("stockMovements.reasonLabel")}</th>
                <th className="px-4 py-3">{t("stockMovements.createdAtLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={6} cols={9} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">
                    {t("stockMovements.noResults")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text">{item.productName ?? t("stockMovements.productFallback")}</div>
                      <div className="mt-1 text-xs text-muted">{item.variantName ?? t("stockMovements.variantFallback")}</div>
                    </td>
                    <td className="px-4 py-3 text-text2">{getMovementTypeLabel(t, item.type)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${getQuantityClass(item.quantity)}`}>
                      {formatQuantity(item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-text2">{item.storeName ?? "-"}</td>
                    <td className="px-4 py-3 text-text2">{item.warehouseName ?? "-"}</td>
                    <td className="px-4 py-3 text-text2">{item.locationName ?? "-"}</td>
                    <td className="px-4 py-3 text-text2">{item.reference ?? "-"}</td>
                    <td className="px-4 py-3 text-text2">{item.reason ?? "-"}</td>
                    <td className="px-4 py-3 text-text2">{formatDate(item.createdAt ?? undefined)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {footer}
    </section>
  );
}
