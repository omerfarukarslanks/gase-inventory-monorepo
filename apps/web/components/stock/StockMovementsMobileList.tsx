"use client";

import type { ReactNode } from "react";
import { formatDate } from "@/lib/format";
import type { InventoryMovement } from "@/lib/inventory";
import { useLang } from "@/context/LangContext";
import { getMovementTypeLabel } from "@/components/stock/movement-types";

type StockMovementsMobileListProps = {
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

function LoadingCard() {
  return (
    <div className="space-y-3 rounded-xl2 border border-border bg-surface p-4">
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-surface2" />
    </div>
  );
}

export default function StockMovementsMobileList({
  items,
  loading,
  error,
  footer,
}: StockMovementsMobileListProps) {
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
                {t("stockMovements.noResults")}
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-text">
                        {item.productName ?? t("stockMovements.productFallback")}
                      </h2>
                      <p className="mt-1 truncate text-xs text-muted">
                        {item.variantName ?? t("stockMovements.variantFallback")}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${getQuantityClass(item.quantity)}`}>
                      {formatQuantity(item.quantity)}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("stockMovements.typeLabel")}</dt>
                      <dd className="mt-1">{getMovementTypeLabel(t, item.type)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("stockMovements.storeLabel")}</dt>
                      <dd className="mt-1">{item.storeName ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("stockMovements.warehouseLabel")}</dt>
                      <dd className="mt-1">{item.warehouseName ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("stockMovements.locationLabel")}</dt>
                      <dd className="mt-1">{item.locationName ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("stockMovements.referenceLabel")}</dt>
                      <dd className="mt-1">{item.reference ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("stockMovements.createdAtLabel")}</dt>
                      <dd className="mt-1">{formatDate(item.createdAt ?? undefined)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("stockMovements.reasonLabel")}</dt>
                      <dd className="mt-1">{item.reason ?? "-"}</dd>
                    </div>
                  </dl>
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
